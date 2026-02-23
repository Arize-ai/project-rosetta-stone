import os
import json
from collections.abc import AsyncIterator

from opentelemetry import context as otel_context, trace
from llama_index.core.agent.workflow import FunctionAgent, AgentStream, ToolCall
from llama_index.llms.anthropic import Anthropic
from llama_index.core.llms import ChatMessage

from backend.tools import all_tools

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

7. **Important**: You have a userId available in the conversation context. Always use it when making purchases or checking orders. The userId will be provided in the system context."""


_llm = None


def _get_llm():
    global _llm
    if _llm is None:
        _llm = Anthropic(
            model="claude-sonnet-4-20250514",
            api_key=os.environ.get("ANTHROPIC_API_KEY"),
            max_tokens=4096,
        )
    return _llm


def get_agent():
    return FunctionAgent(
        tools=all_tools,
        llm=_get_llm(),
        system_prompt=SYSTEM_PROMPT,
    )


async def stream_agent(messages: list[dict], user_id: str) -> AsyncIterator[str]:
    """Stream agent response as SSE events.

    Yields strings in the format: 'data: {"text":"..."}\n\n'
    Ends with 'data: [DONE]\n\n'
    """
    agent = get_agent()

    # Build chat history from messages, injecting user context
    chat_history = [
        ChatMessage(
            role="system",
            content=f"The current authenticated user's ID is: {user_id}. "
            "Use this userId when making purchases or checking order status.",
        ),
    ]

    for msg in messages:
        role = msg.get("role", "user")
        content = msg.get("content", "")
        if role in ("user", "assistant", "system"):
            chat_history.append(ChatMessage(role=role, content=content))

    # Extract the last user message as the query
    user_msg = ""
    for msg in reversed(chat_history):
        if msg.role == "user":
            user_msg = msg.content
            chat_history.remove(msg)
            break

    if not user_msg:
        yield f"data: {json.dumps({'text': 'No message provided.'})}\n\n"
        yield "data: [DONE]\n\n"
        return

    had_text_before = False
    in_tool_call = False
    full_response = []

    # Force a clean OTel context so each request gets its own trace.
    # Without this, leftover context from prior runs causes child spans
    # to disconnect from the root span.
    token = otel_context.attach(otel_context.Context())
    try:
        with _tracer.start_as_current_span("agent") as span:
            span.set_attribute("openinference.span.kind", "AGENT")
            span.set_attribute("input.value", user_msg)

            handler = agent.run(user_msg=user_msg, chat_history=chat_history)

            async for event in handler.stream_events():
                if isinstance(event, AgentStream):
                    text = event.delta
                    if text:
                        if in_tool_call and had_text_before:
                            yield f"data: {json.dumps({'text': chr(10) + chr(10)})}\n\n"
                        in_tool_call = False
                        had_text_before = True
                        full_response.append(text)
                        yield f"data: {json.dumps({'text': text})}\n\n"

                elif isinstance(event, ToolCall):
                    in_tool_call = True

            # Await handler to ensure workflow fully cleans up its
            # internal spans before the next request starts.
            await handler

            span.set_attribute("output.value", "".join(full_response))
    finally:
        otel_context.detach(token)

    yield "data: [DONE]\n\n"
