# Wonder Toys — OpenAI Voice (Arize AX)

This is the Arize-AX-instrumented version of the voice-enabled Wonder Toys shopping agent. The agent itself is the same as the no-observability tier: OpenAI Agents SDK `RealtimeAgent` for voice and `Agent` + `Runner` for the text fallback.

The whole observability surface in this tier is `OpenAIAgentsInstrumentor().instrument(...)` plus an `arize.otel.register(...)` provider — the instrumentor patches both the realtime `RealtimeSession` and the regular `Runner`, emitting the canonical OpenInference voice span tree automatically. The Arize ["Tracing & Evaluating Audio" cookbook](https://arize.com/docs/ax/cookbooks/evaluation/tracing-and-evaluating-audio) describes the resulting span shape and attribute set.

## What differs from `no-observability/openai-voice`

Only observability-related files:

| File | Difference |
|------|------------|
| `backend/tracing.py` | **New** — `arize.otel.register(...)` + `OpenAIAgentsInstrumentor().instrument(...)` |
| `backend/main.py` | Adds `import backend.tracing` at the top so the instrumentor patches `agents.realtime` before the runtime imports it |
| `backend/voice_agent.py` | Imports `flush_traces` and calls it on session end so spans reach the OTel `BatchSpanProcessor` |
| `backend/chat_agent.py` | Same — `flush_traces()` in the `finally` block per text-mode request |
| `backend/requirements.txt` | Adds `arize-otel` + `openinference-instrumentation-openai-agents` |
| `env.example` | Adds `ARIZE_SPACE_ID`, `ARIZE_API_KEY`, `ARIZE_PROJECT_NAME` |
| `src/app/api/chat/route.ts` | Adds eval-bypass header check (`x-eval-secret` / `x-eval-user-id`) |

Everything else (`backend/tools.py`, `backend/context.py`, `backend/voice_agent.py` dispatch logic, the React UI, ChromaDB, auth, `scripts/start.sh`) is identical to the no-observability tier.

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

Audio is embedded inline as `data:audio/wav;base64,...` URIs so the AX trace card audio player renders without needing any external file hosting — Arize re-hosts the audio in its multimodal bucket on ingest.

## Running

```bash
cp env.example .env.local   # fill in OPENAI_API_KEY + ARIZE_* + TWITTER_*
npm install
npm run dev                 # ChromaDB + Python deps + backend + Next.js
```

See the [root README](../../README.md) for full details.
