# Wonder Toys — Claude Agent SDK Python (Phoenix)

This is the Claude Agent SDK Python variant of the Wonder Toys shopping agent instrumented for Phoenix.

## Architecture

- **Python FastAPI backend** (port 8001) — agent, tools, and API
- **Next.js frontend** — UI, auth, proxies chat to the Python backend
- **Agent**: `ClaudeSDKClient` from `claude_agent_sdk`, configured with `ClaudeAgentOptions`
- **LLM**: Claude (`claude-sonnet-4-6`) — the SDK runs the Claude Code CLI as a subprocess
- **Tools**: `@tool`-decorated functions served in-process via `create_sdk_mcp_server` (an SDK MCP server), namespaced `mcp__wonder_toys__<name>`
- **Streaming**: `client.query(...)` then `async for message in client.receive_response()`, yielding `TextBlock` text from each `AssistantMessage`
- **Sessions**: One persistent `ClaudeSDKClient` per `user_id` held in memory for multi-turn conversation
- **Tool context**: `current_user_id` context var — SDK MCP tools run in this process, so no user id is threaded through the model
- **Vector search**: ChromaDB (default embeddings)

## Observability — Phoenix

This tier adds Arize Phoenix tracing on top of the no-observability baseline. The footprint is small:

- `backend/tracing.py` — calls `phoenix.otel.register(...)` and `ClaudeAgentSDKInstrumentor().instrument(...)`
- `backend/main.py` — `import backend.tracing` at the top, before `claude_agent_sdk` is imported
- `backend/requirements.txt` — adds `arize-phoenix-otel` and `openinference-instrumentation-claude-agent-sdk`
- `env.example` — adds `PHOENIX_COLLECTOR_ENDPOINT`, `PHOENIX_API_KEY`, `PHOENIX_PROJECT_NAME`

The instrumentor emits an `AGENT` span per turn (`ClaudeAgentSDK.ClaudeSDKClient.receive_response`) with `TOOL` child spans for each Wonder Toys tool call. `using_session()` (installed with openinference) tags every trace with the user's `session.id` so turns group by user.

## Running

```bash
cp env.example .env.local   # fill in your API keys
npm install
npm run dev                 # starts ChromaDB + installs Python deps + runs backend + Next.js
```

The Claude Agent SDK requires the Claude Code CLI on PATH:

```bash
npm install -g @anthropic-ai/claude-code
```

See the [root README](../../README.md) for full details.

## Key Files

| File | Purpose |
|------|---------|
| `backend/agent.py` | Agent options, per-user client/session management, and SSE streaming |
| `backend/tools.py` | Tool definitions using `@tool` + `create_sdk_mcp_server` from `claude_agent_sdk` |
| `backend/main.py` | FastAPI app with `/chat` endpoint |
| `backend/chroma_client.py` | ChromaDB vector search client |
| `src/app/api/chat/route.ts` | Next.js proxy to Python backend |
| `src/components/Chat.tsx` | Chat UI with product card rendering |
| `scripts/start.sh` | Dev startup (ChromaDB + Python deps + backend + Next.js) |

## Claude Agent SDK Notes

### Runtime requirement

The Claude Agent SDK does not call the Anthropic API in-process — it spawns the Claude Code CLI as a subprocess and communicates over stdio. The `claude` binary must be installed and on PATH (`npm install -g @anthropic-ai/claude-code`).

### Tools as an in-process MCP server

The five Wonder Toys tools are registered with `create_sdk_mcp_server` and passed to the agent via `ClaudeAgentOptions(mcp_servers=...)`. `allowed_tools` is restricted to just those `mcp__wonder_toys__*` names so the agent can't reach the built-in Bash/file tools, and `permission_mode="bypassPermissions"` auto-approves them for headless serving. `setting_sources=[]` keeps the run isolated from any local `~/.claude` config.

### Session Management

Each `user_id` gets one persistent `ClaudeSDKClient`, connected once and reused across turns so the SDK retains conversation context. Clients live until the server restarts — the same lifetime as the in-memory order store.

If a user refreshes their browser (clearing sessionStorage) and starts a new conversation, the server-side client is torn down and recreated when the agent detects the message history has fewer turns than expected.

### User Identity in Tools

Because SDK MCP tools run in this same Python process, the request handler sets a `current_user_id` context var before querying and the tools read it directly — the user ID never passes through the LLM.
