import json
from collections.abc import AsyncIterator

from agno.agent import Agent
from agno.db.in_memory import InMemoryDb
from agno.models.anthropic import Claude
from agno.run.agent import (
    RunContentEvent,
    ToolCallStartedEvent,
)

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


# Track the last-seen assistant turn count per user so we can detect a
# browser-refresh reset. Agno's InMemoryDb stores conversation history itself,
# keyed by session_id, so the session_id needs to stay stable across normal
# turns and only roll forward when the client-side history shrinks (refresh).
_last_assistant_turns: dict[str, int] = {}
# Per-user session-generation counter — bumped on a reset, appended to user_id
# to form the Agno session_id.
_session_gen: dict[str, int] = {}

_agent: Agent | None = None


def get_agent() -> Agent:
    global _agent
    if _agent is None:
        # Anthropic API key is read from ANTHROPIC_API_KEY env var by the
        # agno.models.anthropic.Claude provider.
        # InMemoryDb + add_history_to_context=True lets Agno automatically
        # thread prior turns into the next prompt when we reuse session_id.
        _agent = Agent(
            name="WonderToysAgent",
            model=Claude(id="claude-sonnet-4-20250514"),
            system_message=SYSTEM_PROMPT,
            db=InMemoryDb(),
            add_history_to_context=True,
            num_history_runs=20,
            tools=[
                search_products,
                get_product_detail,
                purchase_product,
                check_order_status,
                cancel_order_tool,
            ],
            telemetry=False,
        )
    return _agent


def _session_id_for(user_id: str) -> str:
    """Stable Agno session_id per user — only rolls forward on reset so
    InMemoryDb history persists across turns."""
    return f"{user_id}:{_session_gen.get(user_id, 0)}"


async def stream_agent(messages: list[dict], user_id: str) -> AsyncIterator[str]:
    """Stream agent response as SSE events.

    Yields strings in the format: 'data: {"text":"..."}\n\n'
    Ends with 'data: [DONE]\n\n'
    """
    agent = get_agent()

    # Count completed assistant turns in message history.
    # This lets us detect when the conversation has been reset (e.g. browser refresh).
    assistant_turns = len([m for m in messages if m.get("role") == "assistant"])
    last_seen = _last_assistant_turns.get(user_id, 0)
    if assistant_turns < last_seen:
        # Conversation was reset client-side — bump the generation counter
        # so the next session_id is unique and history starts fresh.
        _session_gen[user_id] = _session_gen.get(user_id, 0) + 1

    session_id = _session_id_for(user_id)

    # Extract the latest user message to send to the agent
    user_messages = [m for m in messages if m.get("role") == "user"]
    if not user_messages:
        yield "data: [DONE]\n\n"
        return

    last_message = user_messages[-1].get("content", "")

    had_text_before = False
    in_tool_call = False

    # Set the current user ID in the context var so tools can access it
    token = current_user_id.set(user_id)
    try:
        # Agno streams a sequence of typed events. RunContentEvent carries text
        # deltas in `.content`; ToolCallStartedEvent marks where we should
        # inject a paragraph break between pre-tool and post-tool text.
        async for event in agent.arun(
            input=last_message,
            user_id=user_id,
            session_id=session_id,
            stream=True,
            stream_events=True,
        ):
            if isinstance(event, ToolCallStartedEvent):
                in_tool_call = True
                continue

            if isinstance(event, RunContentEvent):
                text_delta = event.content
                if not text_delta or not isinstance(text_delta, str):
                    continue
                if in_tool_call and had_text_before:
                    yield f"data: {json.dumps({'text': chr(10) + chr(10)})}\n\n"
                in_tool_call = False
                had_text_before = True
                yield f"data: {json.dumps({'text': text_delta})}\n\n"
    finally:
        current_user_id.reset(token)

    # Track the new turn count so we can detect a future reset
    _last_assistant_turns[user_id] = assistant_turns + 1

    yield "data: [DONE]\n\n"
