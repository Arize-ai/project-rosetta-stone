# Wonder Toys — OpenAI Voice (Arize Phoenix)

This is the Arize-Phoenix-instrumented version of the voice-enabled Wonder Toys shopping agent, built on the **OpenAI Realtime API** with a Python FastAPI backend.

The Arize ["Tracing & Evaluating Audio" cookbook](https://arize.com/docs/ax/cookbooks/evaluation/tracing-and-evaluating-audio) is hosted under the AX docs, but the OpenInference audio attributes it uses (`input.audio.*`, `output.audio.*`, `llm.tools.{i}.tool.*`) are equally valid for Phoenix — only the tracer-provider registration differs.

## What differs from `no-observability/openai-voice`

Only observability-related files:

| File | Difference |
|------|------------|
| `backend/tracing.py` | **New** — `phoenix.otel.register(...)` + `VoiceTracer` helper |
| `backend/main.py` | Adds `import backend.tracing` at the top |
| `backend/voice_agent.py` | Same handlers; the imported `voice_tracer` factory wraps them with OTel spans |
| `backend/chat_agent.py` | Wraps Chat Completions call + tool dispatch in OTel spans |
| `backend/audio.py` | `persist_wav` actually writes WAVs under `public/voice-audio/` and returns served URLs |
| `backend/requirements.txt` | Adds `arize-phoenix-otel`, `opentelemetry-api`, `opentelemetry-sdk` |
| `env.example` | Adds `PHOENIX_COLLECTOR_ENDPOINT`, `PHOENIX_API_KEY`, `PHOENIX_PROJECT_NAME`, optional `VOICE_AUDIO_PUBLIC_BASE` |
| `src/app/api/chat/route.ts` | Adds eval-bypass header check (`x-eval-secret` / `x-eval-user-id`) |

Everything else (5 tools, UI, ChromaDB, auth, start.sh) is identical to the no-observability tier.

## What differs from `ax/openai-voice`

Only the tracer-provider registration:

- `backend/tracing.py` imports `phoenix.otel.register` (not `arize.otel.register`) and calls it with `project_name` + `batch=True` — Phoenix reads `PHOENIX_COLLECTOR_ENDPOINT` and `PHOENIX_API_KEY` from the environment.
- `backend/requirements.txt` ships `arize-phoenix-otel` (not `arize-otel`).
- `env.example` uses `PHOENIX_*` (not `ARIZE_*`).
- `package.json` name is `openai-voice-phoenix`.

The span-building code (`VoiceTracer`, the chat-turn span tree, the audio persistence) is byte-identical to the AX tier because both backends consume the same OpenInference attributes.

## Trace shape

Per voice session a single root `session.lifecycle` span owns:

```
session.lifecycle           [session.id, llm.tools.{i}.tool.{name,type,description,json_schema}]
├── input.audio   (× turns) [input.audio.url, input.audio.mime_type, input.audio.transcript]
├── llm.tool      (× calls) [tool.name, tool.parameters, tool.output]
└── output.audio  (× turns) [output.audio.url, output.audio.mime_type,
                             output.audio.transcript, llm.token_count.{prompt,completion}]
```

The text-mode fallback creates a `chat_turn` AGENT span with a child `chat_completion` LLM span and child `llm.tool` spans per function call.

## Running

```bash
cp env.example .env.local   # fill in OPENAI_API_KEY + PHOENIX_* + TWITTER_*
npm install
npm run dev                 # ChromaDB + Python deps + backend + Next.js
```

WAVs are written to `public/voice-audio/` (gitignored) so Next.js can serve them at `/voice-audio/...`. Set `VOICE_AUDIO_PUBLIC_BASE` if Phoenix needs to fetch them from outside localhost.

See the [root README](../../README.md) for full details.
