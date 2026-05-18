---
name: Microsoft Agent Framework addition
description: Microsoft Agent Framework Python implementation added to no-observability tier only (not yet in phoenix or ax tiers)
type: project
---

Microsoft Agent Framework (Python) added to `no-observability/microsoft-agent-py/` as a new framework variant.

**Why:** User requested adding the Microsoft Agent Framework as a comparison implementation alongside LangChain, LlamaIndex, and Mastra.

**How to apply:** This framework is currently only in the no-observability tier. If asked to add it to phoenix or ax tiers, follow the same pattern as other Python frameworks. The key differences from other Python frameworks:
- Uses `agent-framework` and `agent-framework-anthropic` packages (pre-release, require `--pre` flag)
- Uses per-user `AgentSession` objects for conversation history (stateful server-side sessions)
- Only passes the last user message to `agent.run()` — session maintains history
- Uses `FunctionInvocationContext` + `function_invocation_kwargs` to inject `user_id` into tools (not passed via LLM)
- Tools decorated with `@tool(approval_mode="never_require")` from `agent_framework`
- Session reset detection: compares assistant message count in frontend history vs stored turn count
