import os
import json
from collections.abc import AsyncIterator

from agent_framework import Agent, AgentSession
from agent_framework.anthropic import AnthropicClient

from backend.tools import all_tools
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


# Per-user sessions: keyed by user_id for conversation memory
_sessions: dict[str, AgentSession] = {}
# Track expected turn count per session so we can detect resets
_session_turns: dict[str, int] = {}

_agent: Agent | None = None


def get_agent() -> Agent:
    global _agent
    if _agent is None:
        client = AnthropicClient(
            model="claude-sonnet-4-20250514",
            api_key=os.environ.get("ANTHROPIC_API_KEY"),
        )
        _agent = Agent(
            client,
            instructions=SYSTEM_PROMPT,
            name="WonderToysAgent",
            tools=all_tools,
        )
    return _agent


async def stream_agent(messages: list[dict], user_id: str) -> AsyncIterator[str]:
    """Stream agent response as SSE events.

    Yields strings in the format: 'data: {"text":"..."}\n\n'
    Ends with 'data: [DONE]\n\n'
    """
    agent = get_agent()

    # Count completed assistant turns in message history
    # This lets us detect when the conversation has been reset (e.g. browser refresh)
    assistant_turns = len([m for m in messages if m.get("role") == "assistant"])

    existing_turns = _session_turns.get(user_id, 0)

    if user_id not in _sessions or assistant_turns < existing_turns:
        # Create a fresh session (new conversation or conversation reset)
        _sessions[user_id] = agent.create_session()
        _session_turns[user_id] = 0

    session = _sessions[user_id]

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
        async for chunk in agent.run(last_message, stream=True, session=session):
            # Detect tool-related content blocks to inject paragraph breaks
            for content in chunk.contents or []:
                if content.type == "function_call":
                    in_tool_call = True
                    break

            if chunk.text:
                if in_tool_call and had_text_before:
                    yield f"data: {json.dumps({'text': chr(10) + chr(10)})}\n\n"
                in_tool_call = False
                had_text_before = True
                yield f"data: {json.dumps({'text': chunk.text})}\n\n"
    finally:
        current_user_id.reset(token)

    # Update session turn count after successful response
    _session_turns[user_id] = assistant_turns + 1

    yield "data: [DONE]\n\n"
