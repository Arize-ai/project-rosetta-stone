# Wonder Toys — Mastra (Arize AX Instrumented)

This is the Mastra (TypeScript) variant of the Wonder Toys shopping agent, instrumented with Arize AX for observability.

## Observability Setup

AX instrumentation is configured entirely in `src/mastra/index.ts` via the Mastra constructor:

```typescript
import { ArizeExporter } from "@mastra/arize";

new Mastra({
  // ...
  telemetry: {
    enabled: true,
    exporter: new ArizeExporter({
      spaceId: process.env.ARIZE_SPACE_ID,
      apiKey: process.env.ARIZE_API_KEY,
      projectName: process.env.ARIZE_PROJECT_NAME,
    }),
  },
});
```

Same `@mastra/arize` package as Phoenix, just different constructor parameters (`spaceId` instead of `endpoint`).

## Differences from `no-observability/mastra`

Only observability-related files differ:

| File | Change |
|------|--------|
| `src/mastra/index.ts` | `ArizeExporter` added to Mastra telemetry config |
| `next.config.ts` | `serverExternalPackages` for observability packages |
| `package.json` | `@mastra/arize`, `@mastra/observability` added |
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
