# Wonder Toys — Vercel AI SDK (Arize AX Instrumented)

This is the Vercel AI SDK (TypeScript) variant of the Wonder Toys shopping
agent, instrumented with Arize AX for observability.

## Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FArize-ai%2Fproject-rosetta-stone%2Ftree%2Fmain%2Fax%2Fvercel-ai-sdk&env=ANTHROPIC_API_KEY%2CARIZE_SPACE_ID%2CARIZE_API_KEY%2CARIZE_PROJECT_NAME&envDefaults=%7B%22ARIZE_PROJECT_NAME%22%3A%22wonder-toys-vercel%22%7D&envDescription=Add%20your%20Anthropic%20API%20key%20and%20Arize%20AX%20space%20credentials.)

The deployment form requests the four required variables:

| Variable | Purpose |
|---|---|
| `ANTHROPIC_API_KEY` | Calls Claude through the Vercel AI SDK |
| `ARIZE_SPACE_ID` | Selects the destination AX space |
| `ARIZE_API_KEY` | Authenticates OTLP trace export to AX |
| `ARIZE_PROJECT_NAME` | Names the AX project (`wonder-toys-vercel` by default) |

To import the repository manually, use these Vercel project settings:

1. Set **Root Directory** to `ax/vercel-ai-sdk`.
2. Enable **Include source files outside of the Root Directory in the Build Step**.
   The app's `public/product-images` symlink points to the shared
   `product-images` directory at the repository root. A fallback rewrite serves
   the canonical repository images when a deployment method does not package
   the external symlink.
3. Use Node.js `22.x`. The version is also pinned in `package.json`.
4. Add the four required variables above to Preview and Production.
5. Keep the detected Next.js build settings; no custom build or output command
   is required.

After deployment, verify that the home page and a product image such as
`/product-images/toy-001.png` load, then complete a chat turn and confirm its
trace appears in the configured AX project.

## Stateless deployment

`CHROMA_URL` is optional. Without it, product search immediately uses the
in-repo keyword and filter fallback; Vercel does not need a Chroma service or an
indexing job. Set `CHROMA_URL` only when connecting to an already-indexed Chroma
deployment.

Orders and inventory mutations are intentionally held in process memory. On
Vercel they can reset between invocations and are not shared reliably across
instances. Purchasing, status, and cancellation flows are demonstration
features, not durable commerce storage.

Optional evaluation variables are `EVAL_SECRET` and `EVAL_BASE_URL`.

## Observability setup

Next.js loads `src/instrumentation.ts` through its instrumentation hook. The
hook:

1. Enables AI SDK v7 telemetry with `registerTelemetry` and `@ai-sdk/otel`.
2. Registers OpenTelemetry with `@vercel/otel`.
3. Exports spans to `https://otlp.arize.com/v1/traces` using the
   `arize-space-id` and `arize-api-key` headers.
4. Filters for OpenInference spans with `isOpenInferenceSpan`.
5. Uses `OpenInferenceSimpleSpanProcessor` with
   `reparentOrphanedSpans: true`, which promotes AI spans whose filtered
   Next.js HTTP parent would otherwise leave them orphaned.

If any AX variable is absent, instrumentation logs one actionable error and
does not register an exporter with empty credentials. The chat endpoint also
returns HTTP `503` with the names of missing required variables before calling
Anthropic; secret values are never returned.

### Session tracking

Each browser conversation has a UUID stored in `sessionStorage`. The client
sends it in the `x-session-id` header, and the chat route adds it to the active
OpenTelemetry context with `setSession`. Context attributes propagate to the AI
spans so all turns in a conversation appear under one AX session.

## Run locally

Node.js 22 is required.

```bash
cp env.example .env.local
npm install
npm run dev
```

`npm run dev` starts and indexes a local Chroma instance before Next.js. To run
the stateless configuration used by the Vercel deployment:

```bash
npm run dev:next
```

See the [root README](../../README.md) for full project details.
