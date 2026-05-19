"""Wonder Toys agent built on Microsoft Semantic Kernel + Anthropic Claude.

The conversation is held in a `ChatHistoryAgentThread` per user. We stream
deltas via `ChatCompletionAgent.invoke_stream` and inject `\\n\\n` paragraph
breaks when text resumes after a tool call so pre-tool and post-tool text
don't run together in the UI.
"""

import json
import os
from collections.abc import AsyncIterator
from contextlib import nullcontext

from semantic_kernel.agents import ChatCompletionAgent, ChatHistoryAgentThread
from semantic_kernel.connectors.ai import FunctionChoiceBehavior
from semantic_kernel.connectors.ai.anthropic import (
    AnthropicChatCompletion,
    AnthropicChatPromptExecutionSettings,
)
from semantic_kernel.contents import (
    ChatMessageContent,
    FunctionCallContent,
    StreamingChatMessageContent,
)

from backend.tools import WonderToysPlugin
from backend.context import current_user_id

# `using_session` tags emitted spans with `session.id`. The OpenInference
# instrumentation packages provide it when installed; we degrade to a no-op
# context manager so the no-observability tier still imports cleanly.
try:
    from openinference.instrumentation import using_session  # type: ignore
    from opentelemetry import trace as _otel_trace

    _HAS_TRACING = True
except ImportError:  # pragma: no cover — only hit in the no-observability tier
    def using_session(session_id: str):  # type: ignore[misc]
        return nullcontext()

    _otel_trace = None  # type: ignore[assignment]
    _HAS_TRACING = False


def _get_tracer():
    # Defer get_tracer until first call so we pick up the TracerProvider that
    # backend.tracing installed at import time (otherwise we'd capture the
    # ProxyTracerProvider from before tracing was wired).
    if _HAS_TRACING and _otel_trace is not None:
        return _otel_trace.get_tracer("backend.agent")
    return None

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


_MODEL_ID = "claude-sonnet-4-20250514"

# Per-user conversation threads, plus a turn counter so we can detect resets
# (e.g. browser refresh) and start a fresh thread.
_threads: dict[str, ChatHistoryAgentThread] = {}
_thread_turns: dict[str, int] = {}

_agent: ChatCompletionAgent | None = None


def get_agent() -> ChatCompletionAgent:
    global _agent
    if _agent is None:
        service = AnthropicChatCompletion(
            ai_model_id=_MODEL_ID,
            api_key=os.environ["ANTHROPIC_API_KEY"],
            service_id="anthropic",
        )
        # Auto tool calling needs to be configured via KernelArguments execution
        # settings on the agent so the LLM sees the tool descriptions and is told
        # it can invoke them.
        from semantic_kernel.functions import KernelArguments

        settings = AnthropicChatPromptExecutionSettings(
            service_id="anthropic",
            function_choice_behavior=FunctionChoiceBehavior.Auto(),
            max_tokens=4096,
        )
        _agent = ChatCompletionAgent(
            service=service,
            name="WonderToysAgent",
            instructions=SYSTEM_PROMPT,
            plugins=[WonderToysPlugin()],
            arguments=KernelArguments(settings=settings),
        )
    return _agent


async def stream_agent(messages: list[dict], user_id: str) -> AsyncIterator[str]:
    """Stream agent response as SSE events.

    Yields strings in the format: 'data: {"text":"..."}\\n\\n'
    Ends with 'data: [DONE]\\n\\n'
    """
    agent = get_agent()

    # Count completed assistant turns to detect a conversation reset.
    assistant_turns = len([m for m in messages if m.get("role") == "assistant"])
    existing_turns = _thread_turns.get(user_id, 0)

    if user_id not in _threads or assistant_turns < existing_turns:
        _threads[user_id] = ChatHistoryAgentThread()
        _thread_turns[user_id] = 0

    thread = _threads[user_id]

    user_messages = [m for m in messages if m.get("role") == "user"]
    if not user_messages:
        yield "data: [DONE]\n\n"
        return

    last_message = user_messages[-1].get("content", "")

    had_text_before = False
    pending_paragraph_break = False

    async def _on_intermediate(message: ChatMessageContent) -> None:
        # Any function-call message signals "after this, text resumes" — mark
        # so the next text delta gets a paragraph break injected.
        nonlocal pending_paragraph_break
        if message.items and any(
            isinstance(it, FunctionCallContent) for it in message.items
        ):
            pending_paragraph_break = True

    # Wrap the whole turn in a manual root span so `using_session` has a span
    # to tag. OpenLIT's auto-instrumented LLM spans nest under this and inherit
    # the `session.id` attribute via OTel context propagation.
    tracer = _get_tracer()
    if tracer is not None:
        agent_span_cm = tracer.start_as_current_span("agent")
    else:
        agent_span_cm = nullcontext()

    token = current_user_id.set(user_id)
    try:
      with agent_span_cm as _agent_span:
        if _agent_span is not None:
            _agent_span.set_attribute("openinference.span.kind", "AGENT")
            _agent_span.set_attribute("input.value", last_message)
            _agent_span.set_attribute("session.id", user_id)
        with using_session(user_id):
            async for response in agent.invoke_stream(
                messages=last_message,
                thread=thread,
                on_intermediate_message=_on_intermediate,
            ):
                # Persist the thread that comes back so the next turn continues it.
                if response.thread is not None:
                    thread = response.thread
                    _threads[user_id] = thread

                content = response.content
                # `response.content` is always a StreamingChatMessageContent here, but
                # may be empty or carry only metadata/tool-call items (no text yet).
                text_delta: str | None = None
                if isinstance(content, StreamingChatMessageContent):
                    text_delta = content.content or None
                    if not text_delta and content.items:
                        # Some chunks deliver text via StreamingTextContent items.
                        for it in content.items:
                            text = getattr(it, "text", None) or getattr(it, "content", None)
                            if text:
                                text_delta = (text_delta or "") + text
                if not text_delta:
                    continue

                if pending_paragraph_break and had_text_before:
                    yield f"data: {json.dumps({'text': chr(10) + chr(10)})}\n\n"
                pending_paragraph_break = False
                had_text_before = True
                yield f"data: {json.dumps({'text': text_delta})}\n\n"
    finally:
        current_user_id.reset(token)

    _thread_turns[user_id] = assistant_turns + 1
    yield "data: [DONE]\n\n"
