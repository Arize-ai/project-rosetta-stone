# Wonder Toys — OpenAI Voice (Arize AX)

This is the Arize-AX-instrumented version of the voice-enabled Wonder Toys shopping agent, built on the **OpenAI Realtime API** with a Python FastAPI backend.

Two tiers only for this framework: `no-observability/` and `ax/`. Phoenix is intentionally skipped — the audio tracing recipe is AX-specific (see the [Arize Tracing & Evaluating Audio cookbook](https://arize.com/docs/ax/cookbooks/evaluation/tracing-and-evaluating-audio)).

## What differs from `no-observability/openai-voice`

Only observability-related files:

| File | Difference |
|------|------------|
| `backend/tracing.py` | **New** — `arize.otel.register(...)` + `VoiceTracer` helper |
| `backend/main.py` | Adds `import backend.tracing` at the top |
| `backend/voice_agent.py` | Same handlers; the imported `voice_tracer` factory wraps them with OTel spans |
| `backend/chat_agent.py` | Wraps Chat Completions call + tool dispatch in OTel spans |
| `backend/audio.py` | `persist_wav` actually writes WAVs under `public/voice-audio/` and returns served URLs |
| `backend/requirements.txt` | Adds `arize-otel`, `opentelemetry-api`, `opentelemetry-sdk` |
| `env.example` | Adds `ARIZE_SPACE_ID`, `ARIZE_API_KEY`, `ARIZE_PROJECT_NAME`, optional `VOICE_AUDIO_PUBLIC_BASE` |
| `src/app/api/chat/route.ts` | Adds eval-bypass header check (`x-eval-secret` / `x-eval-user-id`) |

Everything else (5 tools, UI, ChromaDB, auth, start.sh) is identical to the no-observability tier.

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
cp env.example .env.local   # fill in OPENAI_API_KEY + ARIZE_* + TWITTER_*
npm install
npm run dev                 # ChromaDB + Python deps + backend + Next.js
```

WAVs are written to `public/voice-audio/` (gitignored) so Next.js can serve them at `/voice-audio/...`. Set `VOICE_AUDIO_PUBLIC_BASE` if Arize needs to fetch them from outside localhost.

See the [root README](../../README.md) for full details.
