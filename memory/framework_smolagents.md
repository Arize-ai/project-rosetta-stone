---
name: Smolagents framework gotchas
description: Smolagents (Hugging Face) added across all three tiers — non-obvious behaviour worth remembering for similar Code/ToolCallingAgent integrations
type: project
---

Smolagents (`smolagents==1.25.0`) added to `no-observability/smolagents-py/`, `phoenix/smolagents-py/`, and `ax/smolagents-py/`.

## ToolCallingAgent wraps every reply in a `final_answer` tool call

**Why:** Smolagents' `ToolCallingAgent` doesn't return free text — it always emits a synthetic `final_answer` tool call whose JSON arguments look like `{"answer": "<text>"}`. The LLM streams the JSON character-by-character via `ChatMessageStreamDelta.tool_calls`. If you only forward `delta.content` you get nothing because `content` stays `None`.

**How to apply:** To stream token-level deltas to a chat UI, parse the accumulating `tc.function.arguments` string with a small state machine that walks until the closing `"` of the `answer` value, decoding `\n` / `\t` / `\uXXXX` escapes on the fly. See `_FinalAnswerExtractor` in `no-observability/smolagents-py/backend/agent.py`. Real (non-final-answer) tool calls — `search_products` etc. — should be skipped at the SSE layer; their JSON args are irrelevant to the user. Track `current_tool_name` per stream event and only feed the extractor when the name is `final_answer`. Reset both at every `ActionStep`/`PlanningStep` boundary.

## Streaming requires `stream_outputs=True` AND `stream=True`

**Why:** `agent.run(task, stream=True)` returns a generator over step objects (`PlanningStep`, `ActionStep`, `FinalAnswerStep`), but the token-level `ChatMessageStreamDelta` events only appear if you ALSO pass `stream_outputs=True` to the agent constructor. Without that flag, `run()` calls `model.generate()` (non-streaming) and you'll only see step boundaries.

**How to apply:** `ToolCallingAgent(tools=..., model=..., stream_outputs=True)` then `for event in agent.run(task, stream=True):`. The LiteLLMModel (and most other ApiModel subclasses) implements `generate_stream` so `stream_outputs=True` "just works".

## Conversation memory lives inside the agent — keep one per user

**Why:** Unlike Pydantic AI (`message_history` parameter), smolagents doesn't take history as a parameter. The agent's own `memory.steps` list is the conversation log. `agent.run(task, reset=True)` clears it; `reset=False` appends.

**How to apply:** Hold a per-user dict of `ToolCallingAgent` instances. First turn: `reset=True`. Subsequent turns: `reset=False`. Detect resets (browser refresh, etc.) by comparing the frontend's assistant-message count against a server-side counter; if it shrank, rebuild the agent.

## Tools need Google-style docstrings, not `Annotated[..., Field(...)]`

**Why:** The `@tool` decorator parses the docstring's `Args:` block to build the JSON schema. `Annotated[T, Field(description="...")]` (the pattern that works for Pydantic AI and LlamaIndex) is ignored — descriptions vanish from the tool schema.

**How to apply:** Rewrite tool signatures as plain `Optional[T] = None` with docstrings of the form `Args:\n    param: description text`. Type hints (`Optional`, `list[T]`, `dict`) become JSON-schema types automatically (`nullable: true`, `array of T`, `object`).

## Anthropic via LiteLLMModel — no direct Anthropic class

**Why:** smolagents has no Anthropic-native model class. The supported route is `LiteLLMModel(model_id="anthropic/claude-sonnet-4-6")`. LiteLLM reads `ANTHROPIC_API_KEY` from the environment automatically. Requires `smolagents[litellm]` extra.

**How to apply:** `pip install 'smolagents[litellm]==1.25.0'`. Then `model = LiteLLMModel(model_id="anthropic/claude-sonnet-4-6", max_tokens=4096)`. No `api_key=` argument needed — the env var path is the default.

## OpenInference instrumentor does NOT emit `session.id`

**Why:** `openinference-instrumentation-smolagents==0.1.31` produces CHAIN/LLM/TOOL spans but doesn't tag them with `session.id`. The Arize UI's session grouping needs `session.id`, so traces look unconnected without it.

**How to apply:** Wrap every `agent.run(...)` in `with using_session(user_id):` from `openinference.instrumentation`. Use the try/except `nullcontext()` shim so the no-observability tier compiles without the OpenInference package. Same pattern as CrewAI (`backend/agent.py` lines 12–16).

## tools.py is shared verbatim across all 3 tiers

**Why:** Smolagents' `@tool` decorator pulls in `from smolagents import tool` which is available regardless of observability. The function bodies don't reference any tracing primitives.

**How to apply:** When syncing tools.py changes across tiers, just `cp` between no-observability/phoenix/ax.

## Eval harness "Tool Selection: incorrect" is a known false negative

**Why:** The Phoenix `tool-selection` evaluator inspects span attributes for the tools called. Because every smolagents reply ends with a `final_answer` tool call, the evaluator sees `final_answer` as the most recent tool and flags real tool calls (`search_products`, `purchase_product`) as "not called" — a false negative. 30/30 traces ran during the Phoenix eval harness all scored `Tool Selection: incorrect (0)` despite the agent calling the right tools.

**How to apply:** Don't trust the Tool Selection evaluator scores for smolagents traces verbatim. If you need accurate tool-selection eval, write a smolagents-specific evaluator that drops `final_answer` from the tool list before scoring.
