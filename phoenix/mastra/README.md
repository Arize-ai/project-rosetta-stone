# Wonder Toys — Mastra (Phoenix Instrumented)

This is the Mastra (TypeScript) variant of the Wonder Toys shopping agent, instrumented with Arize Phoenix Cloud for observability.

## Observability Setup

Phoenix instrumentation is configured entirely in `src/mastra/index.ts` via the Mastra constructor:

```typescript
import { ArizeExporter } from "@mastra/arize";

new Mastra({
  // ...
  telemetry: {
    enabled: true,
    exporter: new ArizeExporter({
      endpoint: process.env.PHOENIX_COLLECTOR_ENDPOINT!,
      apiKey: process.env.PHOENIX_API_KEY,
      projectName: process.env.PHOENIX_PROJECT_NAME,
    }),
  },
});
```

No other code changes are needed — Mastra auto-instruments agent runs, tool calls, and LLM requests.

## Differences from `no-observability/mastra`

Only observability-related files differ:

| File | Change |
|------|--------|
| `src/mastra/index.ts` | `ArizeExporter` added to Mastra telemetry config |
| `next.config.ts` | `serverExternalPackages` for observability packages |
| `package.json` | `@mastra/arize`, `@mastra/observability` added |
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
