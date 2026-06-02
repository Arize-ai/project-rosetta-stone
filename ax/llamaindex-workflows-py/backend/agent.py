"""Wonder Toys agent built on LlamaIndex Workflows.

Unlike the sibling `llamaindex-py` tier (which uses the higher-level
`FunctionAgent`), this tier hand-rolls the ReAct loop as an event-driven
Workflow with `@step` decorators and custom event types. The streaming
loop manually:

1. Calls `llm.astream_chat_with_tools(tools, chat_history=...)` to get
   token deltas plus any pending tool calls.
2. Writes each text delta to the workflow stream via
   `ctx.write_event_to_stream(StreamEvent(delta=...))`.
3. If the response includes tool calls, executes each one and routes
   back into the LLM step until the model returns a final answer.

The Next.js layer consumes `handler.stream_events()` to forward
deltas to the browser as SSE.
"""

import json
import os
from collections.abc import AsyncIterator

from llama_index.core.llms import ChatMessage
from llama_index.core.tools import FunctionTool, ToolSelection
from llama_index.core.workflow import (
    Context,
    Event,
    StartEvent,
    StopEvent,
    Workflow,
    step,
)
from llama_index.llms.anthropic import Anthropic
from opentelemetry import context as otel_context, trace

from backend.context import current_user_id
from backend.tools import (
    cancel_order_tool,
    check_order_status,
    get_product_detail,
    purchase_product,
    search_products,
)

_tracer = trace.get_tracer(__name__)

SYSTEM_PROMPT = """You are a friendly and helpful shopping assistant for "Wonder Toys", a children's toy store. Your job is to help customers find the perfect toys, answer questions about products, and help them complete purchases.

## Your Capabilities
- Search for products by description, keywords, age range, or category
- Get detailed information about specific products
- Help customers purchase products (their credit card is already on file)
- Check order status for previous purchases
- Cancel orders that haven't been delivered yet

## Formatting Product Information

When displaying products, always use rich markdown formatting with images. This is critical for a good shopping experience.

**IMPORTANT: Image URLs must come EXACTLY from the `image` field returned by the tool (e.g. `/product-images/toy-001.png`). These are local paths starting with `/`. NEVER invent, guess, or use external URLs for images. Use the exact path from the tool result.**

### Search Results (multiple products)
For each product in search results, format as:

![Product Name](/product-images/toy-XXX.png)
**Product Name** — $price
⭐ rating (count ratings) · Ages age_range · by Manufacturer
Description text

### Product Details (single product, detailed view)
When showing a single product's details, format as:

![Product Name](/product-images/toy-XXX.png)
## Product Name
**$price** · ⭐ rating (count ratings) · Best Seller Rank #rank

**Ages:** age_range · **Category:** category · **By:** manufacturer
**Dimensions:** L×W×H inches, weight lbs
**In Stock:** inventory available

Description or marketing copy

## Guidelines
1. **Product Search**: When customers describe what they're looking for, use the search tool with relevant queries, keywords, and age filters. Be proactive about suggesting age-appropriate options.

2. **Product Details**: When a customer shows interest in a product, use the get-product tool and show the full detailed view with the product image, marketing copy, dimensions, rating, manufacturer, and best seller rank.

3. **Purchasing**: Before completing a purchase:
   - Confirm the product(s) and quantities
   - Ask for shipping details (recipient name, street address, city, state/province, ZIP/postal code, country)
   - The customer's credit card is already saved in our system, so just confirm they'd like to proceed
   - After purchase, share the order ID and total

4. **Order Status**: Help customers check on their orders. They can provide an order ID, or describe what they ordered (e.g., "where's my dinosaur set?") and you'll search for matching orders.

5. **Order Cancellation**: Customers can cancel orders that are still processing or shipping. Use the cancel-order tool with the order ID. Delivered orders cannot be cancelled. Always confirm with the customer before cancelling.

6. **Tone**: Be warm, enthusiastic about toys, and helpful. Use a conversational tone appropriate for a toy store. Suggest related products when relevant.

7. **Important**: The user is authenticated. When making purchases or checking orders, the system automatically provides your user identification — you do not need to ask for or manage user IDs."""


# ---------------------------------------------------------------------------
# Workflow events
# ---------------------------------------------------------------------------


class StreamEvent(Event):
    """Emitted for every text delta from the LLM. Pushed to the workflow's
    stream so the FastAPI SSE handler can yield it to the browser."""

    delta: str


class LLMInputEvent(Event):
    """Re-enter the LLM step with an updated chat history (after a tool call)."""

    chat_history: list[ChatMessage]


class ToolCallEvent(Event):
    """One or more tool calls returned by the LLM; need to be executed."""

    tool_calls: list[ToolSelection]
    chat_history: list[ChatMessage]


# ---------------------------------------------------------------------------
# Workflow
# ---------------------------------------------------------------------------


_llm: Anthropic | None = None


def _get_llm() -> Anthropic:
    global _llm
    if _llm is None:
        _llm = Anthropic(
            model="claude-sonnet-4-20250514",
            api_key=os.environ.get("ANTHROPIC_API_KEY"),
            max_tokens=4096,
        )
    return _llm


# Wrap the plain Python tool functions as LlamaIndex FunctionTools so the
# Workflow's LLM step can pass them to `astream_chat_with_tools`.
_TOOLS: list[FunctionTool] = [
    FunctionTool.from_defaults(fn=search_products),
    FunctionTool.from_defaults(fn=get_product_detail),
    FunctionTool.from_defaults(fn=purchase_product),
    FunctionTool.from_defaults(fn=check_order_status),
    FunctionTool.from_defaults(fn=cancel_order_tool),
]
_TOOLS_BY_NAME: dict[str, FunctionTool] = {t.metadata.name: t for t in _TOOLS}


class WonderToysWorkflow(Workflow):
    """Event-driven ReAct loop for the Wonder Toys assistant.

    Three steps:
      - `prepare_chat_history` (StartEvent → LLMInputEvent): seeds the
        chat history from the incoming messages.
      - `handle_llm_input`     (LLMInputEvent → ToolCallEvent | StopEvent):
        streams tokens from Claude. If the model emits tool calls, route
        them; otherwise stop.
      - `handle_tool_calls`    (ToolCallEvent → LLMInputEvent): executes
        each tool call and feeds the results back into the LLM step.
    """

    @step
    async def prepare_chat_history(
        self, ctx: Context, ev: StartEvent
    ) -> LLMInputEvent:
        history: list[ChatMessage] = list(ev.history or [])
        history.append(ChatMessage(role="user", content=ev.user_msg))
        return LLMInputEvent(chat_history=history)

    @step
    async def handle_llm_input(
        self, ctx: Context, ev: LLMInputEvent
    ) -> ToolCallEvent | StopEvent:
        llm = _get_llm()
        had_text_before = bool(await ctx.store.get("had_text_before", default=False))
        in_tool_call = bool(await ctx.store.get("in_tool_call", default=False))

        chat_history = list(ev.chat_history)

        response_stream = await llm.astream_chat_with_tools(
            tools=_TOOLS,
            chat_history=chat_history,
        )

        last_response = None
        async for response in response_stream:
            last_response = response
            delta = response.delta or ""
            if not delta:
                continue
            # Inject a paragraph break when text resumes after a tool call,
            # so pre-tool and post-tool prose don't run together.
            if in_tool_call and had_text_before:
                ctx.write_event_to_stream(StreamEvent(delta="\n\n"))
            in_tool_call = False
            had_text_before = True
            ctx.write_event_to_stream(StreamEvent(delta=delta))

        await ctx.store.set("had_text_before", had_text_before)
        await ctx.store.set("in_tool_call", in_tool_call)

        if last_response is None:
            return StopEvent(result={"history": chat_history})

        # Append the assistant's message (text + any tool_calls) to history.
        chat_history.append(last_response.message)

        tool_calls = llm.get_tool_calls_from_response(
            last_response, error_on_no_tool_call=False
        )
        if not tool_calls:
            return StopEvent(result={"history": chat_history})

        await ctx.store.set("in_tool_call", True)
        return ToolCallEvent(tool_calls=tool_calls, chat_history=chat_history)

    @step
    async def handle_tool_calls(
        self, ctx: Context, ev: ToolCallEvent
    ) -> LLMInputEvent:
        chat_history = list(ev.chat_history)

        for tc in ev.tool_calls:
            tool = _TOOLS_BY_NAME.get(tc.tool_name)
            if tool is None:
                content = json.dumps({"error": f"Unknown tool: {tc.tool_name}"})
            else:
                try:
                    result = await tool.acall(**tc.tool_kwargs)
                    content = str(result)
                except Exception as exc:  # noqa: BLE001 — surface to LLM
                    content = json.dumps({"error": str(exc)})

            chat_history.append(
                ChatMessage(
                    role="tool",
                    content=content,
                    additional_kwargs={"tool_call_id": tc.tool_id},
                )
            )

        return LLMInputEvent(chat_history=chat_history)


# Per-user message history keyed by user_id for multi-turn memory.
_histories: dict[str, list[ChatMessage]] = {}
# Track expected turn count so a browser refresh (shorter incoming history)
# resets the in-memory store.
_history_turns: dict[str, int] = {}


async def stream_agent(messages: list[dict], user_id: str) -> AsyncIterator[str]:
    """Stream agent response as SSE events.

    Yields strings in the format: 'data: {"text":"..."}\n\n'
    Ends with 'data: [DONE]\n\n'
    """
    assistant_turns = len([m for m in messages if m.get("role") == "assistant"])
    existing_turns = _history_turns.get(user_id, 0)

    if user_id not in _histories or assistant_turns < existing_turns:
        _histories[user_id] = []
        _history_turns[user_id] = 0

    history = _histories[user_id]

    user_messages = [m for m in messages if m.get("role") == "user"]
    if not user_messages:
        yield "data: [DONE]\n\n"
        return
    last_message = user_messages[-1].get("content", "")

    # Seed history with the system prompt on the very first turn.
    if not history:
        history.append(ChatMessage(role="system", content=SYSTEM_PROMPT))

    token = current_user_id.set(user_id)
    # Force a clean OTel context per request so leftover context from prior
    # runs doesn't reparent this trace under an earlier one. Same quirk the
    # FunctionAgent-based llamaindex-py tier hits.
    otel_token = otel_context.attach(otel_context.Context())
    full_response: list[str] = []
    try:
        # Manual root AGENT span: the LlamaIndex instrumentor doesn't add a
        # top-level span with input.value/output.value attributes, so we
        # create one here for Phoenix to display the user query and final
        # response at the trace level.
        with _tracer.start_as_current_span("agent") as span:
            span.set_attribute("openinference.span.kind", "AGENT")
            span.set_attribute("input.value", last_message)
            # `session.id` / `user.id` aren't auto-propagated by the LlamaIndex
            # OpenInference instrumentor — set them here so the trace surfaces
            # session grouping in the Phoenix / AX UIs.
            span.set_attribute("session.id", user_id)
            span.set_attribute("user.id", user_id)

            workflow = WonderToysWorkflow(timeout=120, verbose=False)
            handler = workflow.run(user_msg=last_message, history=history)

            async for event in handler.stream_events():
                if isinstance(event, StreamEvent) and event.delta:
                    full_response.append(event.delta)
                    yield f"data: {json.dumps({'text': event.delta})}\n\n"

            # Await handler after stream_events() so the workflow fully
            # closes its internal dispatcher spans before the next request.
            result = await handler
            if isinstance(result, dict) and "history" in result:
                _histories[user_id] = result["history"]
            _history_turns[user_id] = assistant_turns + 1

            span.set_attribute("output.value", "".join(full_response))
    finally:
        otel_context.detach(otel_token)
        current_user_id.reset(token)

    yield "data: [DONE]\n\n"
