import json
import os
from collections.abc import AsyncIterator
from contextlib import nullcontext

from strands import Agent
from strands.models.anthropic import AnthropicModel

from backend.tools import (
    search_products,
    get_product_detail,
    purchase_product,
    check_order_status,
    cancel_order_tool,
)
from backend.context import current_user_id

# `using_session` tags emitted spans with `session.id`. The OpenInference
# instrumentation packages provide it when installed; we degrade to a no-op
# context manager so the no-observability tier still imports cleanly.
try:
    from openinference.instrumentation import using_session  # type: ignore
except ImportError:  # pragma: no cover — only hit in the no-observability tier
    def using_session(session_id: str):  # type: ignore[misc]
        return nullcontext()

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


# Per-user Agent instances. Strands Agents keep their own `messages` list across
# invocations, so we cache one Agent per user_id and reuse it for multi-turn
# conversations. When the incoming history shrinks (e.g. browser refresh) we
# reset the per-user Agent so we don't replay stale context.
_agents: dict[str, Agent] = {}
_history_turns: dict[str, int] = {}


def _build_agent(user_id: str) -> Agent:
    """Create a fresh Strands Agent wired to Claude via the direct Anthropic API.

    `client_args` is forwarded to the underlying Anthropic SDK client — we let
    the SDK pick up `ANTHROPIC_API_KEY` from the environment.

    `trace_attributes` adds attributes to every span the Agent emits. We use
    it to inject `session.id` / `user.id` because the Strands OpenInference
    processor doesn't propagate baggage from `using_session()` onto spans.
    """
    model = AnthropicModel(
        client_args={"api_key": os.environ["ANTHROPIC_API_KEY"]},
        model_id="claude-sonnet-4-6",
        max_tokens=4096,
        params={"temperature": 0.7},
    )
    return Agent(
        name="WonderToysAgent",
        model=model,
        system_prompt=SYSTEM_PROMPT,
        tools=[
            search_products,
            get_product_detail,
            purchase_product,
            check_order_status,
            cancel_order_tool,
        ],
        trace_attributes={
            "session.id": user_id,
            "user.id": user_id,
        },
    )


def _get_or_reset_agent(user_id: str, assistant_turns: int) -> Agent:
    """Return a per-user Agent, resetting it when the conversation has rewound."""
    existing_turns = _history_turns.get(user_id, 0)
    agent = _agents.get(user_id)
    if agent is None or assistant_turns < existing_turns:
        agent = _build_agent(user_id)
        _agents[user_id] = agent
        _history_turns[user_id] = 0
    return agent


async def stream_agent(messages: list[dict], user_id: str) -> AsyncIterator[str]:
    """Stream agent response as SSE events.

    Yields strings in the format: 'data: {"text":"..."}\n\n'
    Ends with 'data: [DONE]\n\n'
    """
    assistant_turns = len([m for m in messages if m.get("role") == "assistant"])
    agent = _get_or_reset_agent(user_id, assistant_turns)

    user_messages = [m for m in messages if m.get("role") == "user"]
    if not user_messages:
        yield "data: [DONE]\n\n"
        return

    last_message = user_messages[-1].get("content", "")

    had_text_before = False
    in_tool_call = False

    # Set the current user ID in the context var so tools can access it. The
    # `using_session` wrap tags emitted spans with `session.id` — the Strands
    # OpenInference instrumentor does not auto-emit it, so we wrap each turn.
    token = current_user_id.set(user_id)
    try:
        with using_session(user_id):
            async for event in agent.stream_async(last_message):
                if not isinstance(event, dict):
                    continue

                # Tool-call events arrive as {"current_tool_use": {"name": ..., ...}}
                tool_use = event.get("current_tool_use")
                if tool_use and tool_use.get("name"):
                    in_tool_call = True
                    continue

                # Text deltas arrive as {"data": "<chunk>"}
                text_delta = event.get("data")
                if text_delta:
                    if in_tool_call and had_text_before:
                        yield f"data: {json.dumps({'text': chr(10) + chr(10)})}\n\n"
                    in_tool_call = False
                    had_text_before = True
                    yield f"data: {json.dumps({'text': text_delta})}\n\n"
    finally:
        current_user_id.reset(token)

    _history_turns[user_id] = assistant_turns + 1
    yield "data: [DONE]\n\n"
