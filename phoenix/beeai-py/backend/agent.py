import asyncio
import json
from collections.abc import AsyncIterator
from contextlib import nullcontext
from typing import Any

from beeai_framework.agents.requirement import RequirementAgent
from beeai_framework.agents.requirement.events import RequirementAgentFinalAnswerEvent
from beeai_framework.backend import ChatModel
from beeai_framework.emitter import Emitter, EmitterOptions, EventMeta
from beeai_framework.memory import UnconstrainedMemory
from beeai_framework.tools import tool

# OpenInference's `using_session` tags emitted spans with session.id so AX/Phoenix
# can group multi-turn traces into a session. Only present when an observability
# tier is installed; no-observability falls back to a no-op context manager.
try:
    from openinference.instrumentation import using_session
except ImportError:
    def using_session(session_id: str):
        return nullcontext()

from backend.tools import (
    search_products,
    get_product_detail,
    purchase_product,
    check_order_status,
    cancel_order_tool,
)
from backend.context import current_user_id

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


# Per-user UnconstrainedMemory keyed by user_id for conversation memory across
# turns. BeeAI's RequirementAgent takes a `memory` instance; messages are
# appended to it automatically on each .run() call.
_memories: dict[str, UnconstrainedMemory] = {}
# Track expected assistant-turn count so we can detect resets (e.g. browser refresh)
_history_turns: dict[str, int] = {}

# Cache one agent per user — RequirementAgent is bound to a memory instance,
# so the simplest correct shape is one agent per user with its own memory.
_agents: dict[str, RequirementAgent] = {}

# Wrap the plain Python tool functions with BeeAI's @tool decorator so they
# can be passed to a RequirementAgent. The decorator picks up the function
# name, docstring, and Annotated[..., Field(description=...)] parameter
# metadata to build the JSON schema the LLM sees.
_search_products_tool = tool(search_products)
_get_product_detail_tool = tool(get_product_detail)
_purchase_product_tool = tool(purchase_product)
_check_order_status_tool = tool(check_order_status)
_cancel_order_tool = tool(cancel_order_tool)

_TOOLS = [
    _search_products_tool,
    _get_product_detail_tool,
    _purchase_product_tool,
    _check_order_status_tool,
    _cancel_order_tool,
]


def _build_agent(memory: UnconstrainedMemory) -> RequirementAgent:
    """Build a RequirementAgent bound to the given memory instance."""
    # Anthropic API key is read from ANTHROPIC_API_KEY env var by the LiteLLM
    # provider underneath AnthropicChatModel. Enable token streaming so the
    # FinalAnswer event fires with text deltas instead of one final aggregate.
    llm = ChatModel.from_name("anthropic:claude-sonnet-4-6")
    llm.parameters.stream = True

    return RequirementAgent(
        llm=llm,
        instructions=SYSTEM_PROMPT,
        tools=_TOOLS,
        memory=memory,
    )


def _get_or_build(user_id: str) -> RequirementAgent:
    if user_id not in _memories:
        _memories[user_id] = UnconstrainedMemory()
    if user_id not in _agents:
        _agents[user_id] = _build_agent(_memories[user_id])
    return _agents[user_id]


def _reset(user_id: str) -> None:
    _memories.pop(user_id, None)
    _agents.pop(user_id, None)
    _history_turns.pop(user_id, None)


async def stream_agent(messages: list[dict], user_id: str) -> AsyncIterator[str]:
    """Stream agent response as SSE events.

    Yields strings in the format: 'data: {"text":"..."}\n\n'
    Ends with 'data: [DONE]\n\n'
    """
    user_messages = [m for m in messages if m.get("role") == "user"]
    if not user_messages:
        yield "data: [DONE]\n\n"
        return

    last_message = user_messages[-1].get("content", "")

    # Detect conversation reset (browser refresh, etc.) by comparing assistant
    # turn counts against what we have on file.
    assistant_turns = sum(1 for m in messages if m.get("role") == "assistant")
    existing_turns = _history_turns.get(user_id, 0)
    if assistant_turns < existing_turns:
        _reset(user_id)

    agent = _get_or_build(user_id)

    loop = asyncio.get_running_loop()
    queue: asyncio.Queue = asyncio.Queue()
    SENTINEL = object()

    def _on_final_answer(data: RequirementAgentFinalAnswerEvent, _meta: EventMeta) -> None:
        # `delta` carries the just-produced text fragment when stream=True.
        if data.delta:
            loop.call_soon_threadsafe(queue.put_nowait, ("text", data.delta))

    def _on_tool_event(_data: Any, meta: EventMeta) -> None:
        # Tool spans fire under each tool's emitter; only "start" matters here
        # — we use it to inject a paragraph break when text resumes after.
        if meta.name == "start":
            loop.call_soon_threadsafe(queue.put_nowait, ("tool", None))

    token = current_user_id.set(user_id)
    try:
        # Tag spans with session.id so AX/Phoenix can group multi-turn traces
        # into one session for this user.
        with using_session(user_id):
            run_handle = agent.run(last_message).observe(
                lambda emitter: emitter.on("final_answer", _on_final_answer)
            )

            # Also subscribe to any nested tool emitters via the root emitter so
            # we can detect tool-call starts for the paragraph-break trick.
            cleanup_tools = Emitter.root().match(
                "tool.*.start",
                _on_tool_event,
                EmitterOptions(match_nested=True),
            )

            async def _drive() -> None:
                try:
                    await run_handle
                finally:
                    loop.call_soon_threadsafe(queue.put_nowait, SENTINEL)

            driver = asyncio.create_task(_drive())

            try:
                had_text_before = False
                in_tool_call = False

                while True:
                    item = await queue.get()
                    if item is SENTINEL:
                        break
                    kind, payload = item
                    if kind == "tool":
                        in_tool_call = True
                        continue
                    if kind == "text" and payload:
                        if in_tool_call and had_text_before:
                            yield f"data: {json.dumps({'text': chr(10) + chr(10)})}\n\n"
                        in_tool_call = False
                        had_text_before = True
                        yield f"data: {json.dumps({'text': payload})}\n\n"
            finally:
                cleanup_tools()

            # Surface any exception from the underlying run.
            await driver
    finally:
        current_user_id.reset(token)

    _history_turns[user_id] = assistant_turns + 1
    yield "data: [DONE]\n\n"
