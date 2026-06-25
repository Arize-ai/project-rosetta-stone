# Wonder Toys — Semantic Kernel Python (No Observability)

This is the Microsoft Semantic Kernel variant of the Wonder Toys shopping agent with no observability instrumentation.

## Architecture

- **Python FastAPI backend** (port 8001) — agent, tools, and API
- **Next.js frontend** — UI, auth, proxies chat to the Python backend
- **Agent**: `ChatCompletionAgent` from `semantic_kernel.agents` with a single Anthropic chat-completion service
- **LLM**: Claude (`claude-sonnet-4-6`) via `semantic_kernel.connectors.ai.anthropic.AnthropicChatCompletion`
- **Tools**: A `WonderToysPlugin` class whose methods are decorated with `@kernel_function`, passed to the agent via `plugins=[...]`
- **Streaming**: `agent.invoke_stream(messages=..., thread=...)` yields `StreamingChatMessageContent` chunks with `content` text
- **Conversation memory**: Per-user `ChatHistoryAgentThread` stored in memory
- **Tool context**: `current_user_id` `ContextVar` set per request so tool methods can read the caller's user id without going through the LLM
- **Vector search**: ChromaDB (default embeddings)

## Running

```bash
cp env.example .env.local   # fill in your API keys
npm install
npm run dev                 # starts ChromaDB + installs Python deps + runs backend + Next.js
```

See the [root README](../../README.md) for full details.

## Key Files

| File | Purpose |
|------|---------|
| `backend/agent.py` | Agent definition, thread management, and SSE streaming |
| `backend/tools.py` | `WonderToysPlugin` with `@kernel_function`-decorated methods |
| `backend/main.py` | FastAPI app with `/chat` endpoint |
| `backend/chroma_client.py` | ChromaDB vector search client |
| `src/app/api/chat/route.ts` | Next.js proxy to Python backend |
| `src/components/Chat.tsx` | Chat UI with product card rendering |
| `scripts/start.sh` | Dev startup (ChromaDB + Python deps + backend + Next.js) |

## Semantic Kernel Notes

### Function-choice behavior

Auto tool calling is opt-in via `function_choice_behavior=FunctionChoiceBehavior.Auto()` on the `AnthropicChatPromptExecutionSettings`. Without it, the model sees the tools but never invokes them.

### Streaming + tool calls

`invoke_stream()` interleaves text-only `StreamingChatMessageContent` chunks with intermediate function-call / function-result messages that surface via the `on_intermediate_message` callback. We use the callback to flag "after this, more text is coming" so the SSE stream injects a paragraph break between pre-tool and post-tool text.

### Threads

Each user gets a `ChatHistoryAgentThread`. When the browser-side message history shrinks (page refresh), the server detects the drop in assistant-turn count and replaces the thread with a fresh one.
