# Wonder Toys — LangChain.js (Arize AX Instrumented)

This is the LangChain.js / LangGraph variant of the Wonder Toys shopping agent, instrumented with Arize AX for observability.

## Observability Setup

AX instrumentation is configured at the top of `src/langchain/agent.ts` using raw OpenTelemetry (no Phoenix SDK):

```typescript
import { LangChainInstrumentation } from "@arizeai/openinference-instrumentation-langchain";

// OTel SDK configured with OTLP exporter pointing to Arize
new LangChainInstrumentation().manuallyInstrument(/* ... */);
```

## Differences from `no-observability/langchain-js`

Only observability-related files differ:

| File | Change |
|------|--------|
| `src/langchain/agent.ts` | OTel + LangChain instrumentor added at top |
| `next.config.ts` | `serverExternalPackages` for observability packages |
| `package.json` | `@arizeai/openinference-instrumentation-langchain`, OTel packages added |
| `env.example` | AX env vars added |
| `evals/` | **New** — synthetic request harness + eval setup guide (UI-driven) |

All frontend code, tools, and agent logic are identical to the no-observability version.

## Running

```bash
cp env.example .env.local   # fill in your API keys + AX credentials
npm install
npm run dev
```

See the [root README](../../README.md) for full details.
