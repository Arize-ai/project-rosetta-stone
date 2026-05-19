"""Wonder Toys agent backed by Microsoft AutoGen AgentChat.

AutoGen v0.4+ splits into a low-level `autogen-core` and the conversational
`autogen-agentchat` package. We use AgentChat's :class:`AssistantAgent` because
its tool-calling + streaming surface maps cleanly onto the SSE wire format
shared by the other Python tiers (token-level text deltas with paragraph
breaks injected around tool calls).

Key configuration choices for AssistantAgent:

* ``model_client_stream=True`` — yields ``ModelClientStreamingChunkEvent``
  values for each text delta from Claude (otherwise we'd only see the final
  aggregated text).
* ``reflect_on_tool_use=True`` — after a tool call, runs another LLM inference
  so the agent narrates results back to the user. Without it we'd only get a
  raw ``ToolCallSummaryMessage`` and the chat UI would render tool JSON.
* ``max_tool_iterations=10`` — allows multiple tool calls per turn (e.g.
  search -> get_product_detail -> purchase). Default is 1.

Per-user :class:`AssistantAgent` instances live in ``_agents`` to keep
conversation history isolated across users; AutoGen's agent state lives on
the instance and is only persistable via :meth:`save_state`/:meth:`load_state`.
"""

import json
from collections.abc import AsyncIterator
from contextlib import ExitStack, nullcontext

from autogen_agentchat.agents import AssistantAgent
from autogen_agentchat.messages import (
    ModelClientStreamingChunkEvent,
    ToolCallRequestEvent,
)
from autogen_ext.models.anthropic import AnthropicChatCompletionClient

from backend.tools import (
    search_products,
    get_product_detail,
    purchase_product,
    check_order_status,
    cancel_order_tool,
)
from backend.context import current_user_id

# The openinference autogen-agentchat instrumentor does not auto-emit
# ``session.id`` / ``user.id`` span attributes, so we wrap the agent call in
# ``using_session`` + ``using_user`` to tag spans manually. When the
# instrumentation package isn't installed (no-observability tier) we fall
# back to no-op context managers.
try:
    from openinference.instrumentation import using_session, using_user
except ImportError:  # pragma: no cover — only hit in no-observability tier
    def using_session(session_id: str):  # type: ignore[no-redef]
        return nullcontext()

    def using_user(user_id: str):  # type: ignore[no-redef]
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


# Per-user AssistantAgent instances — AutoGen keeps conversation history on
# the agent's model_context, so giving each user their own agent is the
# simplest way to isolate sessions.
_agents: dict[str, AssistantAgent] = {}
# Track the last-seen assistant turn count per user so a browser refresh
# (history shrinks) triggers a fresh agent.
_last_assistant_turns: dict[str, int] = {}


def _build_agent() -> AssistantAgent:
    """Construct a fresh AssistantAgent wired up with Claude + the 5 tools."""
    # ANTHROPIC_API_KEY is read from the environment by the client.
    model_client = AnthropicChatCompletionClient(model="claude-sonnet-4-20250514")
    return AssistantAgent(
        name="WonderToysAgent",
        model_client=model_client,
        system_message=SYSTEM_PROMPT,
        tools=[
            search_products,
            get_product_detail,
            purchase_product,
            check_order_status,
            cancel_order_tool,
        ],
        # Stream text deltas so we can forward each chunk to the SSE client.
        model_client_stream=True,
        # After a tool call, do another LLM pass so the agent narrates the
        # result back to the user instead of just dumping raw tool JSON.
        reflect_on_tool_use=True,
        # Allow the full chain: search -> detail -> purchase without truncation.
        max_tool_iterations=10,
    )


def _get_agent(user_id: str) -> AssistantAgent:
    if user_id not in _agents:
        _agents[user_id] = _build_agent()
    return _agents[user_id]


async def stream_agent(messages: list[dict], user_id: str) -> AsyncIterator[str]:
    """Stream agent response as SSE events.

    Yields strings in the format: 'data: {"text":"..."}\n\n'
    Ends with 'data: [DONE]\n\n'
    """
    # Detect conversation reset (browser refresh) - if the client now has
    # fewer assistant turns than we've recorded, rebuild the agent so we
    # don't replay history that's already gone.
    assistant_turns = len([m for m in messages if m.get("role") == "assistant"])
    if assistant_turns < _last_assistant_turns.get(user_id, 0):
        _agents.pop(user_id, None)

    agent = _get_agent(user_id)

    # Extract the latest user message to send to the agent
    user_messages = [m for m in messages if m.get("role") == "user"]
    if not user_messages:
        yield "data: [DONE]\n\n"
        return

    last_message = user_messages[-1].get("content", "")

    had_text_before = False
    in_tool_call = False

    # Set the current user ID in the context var so tools can access it.
    # using_session/using_user tag the spans so Arize groups them by user.
    token = current_user_id.set(user_id)
    try:
        with ExitStack() as stack:
            stack.enter_context(using_session(user_id))
            stack.enter_context(using_user(user_id))
            # ``run_stream`` yields BaseAgentEvent / BaseChatMessage values as the
            # agent works through its tool loop, then a TaskResult sentinel.
            async for event in agent.run_stream(task=last_message):
                if isinstance(event, ToolCallRequestEvent):
                    in_tool_call = True
                    continue

                if isinstance(event, ModelClientStreamingChunkEvent):
                    text_delta = event.content
                    if not text_delta:
                        continue
                    if in_tool_call and had_text_before:
                        yield f"data: {json.dumps({'text': chr(10) + chr(10)})}\n\n"
                    in_tool_call = False
                    had_text_before = True
                    yield f"data: {json.dumps({'text': text_delta})}\n\n"
    finally:
        current_user_id.reset(token)

    _last_assistant_turns[user_id] = assistant_turns + 1

    yield "data: [DONE]\n\n"
