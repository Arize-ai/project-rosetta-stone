import json
from collections.abc import AsyncIterator

from google.adk.agents import Agent
from google.adk.agents.run_config import RunConfig, StreamingMode
from google.adk.models.lite_llm import LiteLlm
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai import types

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


APP_NAME = "wonder-toys"

# Track expected turn count per user so we can detect browser-refresh resets.
# ADK's session service stores conversation history itself; we just need to
# know when to roll the session_id forward.
_session_turns: dict[str, int] = {}

_agent: Agent | None = None
_runner: Runner | None = None
_session_service: InMemorySessionService | None = None


def get_runner() -> Runner:
    global _agent, _runner, _session_service
    if _runner is None:
        # LiteLLM forwards Anthropic streaming token-by-token. ANTHROPIC_API_KEY
        # is read from the environment by litellm's anthropic provider.
        _agent = Agent(
            name="WonderToysAgent",
            model=LiteLlm(model="anthropic/claude-sonnet-4-20250514"),
            instruction=SYSTEM_PROMPT,
            tools=[
                search_products,
                get_product_detail,
                purchase_product,
                check_order_status,
                cancel_order_tool,
            ],
        )
        _session_service = InMemorySessionService()
        _runner = Runner(
            agent=_agent,
            app_name=APP_NAME,
            session_service=_session_service,
        )
    return _runner


def _session_id_for(user_id: str) -> str:
    """Derive the ADK session_id from user_id + turn counter so we can roll
    forward when the conversation resets (browser refresh)."""
    return f"{user_id}:{_session_turns.get(user_id, 0)}"


async def stream_agent(messages: list[dict], user_id: str) -> AsyncIterator[str]:
    """Stream agent response as SSE events.

    Yields strings in the format: 'data: {"text":"..."}\n\n'
    Ends with 'data: [DONE]\n\n'
    """
    runner = get_runner()
    assert _session_service is not None

    # Count completed assistant turns in message history
    # This lets us detect when the conversation has been reset (e.g. browser refresh)
    assistant_turns = len([m for m in messages if m.get("role") == "assistant"])
    existing_turns = _session_turns.get(user_id, 0)
    if assistant_turns < existing_turns:
        # Conversation was reset client-side — roll forward to a fresh session_id
        _session_turns[user_id] = assistant_turns

    session_id = _session_id_for(user_id)

    # Lazily create the ADK session if it doesn't exist yet
    if (
        await _session_service.get_session(
            app_name=APP_NAME, user_id=user_id, session_id=session_id
        )
        is None
    ):
        await _session_service.create_session(
            app_name=APP_NAME, user_id=user_id, session_id=session_id
        )

    user_messages = [m for m in messages if m.get("role") == "user"]
    if not user_messages:
        yield "data: [DONE]\n\n"
        return

    last_message = user_messages[-1].get("content", "")
    user_content = types.Content(
        role="user", parts=[types.Part.from_text(text=last_message)]
    )

    had_text_before = False
    in_tool_call = False

    # Set the current user ID in the context var so tools can access it
    token = current_user_id.set(user_id)
    try:
        async for event in runner.run_async(
            user_id=user_id,
            session_id=session_id,
            new_message=user_content,
            run_config=RunConfig(streaming_mode=StreamingMode.SSE),
        ):
            if not event.content or not event.content.parts:
                continue

            for part in event.content.parts:
                # Detect tool-call boundaries (function_call parts arrive as
                # complete, non-partial events from the LLM).
                if part.function_call:
                    in_tool_call = True
                    continue

                # Only forward partial text deltas to the SSE stream. The
                # final non-partial event re-emits the assembled text — skip
                # it to avoid double-streaming.
                if part.text and event.partial:
                    if in_tool_call and had_text_before:
                        yield f"data: {json.dumps({'text': chr(10) + chr(10)})}\n\n"
                    in_tool_call = False
                    had_text_before = True
                    yield f"data: {json.dumps({'text': part.text})}\n\n"
    finally:
        current_user_id.reset(token)

    # Successful turn — bump the counter for next time
    _session_turns[user_id] = assistant_turns + 1

    yield "data: [DONE]\n\n"
