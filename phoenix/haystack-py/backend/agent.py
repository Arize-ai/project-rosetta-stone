"""Wonder Toys agent built on Haystack 2.

Haystack's streaming model is callback-based: the LLM (and Agent) push
StreamingChunk objects into a `streaming_callback` while `Agent.run_async`
runs to completion. To produce SSE deltas, we bridge those callback
invocations into an `asyncio.Queue` consumed by `stream_agent`.

Key Haystack-specific points:
  - `AnthropicChatGenerator` is the chat generator; it surfaces tool_calls
    natively so Haystack's `Agent` can route them to registered tools.
  - `StreamingChunk.content` carries text deltas. `tool_calls` is a list of
    ToolCallDelta objects (tool-call announcement) and is mutually
    exclusive with `content`. `tool_call_result` carries tool outputs.
  - Conversation history is a `list[ChatMessage]`. We keep one per user
    and replace it with `result["messages"]` after each turn so the agent
    sees prior turns + tool calls / results.
"""

import asyncio
import json
from collections.abc import AsyncIterator
from contextlib import nullcontext

from haystack.components.agents import Agent
from haystack.dataclasses import ChatMessage, StreamingChunk
from haystack_integrations.components.generators.anthropic import (
    AnthropicChatGenerator,
)

# `using_session` is provided by the openinference observability stack and
# tags every span emitted inside the with-block with `session.id`. In the
# no-observability tier the package isn't installed; fall back to a no-op.
try:
    from openinference.instrumentation import using_session
except ImportError:  # pragma: no cover - exercised in no-observability tier
    def using_session(session_id: str):
        return nullcontext()

from backend.context import current_user_id
from backend.tools import all_tools


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


# Per-user conversation history (list of ChatMessage). Keyed by user_id.
_histories: dict[str, list[ChatMessage]] = {}
# Track expected assistant-turn count per history so we can detect resets
_history_turns: dict[str, int] = {}


def _build_agent(streaming_cb) -> Agent:
    """Build a fresh Agent wired to the given streaming callback.

    Constructing per-request keeps the chat generator stateless — Haystack's
    streaming_callback is set at component init time and bridges into our
    per-request asyncio.Queue.
    """
    generator = AnthropicChatGenerator(
        model="claude-sonnet-4-6",
        streaming_callback=streaming_cb,
    )
    agent = Agent(
        chat_generator=generator,
        tools=all_tools,
        system_prompt=SYSTEM_PROMPT,
        exit_conditions=["text"],
        streaming_callback=streaming_cb,
    )
    # Haystack Agent must be warm_up'd before run_async (initializes its
    # internal pipeline). Cheap and idempotent.
    agent.warm_up()
    return agent


async def stream_agent(messages: list[dict], user_id: str) -> AsyncIterator[str]:
    """Stream agent response as SSE events.

    Yields strings in the format: 'data: {"text":"..."}\\n\\n'
    Ends with 'data: [DONE]\\n\\n'
    """
    # Count completed assistant turns in message history
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
    run_messages = list(history) + [ChatMessage.from_user(last_message)]

    # Bridge Haystack's push-based streaming into our pull-based SSE generator.
    queue: asyncio.Queue = asyncio.Queue()
    SENTINEL = object()

    async def streaming_callback(chunk: StreamingChunk) -> None:
        await queue.put(chunk)

    agent = _build_agent(streaming_callback)

    token = current_user_id.set(user_id)

    async def run_agent() -> dict:
        try:
            # `using_session` tags every span emitted during the agent run
            # with `session.id=user_id` so traces group per chat session in
            # Phoenix / Arize AX. Haystack's OpenInference instrumentation
            # does not emit `session.id` on its own.
            with using_session(user_id):
                return await agent.run_async(messages=run_messages)
        finally:
            await queue.put(SENTINEL)

    run_task = asyncio.create_task(run_agent())

    had_text_before = False
    in_tool_call = False

    try:
        while True:
            chunk = await queue.get()
            if chunk is SENTINEL:
                break

            # Tool-call deltas / results are signaled via the dedicated fields.
            if chunk.tool_calls:
                in_tool_call = True
                continue
            if chunk.tool_call_result is not None:
                # Tool result delivered — stay in tool-call mode until text resumes.
                continue

            text_delta = chunk.content
            if text_delta:
                if in_tool_call and had_text_before:
                    yield f"data: {json.dumps({'text': chr(10) + chr(10)})}\n\n"
                in_tool_call = False
                had_text_before = True
                yield f"data: {json.dumps({'text': text_delta})}\n\n"

        # Surface any agent exception and capture the final messages
        result = await run_task

        # Persist the full message log for the next turn
        if isinstance(result, dict) and "messages" in result:
            _histories[user_id] = result["messages"]
    finally:
        if not run_task.done():
            run_task.cancel()
        current_user_id.reset(token)

    _history_turns[user_id] = assistant_turns + 1

    yield "data: [DONE]\n\n"
