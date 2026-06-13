# Project Rosetta Stone

**The same AI agent, built with different frameworks, instrumented with different observability platforms.**

If you're trying to add LLM observability to your own agent, this repo shows you exactly which files to touch — for whichever framework you use, and whether you ship to Arize Phoenix or Arize AX. Every framework is built **three times**:

- `no-observability/<framework>/` — baseline, zero instrumentation
- `phoenix/<framework>/` — same agent, instrumented for [Arize Phoenix Cloud](https://phoenix.arize.com)
- `ax/<framework>/` — same agent, instrumented for [Arize AX](https://arize.com)

Read the no-obs version to see the bare agent. Diff the phoenix or ax version against it to see the exact instrumentation footprint. Run it locally to watch traces land.

## Supported frameworks

| Framework | Python | TypeScript | Java |
|---|:---:|:---:|:---:|
| [Agno](https://docs.agno.com/) | ✅ | — | — |
| [Arconia](https://github.com/arconia-io/arconia) | — | — | ✅ |
| [AutoGen AgentChat](https://microsoft.github.io/autogen/stable/) | ✅ | — | — |
| [AWS Strands](https://strandsagents.com/) | ✅ | — | — |
| [BeeAI](https://framework.beeai.dev/) | ✅ | ✅ | — |
| [CrewAI](https://www.crewai.com/) | ✅ | — | — |
| [DSPy](https://dspy.ai/) | ✅ | — | — |
| [Google ADK](https://google.github.io/adk-docs/) | ✅ | — | — |
| [Haystack](https://haystack.deepset.ai/) | ✅ | — | — |
| [LangChain / LangGraph](https://www.langchain.com/) | ✅ | ✅ | — |
| [LangChain4j](https://docs.langchain4j.dev/) | — | — | ✅ |
| [LlamaIndex](https://www.llamaindex.ai/) | ✅ | — | — |
| [LlamaIndex Workflows](https://developers.llamaindex.ai/python/framework/understanding/workflows/) | ✅ | — | — |
| [Mastra](https://mastra.ai/) | — | ✅ | — |
| [Microsoft Agent Framework](https://learn.microsoft.com/en-us/agent-framework/) | ✅ | — | — |
| [Microsoft Semantic Kernel](https://learn.microsoft.com/en-us/semantic-kernel/) | ✅ | — | — |
| [OpenAI Agents SDK](https://openai.github.io/openai-agents-python/) | ✅ | — | — |
| [OpenAI Agents SDK (TypeScript)](https://openai.github.io/openai-agents-js/) | — | ✅ | — |
| [OpenAI Realtime API (Voice)](https://platform.openai.com/docs/guides/realtime) | ✅ | — | — |
| [OpenInference Annotation Tracing](https://arize.com/docs/ax/integrations/java/annotation/annotation-tracing) | — | — | ✅ |
| [Pydantic AI](https://ai.pydantic.dev/) | ✅ | — | — |
| [Smolagents](https://huggingface.co/docs/smolagents/) | ✅ | — | — |
| [Spring AI](https://docs.spring.io/spring-ai/reference/) | — | — | ✅ |
| [Vercel AI SDK](https://ai-sdk.dev/) | — | ✅ | — |

## The agent — Wonder Toys

Every directory in the repo runs the same chat-to-purchase toy-store assistant, powered by Claude (Anthropic) for most tiers and OpenAI for the voice and agents-SDK tiers. It can:

- **Search** a 200-product inventory via semantic vector search (ChromaDB) with keyword fallback
- **Browse** products with rich markdown cards — images, prices, ratings, age ranges, descriptions
- **Purchase** products with shipping details (credit card assumed on file)
- **Track** order status by order ID or natural-language product search
- **Cancel** orders that haven't been delivered yet

The UI includes a home page with featured products and category chips, product detail pages, a shopping cart, and a streaming chat interface that renders product cards inline. The `openai-voice` tier adds a text/voice toggle that streams audio in and out via the OpenAI Realtime API.

## Repo layout

```tree
rosetta/
├── no-observability/          No instrumentation (baseline)
│   ├── agno-py/                 Agno (Python + Next.js)
│   ├── annotation-java/         OpenInference Annotation Tracing (Java + Next.js)
│   ├── arconia-java/            Arconia (Java + Next.js)
│   ├── autogen-py/              AutoGen AgentChat (Python + Next.js)
│   ├── aws-strands-py/          AWS Strands (Python + Next.js)
│   ├── beeai-py/                BeeAI (Python + Next.js)
│   ├── beeai-ts/                BeeAI framework (TypeScript)
│   ├── crewai-py/               CrewAI (Python + Next.js)
│   ├── dspy-py/                 DSPy (Python + Next.js)
│   ├── google-adk-py/           Google ADK (Python + Next.js)
│   ├── haystack-py/             Haystack (Python + Next.js)
│   ├── langchain-js/            LangChain.js / LangGraph (TypeScript)
│   ├── langchain-py/            LangChain / LangGraph (Python + Next.js)
│   ├── langchain4j-java/        LangChain4j (Java + Next.js)
│   ├── llamaindex-py/           LlamaIndex (Python + Next.js)
│   ├── llamaindex-workflows-py/ LlamaIndex Workflows (Python + Next.js)
│   ├── mastra/                  Mastra framework (TypeScript)
│   ├── microsoft-agent-py/      Microsoft Agent Framework (Python + Next.js)
│   ├── openai-agents-py/        OpenAI Agents SDK (Python + Next.js)
│   ├── openai-agents-ts/        OpenAI Agents SDK (TypeScript)
│   ├── openai-voice/            OpenAI Realtime API + Chat Completions (Python + Next.js)
│   ├── pydantic-ai-py/          Pydantic AI (Python + Next.js)
│   ├── semantic-kernel-py/      Microsoft Semantic Kernel (Python + Next.js)
│   ├── smolagents-py/           Smolagents (Python + Next.js)
│   ├── spring-ai-java/          Spring AI (Java + Next.js)
│   └── vercel-ai-sdk/           Vercel AI SDK (TypeScript)
├── phoenix/                   Arize Phoenix Cloud instrumentation (same set of frameworks)
├── ax/                        Arize AX instrumentation (same set of frameworks)
├── evals/                     Shared synthetic requests + eval harness (text + voice)
├── product-images/            200 AI-generated product images (shared via symlinks)
└── chroma-data/               ChromaDB vector store (gitignored, auto-created)
```

Every tier × framework directory is a fully functional, self-contained Next.js app. The only differences between observability tiers are the instrumentation setup — agent logic, tools, UI, and data are identical.

## Quick start

```bash
cd <tier>/<framework>       # e.g. phoenix/mastra
cp env.example .env.local   # fill in your API keys
npm install
npm run dev                 # starts ChromaDB + indexes products + runs the app
```

`npm run dev` handles everything:

1. Creates a Python venv and installs ChromaDB (via [uv](https://docs.astral.sh/uv/))
2. Starts ChromaDB if not already running
3. Indexes all 200 products if the collection is missing
4. Starts the dev server (Next.js for JS frameworks; Python backend + Next.js for Python frameworks)

All tiers share the same ChromaDB instance at the repo root, so you only index once.

To skip ChromaDB (search falls back to keyword matching): `npm run dev:next`.

### Prerequisites

- Node.js 20+
- [uv](https://docs.astral.sh/uv/) (for ChromaDB's Python venv)
- An [Anthropic API key](https://console.anthropic.com/) (all tiers except `openai-voice`)
- An [OpenAI API key](https://platform.openai.com/api-keys) (`openai-voice` only)
- [X/Twitter OAuth credentials](https://developer.x.com/) for sign-in
- Observability credentials for the phoenix or ax tier you want to run

### Environment variables

Every agent needs these in `.env.local`:

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | All except `openai-voice` | Claude API key |
| `OPENAI_API_KEY` | `openai-voice` only | OpenAI key for Realtime + Chat Completions |
| `NEXTAUTH_SECRET` | All | Session encryption key (`openssl rand -base64 32`) |
| `TWITTER_CLIENT_ID` | All | X/Twitter OAuth app client ID |
| `TWITTER_CLIENT_SECRET` | All | X/Twitter OAuth app client secret |
| `BACKEND_SECRET` | Python frameworks | Shared secret for Next.js ↔ Python auth (any string) |
| `BACKEND_URL` | Python frameworks | Python backend URL (default: `http://localhost:8001`) |

**Phoenix tier** adds:

| Variable | Description |
|----------|-------------|
| `PHOENIX_COLLECTOR_ENDPOINT` | Phoenix Cloud endpoint (e.g. `https://app.phoenix.arize.com/s/your-space`) |
| `PHOENIX_API_KEY` | Phoenix API key from [app.phoenix.arize.com](https://app.phoenix.arize.com) |
| `PHOENIX_PROJECT_NAME` | Project name in Phoenix |

> TypeScript frameworks require the full OTLP URL including `/v1/traces`. Python frameworks expect just the base URL, as `arize-phoenix-otel` appends the path automatically.

**AX tier** adds:

| Variable | Description |
|----------|-------------|
| `ARIZE_SPACE_ID` | AX space ID from [app.arize.com](https://app.arize.com) |
| `ARIZE_API_KEY` | AX API key |
| `ARIZE_PROJECT_NAME` | Project name in AX |

See each directory's `env.example` for the full template.

## Observability tiers

| Tier | What it shows |
|------|---------------|
| **no-observability** | Baseline — how the agent works with zero instrumentation overhead |
| **phoenix** | [Arize Phoenix Cloud](https://phoenix.arize.com) — open-source observability |
| **ax** | [Arize AX](https://arize.com) — enterprise observability |

## What changes between tiers — by framework

This is the heart of the repo. Below, for each framework, are the **only** files that differ between `no-observability` and the instrumented tiers. Everything else (agent logic, tools, UI, vector search, data) is identical.

If you're instrumenting your own app, find the framework you use, read what files change, and copy the pattern.

### Mastra

- `src/mastra/index.ts` — observability config in the Mastra constructor
- `next.config.ts` — `serverExternalPackages` for observability packages
- `package.json` — observability dependencies
- `env.example` — observability environment variables

### LangChain.js

- `src/langchain/agent.ts` — observability setup at the top of the file (before LangChain imports)
- `next.config.ts` — `serverExternalPackages` for observability packages
- `package.json` — observability dependencies
- `env.example` — observability environment variables

### Vercel AI SDK

- `src/instrumentation.ts` — `registerOTel` with OTLP exporter (new file)
- `src/root-aware-processor.ts` — custom span processor that promotes the first AI SDK span to trace root and drops HTTP spans (new file)
- `src/app/api/chat/route.ts` — session ID injected into OTel context via `context.with(setSession(...))`
- `src/components/Chat.tsx` — session ID generated/rotated and sent as `x-session-id` request header
- `next.config.ts` — `serverExternalPackages` for observability packages
- `package.json` — observability dependencies
- `env.example` — observability environment variables

### Agno

- `backend/tracing.py` — tracing initialization (new file, imported before `agno`). Uses the standard `register()` + `AgnoInstrumentor().instrument(tracer_provider=...)` pattern. The OpenInference Agno instrumentation auto-emits `session.id` and `user.id` from the values passed to `agent.arun(session_id=..., user_id=...)` — no `using_session()` wrap needed.
- `backend/main.py` — imports `backend.tracing` before other backend modules
- `backend/requirements.txt` — observability packages (`arize-phoenix-otel` or `arize-otel` + `openinference-instrumentation-agno`)
- `env.example` — observability environment variables

### AutoGen AgentChat

- `backend/tracing.py` — tracing initialization (new file, imported before `autogen_agentchat`). The instrumentation package is `openinference-instrumentation-autogen-agentchat` (AgentChat layer) — not `openinference-instrumentation-autogen` (low-level core).
- `backend/agent.py` — wraps `agent.run_stream()` in `using_session(user_id)` + `using_user(user_id)` because the instrumentor doesn't auto-emit `session.id` / `user.id`. A `try/except ImportError` fallback keeps no-observability working without an `openinference.instrumentation` dependency.
- `backend/main.py` — imports `backend.tracing` before other backend modules
- `backend/requirements.txt` — adds `arize-phoenix-otel` or `arize-otel` + `openinference-instrumentation-autogen-agentchat`
- `env.example` — observability environment variables

> AutoGen's `FunctionTool` requires plain-string `Annotated[str, "what this is"]` tool descriptions instead of the Pydantic `Annotated[..., Field(description=...)]` style other Python tiers use, so `backend/tools.py` is rewritten in the same way across all three AutoGen tiers.

### AWS Strands

- `backend/tracing.py` — tracing initialization (new file, imported before `strands`). Builds a `TracerProvider` with **two span processors in order**: `StrandsAgentsToOpenInferenceProcessor` (mutates Strands' native gen_ai-conventioned spans in place into OpenInference shape), **then** the OTLP exporter (Phoenix or AX). Processor order matters — the OpenInference processor must run before the exporter sees the spans, otherwise gen_ai-only attributes ship.
- `backend/main.py` — imports `backend.tracing` before other backend modules so the global TracerProvider is set before Strands' singleton tracer caches its reference.
- `backend/requirements.txt` — adds `arize-phoenix-otel` or `arize-otel` + `openinference-instrumentation-strands-agents`
- `env.example` — observability environment variables

> `backend/agent.py` is shared across all three tiers. The Strands `Agent` is built with `trace_attributes={"session.id": user_id, "user.id": user_id}` so every span carries the IDs — the Strands OpenInference processor doesn't propagate baggage from `using_session()` to span attributes. The agent loop also wraps `agent.stream_async()` in `using_session(user_id)` as a belt-and-braces fallback.

### BeeAI

- `backend/tracing.py` — tracing initialization (new file, imported before `beeai_framework`). Uses `register()` + `BeeAIInstrumentor().instrument(tracer_provider=...)`. The instrumentor subscribes to `Emitter.root()` and converts BeeAI's internal events into OpenInference spans. `session.id` is auto-tagged via `using_session(user_id)` around `agent.run()` in `agent.py`.
- `backend/main.py` — imports `backend.tracing` before other backend modules
- `backend/requirements.txt` — adds `arize-phoenix-otel` or `arize-otel` + `openinference-instrumentation-beeai`
- `env.example` — observability environment variables

### CrewAI

- `backend/tracing.py` — tracing initialization (new file, imported before `crewai`)
- `backend/main.py` — imports `backend.tracing` before other backend modules
- `backend/requirements.txt` — adds `arize-phoenix-otel` or `arize-otel` + `openinference-instrumentation-crewai`
- `env.example` — observability environment variables

### DSPy

- `backend/tracing.py` — tracing initialization (new file, imported before `dspy`). Uses `register()` plus **both** `DSPyInstrumentor` and `LiteLLMInstrumentor` — DSPy is built on LiteLLM, so installing both gives complete coverage from agent down to each LLM call.
- `backend/main.py` — imports `backend.tracing` before other backend modules
- `backend/requirements.txt` — adds `arize-phoenix-otel` or `arize-otel` + `openinference-instrumentation-dspy` + `openinference-instrumentation-litellm`
- `env.example` — observability environment variables
- The DSPy OpenInference instrumentor doesn't emit `session.id` automatically, so `agent.py` wraps the streaming call in `with using_session(user_id):` across all three tiers (no-obs falls back to a no-op contextmanager when `openinference` isn't installed).

### Google ADK

- `backend/tracing.py` — tracing initialization (new file, imported before `google.adk`). Uses `register()` + `GoogleADKInstrumentor().instrument(tracer_provider=...)`. Auto-emits `session.id` from the ADK Runner's `session_id` — no `using_session()` wrap needed.
- `backend/main.py` — imports `backend.tracing` before other backend modules
- `backend/requirements.txt` — adds `arize-phoenix-otel` or `arize-otel` + `openinference-instrumentation-google-adk`
- `env.example` — observability environment variables

### Haystack

- `backend/tracing.py` — tracing initialization (new file, imported before `haystack`). Uses `register()` + `HaystackInstrumentor().instrument(tracer_provider=...)`.
- `backend/main.py` — imports `backend.tracing` before other backend modules
- `backend/requirements.txt` — adds `arize-phoenix-otel` or `arize-otel` + `openinference-instrumentation-haystack`
- `env.example` — observability environment variables

> `backend/agent.py` is shared across all three tiers and wraps `agent.run_async` in `using_session(user_id)` because the Haystack instrumentor doesn't emit it on its own. No-obs falls back to `nullcontext()` when `openinference.instrumentation` isn't installed.

### LangChain Python

- `backend/tracing.py` — tracing initialization (new file, imported before LangChain)
- `backend/main.py` — imports `backend.tracing` before other backend modules
- `backend/requirements.txt` — adds `arize-phoenix-otel` or `arize-otel` + `openinference-instrumentation-langchain`
- `env.example` — observability environment variables

### LlamaIndex Python

- `backend/tracing.py` — tracing initialization (new file, imported before LlamaIndex)
- `backend/agent.py` — manual root span + OTel context management for proper trace boundaries (see [`phoenix/llamaindex-py/README.md`](./phoenix/llamaindex-py/README.md) for the three workarounds)
- `backend/main.py` — imports `backend.tracing` before other backend modules
- `backend/requirements.txt` — adds `arize-phoenix-otel` or `arize-otel` + `openinference-instrumentation-llama-index`
- `env.example` — observability environment variables

### LlamaIndex Workflows

- `backend/tracing.py` — tracing initialization (new file, imported before LlamaIndex). The same `LlamaIndexInstrumentor` that covers `llamaindex-py` also covers Workflow / `@step` machinery, so workflow steps surface as CHAIN spans (`WonderToysWorkflow.prepare_chat_history`, `.handle_llm_input`, `.handle_tool_calls`) with `Anthropic.astream_chat` as nested LLM spans and `FunctionTool.acall` as TOOL spans.
- `backend/agent.py` — manual `agent` root span tagged `openinference.span.kind=AGENT` with `input.value`, `output.value`, `session.id`, `user.id`. Same three LlamaIndex-tracing workarounds as the `llamaindex-py` tier.
- `backend/main.py` — imports `backend.tracing` before other backend modules
- `backend/requirements.txt` — adds `arize-phoenix-otel` or `arize-otel` + `openinference-instrumentation-llama-index`
- `env.example` — observability environment variables

### Microsoft Agent Framework

- `backend/tracing.py` — tracing initialization (new file, imported before `agent_framework`). Manually constructs a `TracerProvider` with `Resource.create({PROJECT_NAME: …})` plus `AgentFrameworkToOpenInferenceProcessor` to reshape MAF's GenAI-convention spans into OpenInference. The `register()` shortcut doesn't route MAF spans to the configured project — see [`phoenix/microsoft-agent-py/backend/tracing.py`](./phoenix/microsoft-agent-py/backend/tracing.py) for the working pattern.
- `backend/main.py` — imports `backend.tracing` before other backend modules
- `backend/requirements.txt` — adds `arize-phoenix-otel` or `arize-otel` + `openinference-instrumentation-agent-framework`
- `env.example` — observability environment variables

### Microsoft Semantic Kernel

- `backend/tracing.py` — tracing initialization (new file, imported before `semantic_kernel`). Uses `openinference-instrumentation-anthropic` directly against the global TracerProvider set up by `phoenix.otel.register` / `arize.otel.register`. The Arize docs' suggested OpenLIT bridge is **not** used — OpenLIT has no `semantic_kernel` instrumentor, and its anthropic instrumentor wraps streaming responses in a class that breaks SK's `isinstance(response, AsyncStream)` introspection.
- `backend/main.py` — imports `backend.tracing` before other backend modules
- `backend/requirements.txt` — adds `arize-phoenix-otel` or `arize-otel` + `openinference-instrumentation-anthropic`
- `env.example` — observability environment variables

> `backend/agent.py` is shared across all three tiers and wraps `ChatCompletionAgent.invoke_stream` in `using_session(user_id)`. SK emits its own native OTel `agent` / `AutoFunctionInvocationLoop` / `execute_tool` spans automatically, so the trace tree gets AGENT + CHAIN + TOOL + LLM kinds without manual wrapping. Note: SK's Anthropic connector parser rejects `list[T]` tool args from Claude (`FunctionExecutionException: expected to be parsed to list[str] but is not`), so `backend/tools.py` declares list args as comma-separated strings and splits them inside each tool.

### OpenAI Agents SDK

- `backend/tracing.py` — tracing initialization (new file, imported before `agents`). Uses the standard `register()` + `OpenAIAgentsInstrumentor().instrument(tracer_provider=...)` pattern. **Phoenix tier quirk**: `register()` must be called with `protocol="http/protobuf"` — the default `grpc` protocol mis-routes the configured `PHOENIX_COLLECTOR_ENDPOINT=http://localhost:6006/v1/traces` to the gRPC port 4317 and traces never land.
- `backend/main.py` — imports `backend.tracing` before other backend modules
- `backend/requirements.txt` — adds `arize-phoenix-otel` or `arize-otel` + `openinference-instrumentation-openai-agents`
- `env.example` — observability environment variables

> `backend/agent.py` is shared across all three tiers and is the only Python tier whose LLM is **not** Anthropic Claude — it uses OpenAI's native Responses API via `model="gpt-5.4-mini"`, because the OpenAI Agents SDK is OpenAI's own SDK and the LiteLLM-to-Anthropic adapter bypasses the SDK's native tracing hooks. The agent loop wraps `Runner.run_streamed()` in `using_session(user_id)` so `session.id` lands on spans (the OpenInference instrumentor for openai-agents does not emit it automatically). Observability tiers call `flush_traces()` in the streaming generator's `finally` block — without it, spans buffer in the trace processor across FastAPI requests and never reach the OTel BatchSpanProcessor. The no-observability tier falls back to a `nullcontext()` shim when `openinference.instrumentation` isn't installed.

### OpenAI Agents SDK (TypeScript)

- `src/ai/tracing.ts` — **new file** in observability tiers. Phoenix calls `register({ projectName, url, apiKey, spanProcessors: [...] })` from `@arizeai/phoenix-otel`, passing a local `OpenInferenceFilteredBatchSpanProcessor` (a ~15-line subclass of OTel's standard `BatchSpanProcessor` defined in `src/ai/oi-filter-processor.ts` that drops any span without an `openinference.span.kind` attribute) — this filter is **load-bearing**, because Next.js's auto-OTel would otherwise pipe its HTTP / fetch / page-render spans through the same global provider and pollute the Phoenix project. AX builds a `NodeTracerProvider` by hand with the same filter processor wrapping an `OTLPTraceExporter` pointed at `https://otlp.arize.com/v1/traces` with `space_id` + `api_key` headers and the `openinference.project.name` resource attribute set — and deliberately does **not** call `provider.register()`, sidestepping the Next.js-pollution problem at the registration layer too. The filter is defined locally rather than imported from `@arizeai/openinference-vercel` so the OpenAI Agents tiers don't carry a Vercel-specific dependency. Both then run `new OpenAIAgentsInstrumentation({ tracerProvider }).manuallyInstrument(agents)` — the instrumentor doesn't monkey-patch the SDK; it implements the agents SDK's first-class `TracingProcessor` interface and registers via the SDK's own `setTraceProcessors` API.
- `instrumentation.ts` — Next.js auto-detects this file at the root and runs `register()` once per server process at startup, before user-land modules load. It delegates to `initTracing()` in `src/ai/tracing.ts`.
- `next.config.ts` — adds `@openai/agents` + `@openai/agents-core` + `@arizeai/openinference-instrumentation-openai-agents` (+ `@arizeai/phoenix-otel` for the Phoenix tier) to `serverExternalPackages` so Turbopack doesn't try to bundle them.
- `package.json` — adds the OpenInference instrumentor + OTel SDK packages; bumps `zod` to v4 (peer-dep requirement of `@openai/agents`).
- `env.example` — observability environment variables.
- `src/app/api/chat/route.ts` (AX tier only) — calls `getTracerProvider()?.forceFlush()` after the stream completes so spans are pushed out of the OTel batch buffer before the route handler exits.

> Both tiers use OpenAI's native Responses API (`model="gpt-5.4-mini"`), matching the Python `openai-agents-py` tier — the JS SDK could route through `@ai-sdk/anthropic` via `@openai/agents-extensions`, but using the native path keeps the tracing surface honest. The **AX tier intentionally does *not* call `provider.register()`** — making the provider global would otherwise let Next.js's built-in OTel auto-instrumentation pump its own HTTP infra spans into our project. The OpenInference instrumentor resolves its tracer directly off the provider we hand it, so the global-registration step isn't needed. Phoenix's `register()` does its own snapshot/restore of the global state, so the same caveat doesn't apply.

### OpenAI Voice

The voice tier is built on the OpenAI Agents SDK with the `realtime` extras — `RealtimeAgent` + `RealtimeRunner` for voice, `Agent` + `Runner` for the text fallback. The same `@function_tool`-decorated functions in `backend/tools.py` serve both modes. `OpenAIAgentsInstrumentor().instrument(...)` patches both runtimes, so all tracing is automatic — no per-event handlers, no hand-rolled span tree.

- `backend/tracing.py` — **new file** in observability tiers. AX calls `arize.otel.register(...)`; Phoenix calls `phoenix.otel.register(..., protocol="http/protobuf", batch=True)`. Both then call `OpenAIAgentsInstrumentor().instrument(tracer_provider=provider)`. That's the entire tracing surface.
- `backend/main.py` — imports `backend.tracing` at the top so the instrumentor patches `agents.realtime` before the runtime imports it
- `backend/voice_agent.py` — calls `flush_traces()` on session end so the per-turn spans reach the OTel `BatchSpanProcessor` (long-running servers don't auto-flush)
- `backend/chat_agent.py` — same — `flush_traces()` in the streaming generator's `finally` block per text-mode request
- `backend/requirements.txt` — adds `arize-otel` (ax) or `arize-phoenix-otel` (phoenix), plus `openinference-instrumentation-openai-agents`
- `env.example` — adds `ARIZE_*` (ax) or `PHOENIX_*` (phoenix)
- `src/app/api/chat/route.ts` — eval-bypass header check (`x-eval-secret` / `x-eval-user-id`) in the ax tier

The instrumentor emits the canonical OpenInference voice span tree per turn — `AUDIO conversation.turn` → `USER user` + `LLM assistant` → `TOOL <tool_name>` — with audio captured inline as `data:audio/wav;base64,...` URIs on `input.audio.url` / `output.audio.url`. Phoenix and AX both render the trace card audio player from those data URIs (Arize re-hosts to its multimodal bucket on ingest), so no external file hosting is needed.

> The `ax/openai-voice` and `phoenix/openai-voice` tiers' Python code is byte-identical apart from the `register(...)` call in `tracing.py` and the corresponding requirements + env vars. Phoenix needs `protocol="http/protobuf"` — the gRPC default rewrites the port from 6006 to 4317 and traces never land.

### Pydantic AI

- `backend/tracing.py` — tracing initialization (new file, imported before `pydantic_ai`). Calls `Agent.instrument_all(InstrumentationSettings(tracer_provider=…))` after registering the tracer provider — Pydantic AI doesn't emit OTel spans without this. `OpenInferenceSpanProcessor` reshapes the spans before export.
- `backend/main.py` — imports `backend.tracing` before other backend modules
- `backend/requirements.txt` — adds `arize-phoenix-otel` or `arize-otel` + `openinference-instrumentation-pydantic-ai`
- `env.example` — observability environment variables

### Smolagents

- `backend/tracing.py` — tracing initialization (new file, imported before `smolagents`). Uses `register()` + `SmolagentsInstrumentor().instrument(tracer_provider=…)`. The smolagents OpenInference instrumentor doesn't auto-emit `session.id` — `agent.py` wraps every `agent.run(...)` in `using_session(user_id)` so traces are grouped by user (no-obs falls back to a `nullcontext()` shim, so the wrap is identical across all three tiers).
- `backend/main.py` — imports `backend.tracing` before other backend modules
- `backend/requirements.txt` — adds `arize-phoenix-otel` or `arize-otel` + `openinference-instrumentation-smolagents`
- `env.example` — observability environment variables

### LangChain4j

- `backend/src/main/java/com/wondertoys/Tracing.java` — **new file** in observability tiers. Builds an OpenTelemetry `SdkTracerProvider` + OTLP exporter (HTTP/protobuf for Phoenix, gRPC for AX) and registers an `AiServiceRequestIssuedListener` that bridges LangChain4j's request lifecycle into OpenInference spans.
- `backend/build.gradle.kts` — adds `openinference-instrumentation-langchain4j` + tier-appropriate OTLP exporter
- `backend/src/main/resources/application.yml` — Phoenix or AX endpoint + project name properties
- `env.example` — observability environment variables

### Spring AI

- `backend/src/main/java/com/wondertoys/Tracing.java` — **new file** in observability tiers. Builds an OpenTelemetry SDK + OTLP exporter and exposes a Micrometer `ObservationRegistry` bean with `SpringAIInstrumentor` registered on it. Spring AI's auto-config picks up the registry via `ObjectProvider<ObservationRegistry>` and emits OpenInference-shaped LLM spans automatically.
- `backend/build.gradle.kts` — adds `openinference-instrumentation-springAI` + OTel SDK + tier-appropriate OTLP exporter
- `backend/src/main/resources/application.yml` — Phoenix or AX endpoint + project name properties
- `env.example` — observability environment variables

### Arconia

- `backend/src/main/resources/application.yml` — adds an `arconia.otel.*` block (endpoint, headers, resource attributes). Arconia's `arconia-opentelemetry-spring-boot-starter` auto-configures the OTel SDK + OTLP exporter from these properties, and `arconia-openinference-ai-semantic-conventions` reshapes Spring AI's built-in micrometer observations into OpenInference span attributes — so there is **no `Tracing.java` Java code in this tier** at all.
- `backend/build.gradle.kts` — adds `arconia-bom` + `arconia-opentelemetry-spring-boot-starter` + `arconia-openinference-ai-semantic-conventions` (and `opentelemetry-exporter-sender-okhttp` for the AX gRPC tier). Requires Spring Boot 4.0.x and Spring AI 2.0.0-M8.
- `env.example` — observability environment variables. `PHOENIX_COLLECTOR_ENDPOINT` here is the *base* URL (no `/v1/traces`) because Arconia auto-appends it — this differs from the other tiers.

### OpenInference Annotation Tracing

This isn't really a framework — it's a library for instrumenting hand-built agents. The agent loop in this tier is a hand-rolled tool-use loop calling Claude directly via the official `com.anthropic:anthropic-java` SDK, with the annotations applied to the methods that participate in the loop.

- `backend/src/main/java/com/wondertoys/App.java` — calls `OpenInferenceAgentInstaller.install()` **before** `SpringApplication.run()` so the ByteBuddy Java agent retransforms `@Agent` / `@Chain` / `@LLM` / `@Tool` annotated methods before Spring loads them.
- `backend/src/main/java/com/wondertoys/Tracing.java` — **new file** in observability tiers. Builds the OTel SDK, wraps it in an `OITracer`, and hands it to `OpenInferenceAgent.register(...)` so the ByteBuddy advice has a tracer to emit through.
- `backend/build.gradle.kts` — adds `com.arize:openinference-instrumentation-annotation` + OTel SDK + tier-appropriate OTLP exporter
- `backend/src/main/resources/application.yml` — Phoenix or AX endpoint + project name properties
- `env.example` — observability environment variables

## Framework reference

If you're picking which framework to read first, this table is a quick comparison of the agent runtime, LLM client, and streaming API used by each.

| Framework | Agent library | LLM client | Streaming API | Architecture |
|-----------|---------------|------------|---------------|--------------|
| **Agno** | `agno.agent.Agent` + `InMemoryDb` | `agno.models.anthropic.Claude` | `agent.arun(stream=True, stream_events=True)` over `RunContentEvent` / `ToolCallStartedEvent` | Python FastAPI backend + Next.js frontend |
| **Arconia** | Spring AI `ChatClient` + `@Tool` methods (Spring Boot 4) | `spring-ai-starter-model-anthropic` | `chatClient.prompt().stream().chatResponse()` returns `Flux<ChatResponse>` | Spring Boot Java backend + Next.js frontend |
| **AutoGen AgentChat** | `autogen_agentchat` AssistantAgent | `autogen_ext.models.anthropic.AnthropicChatCompletionClient` | `agent.run_stream()` over `ModelClientStreamingChunkEvent` (`model_client_stream=True`) | Python FastAPI backend + Next.js frontend |
| **AWS Strands** | `strands.Agent` with per-user instance + `@tool`-decorated functions | `strands.models.anthropic.AnthropicModel` (direct Anthropic API, not Bedrock) | `agent.stream_async(prompt)` over `{"data": ...}` text-delta events + `{"current_tool_use": ...}` tool events | Python FastAPI backend + Next.js frontend |
| **BeeAI** | `beeai_framework` `RequirementAgent` + `UnconstrainedMemory` | `ChatModel.from_name("anthropic:claude-sonnet-4")` (litellm) | `agent.run(...).observe(...)` over `RequirementAgentFinalAnswerEvent.delta` | Python FastAPI backend + Next.js frontend |
| **BeeAI (TypeScript)** | `beeai-framework` ReActAgent + UnconstrainedMemory | `AnthropicChatModel` (wraps `@ai-sdk/anthropic`) | `agent.run().observe(emitter)` — `partialUpdate` with `update.key === "final_answer"` | Next.js monolith |
| **CrewAI** | `crewai` Agent + Task + Crew | `crewai.LLM("anthropic/claude-sonnet-4-5")` (litellm) | `crewai_event_bus` `LLMStreamChunkEvent` | Python FastAPI backend + Next.js frontend |
| **DSPy** | `dspy.ReAct` over a `dspy.Signature` + `dspy.History` | `dspy.LM("anthropic/claude-sonnet-4")` (litellm) | `dspy.streamify` + `StreamListener(signature_field_name="answer")` | Python FastAPI backend + Next.js frontend |
| **Google ADK** | `google.adk` Agent + Runner + `InMemorySessionService` | `LiteLlm("anthropic/claude-sonnet-4")` | `Runner.run_async(streaming_mode=SSE)` over `Event` (`event.partial`) | Python FastAPI backend + Next.js frontend |
| **Haystack** | `haystack.components.agents.Agent` | `AnthropicChatGenerator` (`anthropic-haystack`) | `streaming_callback(StreamingChunk)` bridged into an asyncio queue | Python FastAPI backend + Next.js frontend |
| **LangChain.js** | `@langchain/langgraph` ReAct agent | `@langchain/anthropic` | `streamEvents` (v2) | Next.js monolith |
| **LangChain Python** | `langgraph` ReAct agent | `langchain-anthropic` | `astream_events` (v2) | Python FastAPI backend + Next.js frontend |
| **LangChain4j** | `dev.langchain4j.service.AiServices` (declarative AI services) | `AnthropicStreamingChatModel` | `AiServices` `TokenStream` callback | Spring Boot Java backend + Next.js frontend |
| **LlamaIndex Python** | `llama_index` FunctionAgent | `llama-index-llms-anthropic` | `stream_events` | Python FastAPI backend + Next.js frontend |
| **LlamaIndex Workflows** | Hand-rolled `Workflow` with `@step` methods + custom `Event` types | `llama-index-llms-anthropic` (`Anthropic.astream_chat_with_tools`) | `handler.stream_events()` over a workflow's `StreamEvent` events written by `ctx.write_event_to_stream(...)` | Python FastAPI backend + Next.js frontend |
| **Mastra** | `@mastra/core` Agent | `@ai-sdk/anthropic` (Vercel AI SDK) | `stream.fullStream` | Next.js monolith |
| **Microsoft Agent Framework** | `agent_framework` Agent + AgentSession | `agent_framework.anthropic.AnthropicClient` | `agent.run(stream=True)` over `AgentResponseUpdate` events | Python FastAPI backend + Next.js frontend |
| **Microsoft Semantic Kernel** | `semantic_kernel.agents` `ChatCompletionAgent` + `ChatHistoryAgentThread` | `semantic_kernel.connectors.ai.anthropic.AnthropicChatCompletion` | `agent.invoke_stream()` over `StreamingChatMessageContent` chunks | Python FastAPI backend + Next.js frontend |
| **OpenAI Agents SDK** | `agents.Agent` + `SQLiteSession` + `@function_tool` | Native OpenAI Responses API (`model="gpt-5.4-mini"`) — not Anthropic | `Runner.run_streamed().stream_events()` filtered on `raw_response_event` + `ResponseTextDeltaEvent` | Python FastAPI backend + Next.js frontend |
| **OpenAI Agents SDK (TypeScript)** | `@openai/agents` `Agent` + per-request `AgentInputItem[]` history + `tool(...)` with Zod schemas | Native OpenAI Responses API (`model="gpt-5.4-mini"`) — not Anthropic | `run(agent, history, { stream: true })` over `stream.toStream()` — `raw_model_stream_event` → `output_text_delta` for tokens, `run_item_stream_event` for tool boundaries | Next.js monolith |
| **OpenAI Voice** | OpenAI Agents SDK with the `realtime` extras — `RealtimeAgent` + `RealtimeRunner` for voice, `Agent` + `Runner` for text fallback. Same 5 `@function_tool` wrappers serve both | `openai-agents` (`gpt-realtime` voice, `gpt-4o` text) | Voice: `async for event in session` over `RealtimeAudio` / `RealtimeHistoryAdded` / `RealtimeRawModelEvent`. Text: `Runner.run_streamed().stream_events()` | Python FastAPI backend (HTTP `/chat` + WS `/voice`) + Next.js frontend |
| **OpenInference Annotation Tracing** | Hand-rolled tool-loop using the Anthropic Java SDK, with `@Agent` / `@Chain` / `@LLM` / `@Tool` annotations applied via ByteBuddy at startup | `com.anthropic:anthropic-java` SDK | Anthropic SDK `messages.stream(...)` `MessageStreamEvent` | Spring Boot Java backend + Next.js frontend |
| **Pydantic AI** | `pydantic_ai` Agent | `"anthropic:claude-sonnet-4"` model string | `agent.run_stream_events()` over PartStart/PartDelta events | Python FastAPI backend + Next.js frontend |
| **Smolagents** | `smolagents.ToolCallingAgent` | `LiteLLMModel("anthropic/claude-sonnet-4")` | `agent.run(stream=True)` over `ChatMessageStreamDelta` (`stream_outputs=True`) | Python FastAPI backend + Next.js frontend |
| **Spring AI** | `spring-ai-anthropic` `ChatClient` + `@Tool` methods | `spring-ai-starter-model-anthropic` | `chatClient.prompt().stream().chatResponse()` returns `Flux<ChatResponse>` | Spring Boot Java backend + Next.js frontend |
| **Vercel AI SDK** | Vercel AI SDK `streamText` | `@ai-sdk/anthropic` | `result.fullStream` | Next.js monolith |

## Evaluations

Each observability tier includes an eval harness for testing agent quality. All frameworks share the same 25 synthetic requests and the same 6 evaluators.

### Phoenix — programmatic

```bash
cd phoenix/<framework>
npm install
npm run synthetic-requests      # generate 25 traces
npm run evals                    # run 6 evaluators, log results as span annotations
```

### AX — UI-driven

```bash
cd ax/<framework>
npm install
npm run synthetic-requests      # generate 25 traces
```

Then configure the same 6 evaluators in the [Arize AX console](https://app.arize.com) using LLM-as-a-Judge and Code Evaluator task types. See [`evals/README.md`](./evals/README.md) for step-by-step setup with prompt templates and code — evaluators apply to all projects.

### Voice harness (openai-voice tier only)

The `openai-voice` tier ships a synthetic *voice* runner too. Instead of text prompts hitting `/api/chat`, pre-generated MP3 prompts are streamed through the voice WebSocket — same path a real microphone uses, so every prompt produces a full `AUDIO conversation.turn` → `USER` + `LLM` → `TOOL` trace tree.

```bash
cd phoenix/openai-voice         # or ax/openai-voice, or no-observability/openai-voice
npm install
npm run voice-requests          # 8 voice prompts → 8 voice sessions
```

The MP3 prompts live in [`evals/voice-prompts/`](./evals/voice-prompts/) — generated once via OpenAI TTS (`evals/generate-voice-prompts.py`) and committed so contributors don't need an OpenAI key just to run the harness.

### The 6 evaluators

- **Correctness** — Does the response address the user's request? (LLM judge)
- **Tool Selection** — Were the right tools chosen? (LLM judge)
- **Tool Response Handling** — Did the agent use tool results properly? (LLM judge)
- **Format Compliance** — Does the response follow markdown formatting rules? (LLM judge)
- **Image URL Correctness** — Do all image URLs match `/product-images/toy-XXX.png`? (code)
- **Tool Call Count** — Appropriate number of tool calls? (code)

## What you can learn

- **Instrumentation footprint per framework** — exactly which files you touch and what attributes you add, side-by-side across 22 frameworks
- **Phoenix vs AX differences** — what's identical (most things — both speak OpenInference), what's different (endpoint, registration call, occasional cookbook quirks)
- **Auto-instrumentation vs manual** — some frameworks have OpenInference auto-instrumentors that need almost zero code; some emit gen_ai-convention spans that need a translation processor; some emit nothing and need fully hand-rolled spans
- **Production patterns** — streaming architecture, vector search with fallbacks, in-memory order management, structured tool schemas, audio span attributes for the voice tier

## Tech stack

| Component | Technology |
|-----------|-----------|
| Web framework | Next.js 16 (App Router) |
| Python backend | FastAPI + uvicorn (Python frameworks only) |
| Styling | Tailwind CSS |
| Auth | NextAuth v4 + Twitter/X OAuth 2.0 |
| LLM | Anthropic Claude Sonnet (most tiers) / OpenAI `gpt-realtime` + `gpt-4o` (voice tier) |
| Vector search | ChromaDB + all-MiniLM-L6-v2 embeddings |
| Product images | AI-generated (gpt-image-1) |

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for how to add a new framework, run the end-to-end test harness, capture PR / demo screenshots, and other maintenance workflows.

## License

[MIT](./LICENSE)
