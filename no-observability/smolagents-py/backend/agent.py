import json
from collections.abc import AsyncIterator
from contextlib import nullcontext

from smolagents import (
    ToolCallingAgent,
    LiteLLMModel,
    ChatMessageStreamDelta,
    FinalAnswerStep,
    ActionStep,
    PlanningStep,
)

# OpenInference's `using_session` tags emitted spans with session.id so AX/Phoenix
# can group multi-turn traces into a session. Only present when an observability
# tier is installed; no-observability falls back to a no-op context manager.
try:
    from openinference.instrumentation import using_session
except ImportError:
    def using_session(session_id: str):
        return nullcontext()

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


# Per-user agents: smolagents keeps conversation memory inside the agent itself
# (via its internal step log). We hold one ToolCallingAgent per user so that
# subsequent run(..., reset=False) calls continue the existing conversation.
_agents: dict[str, ToolCallingAgent] = {}
# Track expected turn count per user so we can detect resets (browser refresh).
_history_turns: dict[str, int] = {}


def _build_agent() -> ToolCallingAgent:
    # LiteLLMModel reads ANTHROPIC_API_KEY from env automatically.
    model = LiteLLMModel(
        model_id="anthropic/claude-sonnet-4-6",
        max_tokens=4096,
    )
    return ToolCallingAgent(
        tools=all_tools,
        model=model,
        instructions=SYSTEM_PROMPT,
        name="WonderToysAgent",
        max_steps=10,
        # stream_outputs=True is what makes run(stream=True) yield token-level
        # ChatMessageStreamDelta events from the LiteLLM model's generate_stream.
        stream_outputs=True,
    )


def _get_agent(user_id: str) -> ToolCallingAgent:
    agent = _agents.get(user_id)
    if agent is None:
        agent = _build_agent()
        _agents[user_id] = agent
    return agent


def _reset_agent(user_id: str) -> ToolCallingAgent:
    agent = _build_agent()
    _agents[user_id] = agent
    _history_turns[user_id] = 0
    return agent


class _FinalAnswerExtractor:
    """Streaming extractor for the `answer` string value inside the final_answer
    tool call's JSON arguments.

    smolagents' ToolCallingAgent wraps every reply in a synthetic `final_answer`
    tool call whose JSON arguments look like `{"answer": "<text>"}`. The model
    streams that JSON character-by-character via ChatMessageStreamDelta.tool_calls.
    To preserve token-level streaming for the user, we walk the accumulating
    arguments string with a tiny state machine and emit decoded text fragments
    as soon as we see them, instead of waiting for the JSON to finish parsing.
    """

    def __init__(self) -> None:
        self._buf = ""
        self._in_value = False
        self._done = False
        self._escape = False

    def feed(self, fragment: str) -> str:
        """Append a fragment of the arguments string and return any newly
        decoded `answer` text. Safe to call repeatedly with empty fragments."""
        if self._done or not fragment:
            return ""
        self._buf += fragment
        out = []
        # Locate the start of the value if we haven't already.
        if not self._in_value:
            # Look for the pattern "answer" then ':' then the opening '"'.
            key_idx = self._buf.find('"answer"')
            if key_idx < 0:
                return ""
            colon_idx = self._buf.find(":", key_idx + len('"answer"'))
            if colon_idx < 0:
                return ""
            quote_idx = self._buf.find('"', colon_idx + 1)
            if quote_idx < 0:
                return ""
            self._in_value = True
            # Position the cursor just past the opening quote.
            self._cursor = quote_idx + 1
        # Consume characters of the value, honouring JSON string escapes.
        while self._cursor < len(self._buf):
            ch = self._buf[self._cursor]
            self._cursor += 1
            if self._escape:
                # Decode one escape sequence.
                if ch == "n":
                    out.append("\n")
                elif ch == "t":
                    out.append("\t")
                elif ch == "r":
                    out.append("\r")
                elif ch == "u":
                    # Need 4 more hex digits; bail if they haven't arrived yet.
                    if self._cursor + 4 > len(self._buf):
                        # Rewind so we re-process on the next feed.
                        self._cursor -= 1
                        self._escape = True
                        break
                    out.append(chr(int(self._buf[self._cursor : self._cursor + 4], 16)))
                    self._cursor += 4
                else:
                    # \" \\ \/ \b \f and anything else round-trip as the literal.
                    out.append(ch)
                self._escape = False
                continue
            if ch == "\\":
                self._escape = True
                continue
            if ch == '"':
                self._done = True
                break
            out.append(ch)
        return "".join(out)


async def stream_agent(messages: list[dict], user_id: str) -> AsyncIterator[str]:
    """Stream agent response as SSE events.

    Yields strings in the format: 'data: {"text":"..."}\\n\\n'
    Ends with 'data: [DONE]\\n\\n'
    """
    # Count completed assistant turns to detect resets (e.g. browser refresh).
    assistant_turns = len([m for m in messages if m.get("role") == "assistant"])
    existing_turns = _history_turns.get(user_id, 0)

    if user_id not in _agents or assistant_turns < existing_turns:
        agent = _reset_agent(user_id)
        is_first_turn = True
    else:
        agent = _get_agent(user_id)
        is_first_turn = existing_turns == 0

    # Extract the latest user message
    user_messages = [m for m in messages if m.get("role") == "user"]
    if not user_messages:
        yield "data: [DONE]\n\n"
        return

    last_message = user_messages[-1].get("content", "")

    had_text_before = False
    just_finished_tool = False
    extractor: _FinalAnswerExtractor | None = None
    current_tool_name: str | None = None

    # Set the current user ID in the context var so tools can access it
    token = current_user_id.set(user_id)
    try:
      # using_session attaches session.id to every span emitted inside this
      # block so AX / Phoenix can group multi-turn traces. The smolagents
      # OpenInference instrumentor does not emit session.id on its own.
      with using_session(user_id):
        # smolagents run() returns a generator when stream=True. Each yielded
        # event is a ChatMessageStreamDelta (token-level deltas) or a step
        # object (ActionStep, PlanningStep, FinalAnswerStep). reset=False keeps
        # conversation memory across turns.
        for event in agent.run(
            last_message,
            stream=True,
            reset=is_first_turn,
        ):
            if isinstance(event, ChatMessageStreamDelta):
                # ToolCallingAgent wraps every reply in a synthetic
                # final_answer(...) tool call. Real tool calls have different
                # names (search_products, etc.) — skip the streaming of those
                # since their args are JSON and irrelevant to the user. Stream
                # only the `answer` text from the final_answer call.
                if event.tool_calls:
                    for tc in event.tool_calls:
                        if tc.function is None:
                            continue
                        if tc.function.name:
                            current_tool_name = tc.function.name
                            if current_tool_name == "final_answer" and extractor is None:
                                extractor = _FinalAnswerExtractor()
                        if (
                            current_tool_name == "final_answer"
                            and extractor is not None
                            and tc.function.arguments
                        ):
                            fragment = (
                                tc.function.arguments
                                if isinstance(tc.function.arguments, str)
                                else json.dumps(tc.function.arguments)
                            )
                            text_delta = extractor.feed(fragment)
                            if text_delta:
                                if just_finished_tool and had_text_before:
                                    yield (
                                        f"data: {json.dumps({'text': chr(10) + chr(10)})}"
                                        "\n\n"
                                    )
                                    just_finished_tool = False
                                had_text_before = True
                                yield f"data: {json.dumps({'text': text_delta})}\n\n"
                    continue

                # Plain text delta (rare for ToolCallingAgent; defensive).
                text_delta = event.content
                if not text_delta:
                    continue
                if just_finished_tool and had_text_before:
                    yield f"data: {json.dumps({'text': chr(10) + chr(10)})}\n\n"
                    just_finished_tool = False
                had_text_before = True
                yield f"data: {json.dumps({'text': text_delta})}\n\n"
                continue

            if isinstance(event, (ActionStep, PlanningStep)):
                # Step boundary — if a real (non-final-answer) tool was called,
                # mark it so the paragraph-break logic above fires on the next
                # text delta.
                if current_tool_name and current_tool_name != "final_answer":
                    just_finished_tool = True
                # Reset per-step tool tracking for the next iteration.
                current_tool_name = None
                extractor = None
                continue

            if isinstance(event, FinalAnswerStep):
                # The answer text was already streamed via the final_answer
                # tool-call deltas above. If for some reason the streaming
                # extractor didn't fire (e.g. model returned arguments as a
                # pre-parsed dict instead of a JSON string), fall back to
                # emitting the resolved output now.
                if not had_text_before and event.output:
                    output = (
                        event.output
                        if isinstance(event.output, str)
                        else json.dumps(event.output)
                    )
                    yield f"data: {json.dumps({'text': output})}\n\n"
                continue
    finally:
        current_user_id.reset(token)

    _history_turns[user_id] = assistant_turns + 1

    yield "data: [DONE]\n\n"
