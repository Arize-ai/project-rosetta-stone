import os
import json
from collections.abc import AsyncIterator

from langchain_anthropic import ChatAnthropic
from langgraph.prebuilt import create_react_agent

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

7. **Important**: You have a userId available in the conversation context. Always use it when making purchases or checking orders. The userId will be provided in the system context."""


def _build_agent():
    model = ChatAnthropic(
        model="claude-sonnet-4-20250514",
        api_key=os.environ.get("ANTHROPIC_API_KEY"),
    )
    return create_react_agent(model, all_tools, prompt=SYSTEM_PROMPT)


_agent = None


def get_agent():
    global _agent
    if _agent is None:
        _agent = _build_agent()
    return _agent


async def stream_agent(messages: list[dict], user_id: str) -> AsyncIterator[str]:
    """Stream agent response as SSE events.

    Yields strings in the format: 'data: {"text":"..."}\n\n'
    Ends with 'data: [DONE]\n\n'
    """
    agent = get_agent()

    # Build LangChain message list
    from langchain_core.messages import HumanMessage, AIMessage, SystemMessage

    lc_messages = [
        SystemMessage(
            content=f"The current authenticated user's ID is: {user_id}. "
            "Use this userId when making purchases or checking order status."
        ),
    ]

    for msg in messages:
        role = msg.get("role", "user")
        content = msg.get("content", "")
        if role == "user":
            lc_messages.append(HumanMessage(content=content))
        elif role == "assistant":
            lc_messages.append(AIMessage(content=content))
        elif role == "system":
            lc_messages.append(SystemMessage(content=content))

    had_text_before = False
    in_tool_call = False

    async for event in agent.astream_events(
        {"messages": lc_messages},
        version="v2",
        config={"recursion_limit": 25},
    ):
        kind = event["event"]

        if kind == "on_chat_model_stream":
            chunk = event["data"]["chunk"]
            # Check for tool call chunks
            if hasattr(chunk, "tool_call_chunks") and chunk.tool_call_chunks:
                in_tool_call = True
                continue

            # Check for text content
            text = ""
            if isinstance(chunk.content, str):
                text = chunk.content
            elif isinstance(chunk.content, list):
                for block in chunk.content:
                    if isinstance(block, dict) and block.get("type") == "text":
                        text += block.get("text", "")

            if text:
                if in_tool_call and had_text_before:
                    yield f"data: {json.dumps({'text': chr(10) + chr(10)})}\n\n"
                in_tool_call = False
                had_text_before = True
                yield f"data: {json.dumps({'text': text})}\n\n"

        elif kind == "on_tool_start":
            in_tool_call = True

    yield "data: [DONE]\n\n"
