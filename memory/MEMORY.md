# Project Memory

- [Microsoft Agent Framework addition](project_microsoft_agent_framework.md) — MS Agent Framework added to no-observability only; per-user sessions; FunctionInvocationContext for user_id injection
- [Smolagents framework gotchas](framework_smolagents.md) — ToolCallingAgent wraps replies in `final_answer` tool call (streaming requires JSON-string-value extractor); `stream_outputs=True` flag needed for token-level deltas; per-user agent instance for `reset=False` memory; Google-style docstrings (not `Annotated[Field]`); LiteLLMModel for Anthropic; `using_session(user_id)` wrap required (no auto session.id); Tool Selection eval false-negative on `final_answer` wrap.
