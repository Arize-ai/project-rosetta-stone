# Wonder Toys — OpenAI Voice (Arize Phoenix)

This is the Phoenix-instrumented version of the voice-enabled Wonder Toys shopping agent. The agent itself is the same as the no-observability tier: OpenAI Agents SDK `RealtimeAgent` for voice and `Agent` + `Runner` for the text fallback.

The whole observability surface in this tier is `OpenAIAgentsInstrumentor().instrument(...)` plus a `phoenix.otel.register(...)` provider — the instrumentor patches both the realtime `RealtimeSession` and the regular `Runner`, emitting the canonical OpenInference voice span tree automatically.

## What differs from `no-observability/openai-voice`

Only observability-related files:

| File | Difference |
|------|------------|
| `backend/tracing.py` | **New** — `phoenix.otel.register(...)` + `OpenAIAgentsInstrumentor().instrument(...)` |
| `backend/main.py` | Adds `import backend.tracing` at the top so the instrumentor patches `agents.realtime` before the runtime imports it |
| `backend/voice_agent.py` | Imports `flush_traces` and calls it on session end so spans reach the OTel `BatchSpanProcessor` |
| `backend/chat_agent.py` | Same — `flush_traces()` in the `finally` block per text-mode request |
| `backend/requirements.txt` | Adds `arize-phoenix-otel` + `openinference-instrumentation-openai-agents` |
| `env.example` | Adds `PHOENIX_COLLECTOR_ENDPOINT`, `PHOENIX_API_KEY`, `PHOENIX_PROJECT_NAME` |
| `src/app/api/chat/route.ts` | Adds eval-bypass header check (`x-eval-secret` / `x-eval-user-id`) |

Everything else (`backend/tools.py`, `backend/context.py`, `backend/voice_agent.py` dispatch logic, the React UI, ChromaDB, auth, `scripts/start.sh`) is identical to the no-observability tier.

## What differs from `ax/openai-voice`

Only the tracer-provider registration. Both tiers call the same `OpenAIAgentsInstrumentor` — the only difference is the provider it sends spans to:

- `backend/tracing.py` imports `phoenix.otel.register` (not `arize.otel.register`) and calls it with `protocol="http/protobuf"` + `batch=True`. The `http/protobuf` protocol is required — the gRPC default would rewrite the port from 6006 to 4317 and traces would never land.
- `backend/requirements.txt` ships `arize-phoenix-otel` (not `arize-otel`).
- `env.example` uses `PHOENIX_*` (not `ARIZE_*`).
- `package.json` name is `openai-voice-phoenix`.

## Trace shape

The `OpenAIAgentsInstrumentor` emits the canonical OpenInference voice span tree per turn — no hand-rolled spans, no per-event glue code:

```
AUDIO  "conversation.turn"     [session.id, aggregated transcripts, llm.model_name,
│                               llm.invocation_parameters, end_reason]
├─ USER  "user"                [input.audio.url (WAV data URI), input.audio.mime_type,
│                               input.audio.transcript]
├─ LLM   "assistant"           [output.audio.url, output.audio.mime_type, output.audio.transcript,
│                               llm.token_count.{prompt,completion}, time_to_first_token_ms]
│  └─ TOOL "<tool_name>"       [tool.name, tool.parameters, tool.output]  ← one per call
└─ ...                          ← additional USER / LLM siblings for split input or tool round-trips
```

For text-mode requests the same instrumentor emits the standard `AGENT` + `LLM` + `TOOL` tree from a `Runner.run_streamed(...)` call.

Audio is embedded inline as `data:audio/wav;base64,...` URIs so the Phoenix trace card audio player renders without needing any external file hosting.

## Running

```bash
cp env.example .env.local   # fill in OPENAI_API_KEY + PHOENIX_* + TWITTER_*
npm install
npm run dev                 # ChromaDB + Python deps + backend + Next.js
```

See the [root README](../../README.md) for full details.
