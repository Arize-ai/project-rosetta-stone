import asyncio
import json
from collections.abc import AsyncIterator
from contextlib import nullcontext

from crewai import Agent, Crew, LLM, Task
from crewai.events import LLMStreamChunkEvent, crewai_event_bus

# OpenInference's `using_session` tags emitted spans with session.id so AX/Phoenix
# can group multi-turn traces into a session. Only present when an observability
# tier is installed; no-observability falls back to a no-op context manager.
try:
    from openinference.instrumentation import using_session
except ImportError:
    def using_session(session_id: str):
        return nullcontext()

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


# Per-user conversation history: keyed by user_id
_histories: dict[str, list[tuple[str, str]]] = {}

_TOOLS = [
    search_products,
    get_product_detail,
    purchase_product,
    check_order_status,
    cancel_order_tool,
]


def _build_crew(message: str, history: list[tuple[str, str]]) -> Crew:
    """Build a fresh single-agent, single-task crew for one user turn."""
    if history:
        history_lines = [f"{role}: {content}" for role, content in history]
        task_description = (
            "Conversation so far:\n"
            + "\n".join(history_lines)
            + f"\n\nUser: {message}\n\nRespond to the latest user message."
        )
    else:
        task_description = f"User: {message}\n\nRespond to the user."

    agent = Agent(
        role="Wonder Toys Shopping Assistant",
        goal="Help customers find toys, complete purchases, check order status, and cancel orders.",
        backstory=SYSTEM_PROMPT,
        # CrewAI hardcodes strict=True on tool schemas, which Sonnet 4
        # (2025-05-14) doesn't support. Sonnet 4.5 is the oldest Claude
        # model that accepts strict tool definitions.
        llm=LLM(model="anthropic/claude-sonnet-4-6", stream=True),
        tools=_TOOLS,
        verbose=False,
        allow_delegation=False,
    )

    task = Task(
        description=task_description,
        expected_output="A helpful, properly-formatted response to the user.",
        agent=agent,
    )

    return Crew(
        agents=[agent],
        tasks=[task],
        verbose=False,
        memory=False,
    )


async def stream_agent(messages: list[dict], user_id: str) -> AsyncIterator[str]:
    """Stream agent response as SSE events.

    Yields strings in the format: 'data: {"text":"..."}\n\n'
    Ends with 'data: [DONE]\n\n'
    """
    user_messages = [m for m in messages if m.get("role") == "user"]
    if not user_messages:
        yield "data: [DONE]\n\n"
        return

    last_message = user_messages[-1].get("content", "")

    # Detect conversation reset (browser refresh, etc.) by comparing assistant
    # turn counts against the history we have on file.
    assistant_turns = sum(1 for m in messages if m.get("role") == "assistant")
    existing = _histories.get(user_id, [])
    existing_assistant = sum(1 for role, _ in existing if role == "assistant")
    if assistant_turns < existing_assistant:
        _histories[user_id] = []
        existing = []

    crew = _build_crew(last_message, existing)
    task_id = crew.tasks[0].id

    loop = asyncio.get_running_loop()
    queue: asyncio.Queue = asyncio.Queue()
    SENTINEL = object()

    def _on_chunk(_source, event: LLMStreamChunkEvent) -> None:
        # The event bus is global — filter by this crew's task ID so
        # concurrent requests don't bleed into each other.
        if str(event.task_id) != str(task_id):
            return
        loop.call_soon_threadsafe(queue.put_nowait, event)

    handle = crewai_event_bus.on(LLMStreamChunkEvent)(_on_chunk)

    token = current_user_id.set(user_id)
    try:
        # Tag all spans emitted during this turn with session.id == user_id so
        # AX/Phoenix can group a user's multi-turn traces into one session.
        # OpenInference's CrewAI instrumentation calls get_attributes_from_context()
        # at span creation time, so the with-block must enclose the kickoff.
        with using_session(user_id):
            kickoff_task = asyncio.create_task(crew.kickoff_async())
            kickoff_task.add_done_callback(
                lambda _t: loop.call_soon_threadsafe(queue.put_nowait, SENTINEL)
            )

            had_text_before = False
            in_tool_call = False
            full_text = ""

            while True:
                ev = await queue.get()
                if ev is SENTINEL:
                    break
                if ev.tool_call is not None:
                    in_tool_call = True
                    continue
                chunk_text = ev.chunk or ""
                if not chunk_text:
                    continue
                if in_tool_call and had_text_before:
                    yield f"data: {json.dumps({'text': chr(10) + chr(10)})}\n\n"
                in_tool_call = False
                had_text_before = True
                full_text += chunk_text
                yield f"data: {json.dumps({'text': chunk_text})}\n\n"

            # Surface any kickoff exception
            kickoff_result = kickoff_task.result()
            final_text = full_text or str(kickoff_result)

            # Persist history for the next turn
            _histories[user_id] = existing + [
                ("User", last_message),
                ("Assistant", final_text),
            ]
    finally:
        current_user_id.reset(token)
        crewai_event_bus.off(LLMStreamChunkEvent, handle)

    yield "data: [DONE]\n\n"
