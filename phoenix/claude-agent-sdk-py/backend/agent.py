import json
from collections.abc import AsyncIterator
from contextlib import nullcontext

from claude_agent_sdk import (
    ClaudeAgentOptions,
    ClaudeSDKClient,
    AssistantMessage,
    TextBlock,
    ToolUseBlock,
)

from backend.tools import wonder_toys_server, allowed_tools
from backend.context import current_user_id

# Tag spans with session.id so traces group by user. In the no-observability
# tier this is a no-op (the import lives behind a guard); the phoenix / ax
# tiers install openinference and the real `using_session` takes over.
try:
    from openinference.instrumentation import using_session  # type: ignore
except ImportError:
    def using_session(session_id: str):  # type: ignore[no-redef]
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


def _build_options() -> ClaudeAgentOptions:
    # The Wonder Toys tools are served in-process via `create_sdk_mcp_server`.
    # allowed_tools restricts the agent to just those tools (no Bash/file
    # access), and bypassPermissions auto-approves them for headless serving.
    # setting_sources=[] keeps the run isolated from any local ~/.claude
    # config so traces are reproducible.
    return ClaudeAgentOptions(
        system_prompt=SYSTEM_PROMPT,
        model="claude-sonnet-4-6",
        mcp_servers={"wonder_toys": wonder_toys_server},
        allowed_tools=allowed_tools,
        permission_mode="bypassPermissions",
        setting_sources=[],
    )


# Per-user ClaudeSDKClient for conversation memory. Each client owns a
# persistent SDK session that retains context across turns.
_clients: dict[str, ClaudeSDKClient] = {}
# Track expected turn count per session so we can detect resets (browser refresh)
_session_turns: dict[str, int] = {}


async def _get_client(user_id: str) -> ClaudeSDKClient:
    client = _clients.get(user_id)
    if client is None:
        client = ClaudeSDKClient(options=_build_options())
        await client.connect()
        _clients[user_id] = client
    return client


async def stream_agent(messages: list[dict], user_id: str) -> AsyncIterator[str]:
    """Stream agent response as SSE events.

    Yields strings in the format: 'data: {"text":"..."}\n\n'
    Ends with 'data: [DONE]\n\n'
    """
    # Count completed assistant turns in message history
    # This lets us detect when the conversation has been reset (e.g. browser refresh)
    assistant_turns = len([m for m in messages if m.get("role") == "assistant"])
    existing_turns = _session_turns.get(user_id, 0)

    if user_id not in _clients or assistant_turns < existing_turns:
        # Tear down any stale session (new conversation or conversation reset)
        old = _clients.pop(user_id, None)
        if old is not None:
            await old.disconnect()
        _session_turns[user_id] = 0

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
        with using_session(user_id):
            client = await _get_client(user_id)
            await client.query(last_message)
            async for message in client.receive_response():
                if not isinstance(message, AssistantMessage):
                    continue
                for block in message.content:
                    if isinstance(block, ToolUseBlock):
                        in_tool_call = True
                        continue
                    if isinstance(block, TextBlock):
                        text_delta = block.text
                        if not text_delta:
                            continue
                        if in_tool_call and had_text_before:
                            yield f"data: {json.dumps({'text': chr(10) + chr(10)})}\n\n"
                        in_tool_call = False
                        had_text_before = True
                        yield f"data: {json.dumps({'text': text_delta})}\n\n"
    finally:
        current_user_id.reset(token)

    # Update session turn count after successful response
    _session_turns[user_id] = assistant_turns + 1

    yield "data: [DONE]\n\n"
