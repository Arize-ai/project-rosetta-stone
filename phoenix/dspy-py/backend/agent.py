"""DSPy agent for Wonder Toys.

DSPy is a declarative LM programming framework. It doesn't have a native
"chat session" primitive, so we adapt it:

  * A signature with `question` + `history` (dspy.History) inputs and an
    `answer` output. The system prompt lives in the signature docstring.
  * A `dspy.ReAct` module with our 5 tool functions.
  * `dspy.streamify` with a StreamListener on `answer` to surface token-level
    deltas of the final response. Token streaming happens during the
    `extract` phase that runs after the ReAct loop finishes — so tool work
    happens silently first, then the user-facing text streams.
  * Per-user `dspy.History` is rebuilt from the message log on each turn.
"""

import asyncio
import json
import os
from collections.abc import AsyncIterator
from contextlib import nullcontext

import dspy

# `using_session` tags spans with session.id so the Arize/Phoenix UIs can
# group a user's turns. It only exists when openinference is installed, so
# fall back to a no-op contextmanager for the no-observability tier.
try:
    from openinference.instrumentation import using_session
except ImportError:  # no-observability tier — openinference not installed
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


class WonderToysSignature(dspy.Signature):
    __doc__ = SYSTEM_PROMPT

    history: dspy.History = dspy.InputField(
        description="Prior conversation turns. Each message has 'question' and 'answer' keys."
    )
    question: str = dspy.InputField(description="The user's latest message.")
    answer: str = dspy.OutputField(
        description="A warm, markdown-formatted response that follows all the guidelines above."
    )


# Per-user conversation history (keyed by user_id)
_histories: dict[str, list[dict]] = {}
# Track expected turn count per history so we can detect resets (browser refresh)
_history_turns: dict[str, int] = {}

_agent: dspy.Module | None = None
_stream_agent_fn = None
_lm_configured = False


def _configure_lm() -> None:
    """Configure DSPy's default LM. Idempotent."""
    global _lm_configured
    if _lm_configured:
        return
    # DSPy uses LiteLLM under the hood; `anthropic/<model>` routes to Anthropic.
    # api_key is read from ANTHROPIC_API_KEY by LiteLLM automatically.
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    lm = dspy.LM(
        "anthropic/claude-sonnet-4-6",
        api_key=api_key,
        max_tokens=8192,
        cache=False,
    )
    dspy.configure(lm=lm)
    _lm_configured = True


def get_agent():
    global _agent, _stream_agent_fn
    if _agent is None:
        _configure_lm()
        _agent = dspy.ReAct(
            WonderToysSignature,
            tools=[
                search_products,
                get_product_detail,
                purchase_product,
                check_order_status,
                cancel_order_tool,
            ],
            max_iters=10,
        )
        _stream_agent_fn = dspy.streamify(
            _agent,
            stream_listeners=[
                dspy.streaming.StreamListener(
                    signature_field_name="answer", allow_reuse=True
                ),
            ],
        )
    return _stream_agent_fn


async def stream_agent(messages: list[dict], user_id: str) -> AsyncIterator[str]:
    """Stream agent response as SSE events.

    Yields strings in the format: 'data: {"text":"..."}\\n\\n'
    Ends with 'data: [DONE]\\n\\n'
    """
    stream_fn = get_agent()

    # Count completed assistant turns in message history
    assistant_turns = len([m for m in messages if m.get("role") == "assistant"])
    existing_turns = _history_turns.get(user_id, 0)

    if user_id not in _histories or assistant_turns < existing_turns:
        # Fresh conversation or reset (browser refresh)
        _histories[user_id] = []
        _history_turns[user_id] = 0

    history_messages = _histories[user_id]

    # Extract the latest user message
    user_messages = [m for m in messages if m.get("role") == "user"]
    if not user_messages:
        yield "data: [DONE]\n\n"
        return

    last_message = user_messages[-1].get("content", "")
    history = dspy.History(messages=history_messages)

    # Make the user ID visible to tools via the contextvar
    token = current_user_id.set(user_id)

    answer_text = ""
    try:
        with using_session(user_id):
            output_stream = stream_fn(history=history, question=last_message)
            async for chunk in output_stream:
                if isinstance(chunk, dspy.streaming.StreamResponse):
                    if chunk.signature_field_name == "answer" and chunk.chunk:
                        answer_text += chunk.chunk
                        yield f"data: {json.dumps({'text': chunk.chunk})}\n\n"
                elif isinstance(chunk, dspy.Prediction):
                    # Final aggregated result. Fall back to it if streaming
                    # missed the answer field (some short responses are
                    # emitted whole as a Prediction without intermediate
                    # StreamResponse chunks).
                    final_answer = getattr(chunk, "answer", None)
                    if final_answer and not answer_text:
                        yield f"data: {json.dumps({'text': final_answer})}\n\n"
                        answer_text = final_answer
    except asyncio.CancelledError:
        raise
    except Exception as e:
        err = f"\n\n[error] {type(e).__name__}: {e}"
        yield f"data: {json.dumps({'text': err})}\n\n"
        answer_text += err
    finally:
        current_user_id.reset(token)

    # Persist the turn for the next call
    _histories[user_id].append({"question": last_message, "answer": answer_text})
    _history_turns[user_id] = assistant_turns + 1

    yield "data: [DONE]\n\n"
