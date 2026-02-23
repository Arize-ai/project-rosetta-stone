# Wonder Toys — LangChain.js (Phoenix Instrumented)

This is the LangChain.js / LangGraph variant of the Wonder Toys shopping agent, instrumented with Arize Phoenix Cloud for observability.

## Observability Setup

Phoenix instrumentation is configured at the top of `src/langchain/agent.ts`, before any LangChain imports:

```typescript
import { registerOTel } from "@arizeai/phoenix-otel";
import { LangChainInstrumentation } from "@arizeai/openinference-instrumentation-langchain";

registerOTel({
  endpoint: process.env.PHOENIX_COLLECTOR_ENDPOINT,
  apiKey: process.env.PHOENIX_API_KEY,
  project: process.env.PHOENIX_PROJECT_NAME,
});
new LangChainInstrumentation().manuallyInstrument(/* ... */);
```

## Differences from `no-observability/langchain-js`

Only observability-related files differ:

| File | Change |
|------|--------|
| `src/langchain/agent.ts` | Phoenix OTel + LangChain instrumentor added at top |
| `next.config.ts` | `serverExternalPackages` for observability packages |
| `package.json` | `@arizeai/phoenix-otel`, `@arizeai/openinference-instrumentation-langchain` added |
| `env.example` | Phoenix env vars added |
| `evals/` | **New** — synthetic request harness + programmatic eval runner |

All frontend code, tools, and agent logic are identical to the no-observability version.

## Running

```bash
cp env.example .env.local   # fill in your API keys + Phoenix credentials
npm install
npm run dev
```

See the [root README](../../README.md) for full details.
