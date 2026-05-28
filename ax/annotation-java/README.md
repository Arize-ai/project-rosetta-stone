# Wonder Toys — OpenInference Annotation Tracing → Arize AX

This is the framework-agnostic Java variant of the Wonder Toys shopping agent, instrumented with [OpenInference annotation tracing](https://arize.com/docs/ax/integrations/java/annotation/annotation-tracing) and exporting to [Arize AX](https://app.arize.com).

Unlike every other tier in this repo, there's no agent framework here — it's a hand-rolled agent loop on top of the official Anthropic Java SDK. Observability comes from `@Agent` / `@Chain` / `@LLM` / `@Tool` annotations applied to that hand-rolled code, with `OpenInferenceAgentInstaller.install()` doing the runtime ByteBuddy attachment.

## Architecture

- **Spring Boot 3.5 backend** (Java 21, port 18004) — agent, tools, and API
- **Next.js frontend** (port 3000) — UI, auth, proxies chat to the Java backend
- **Agent**: hand-rolled streaming loop (see `ShoppingAgent.java`)
- **LLM**: `com.anthropic:anthropic-java` (official SDK) with `messages().createStreaming(...)`
- **Tools**: plain Java methods on a Spring component, annotated with `@Tool`
- **Observability**: `com.arize:openinference-instrumentation-annotation` + `io.opentelemetry:opentelemetry-sdk` → OTLP gRPC → Arize AX
- **Vector search**: ChromaDB via the JDK `HttpClient`

## What differs from `phoenix/annotation-java/`

Only the OTLP transport and credentials change:

- `backend/src/main/java/com/wondertoys/Tracing.java` — uses `OtlpGrpcSpanExporter` against `otlp.arize.com:443`, with `space_id` + `api_key` headers (AX expects these, not `authorization: Bearer …` like Phoenix)
- `application.yml` swaps the `wondertoys.phoenix.*` block for a `wondertoys.arize.*` block (endpoint / space-id / api-key / project-name)
- `env.example` swaps `PHOENIX_*` for `ARIZE_SPACE_ID` / `ARIZE_API_KEY` / `ARIZE_PROJECT_NAME`

The agent loop, the tools, the `@Agent`/`@LLM`/`@Chain`/`@Tool` annotations, and the ByteBuddy `install()` call are all identical to the phoenix tier.

## Critical: install() must happen before annotated classes load

The ByteBuddy agent rewrites classes when they're loaded by the JVM — if Spring's classpath scan resolves `ShoppingAgent` or `WonderToysTools` before the agent is installed, those classes get loaded in their un-instrumented form and the annotations are inert. So `OpenInferenceAgentInstaller.install()` is the first statement in `App.main(...)`, before `SpringApplication.run(...)`.

## Span shape

A typical 3-turn shopping conversation produces this span tree (one trace per turn):

```
wonder-toys-agent                    [AGENT]   input=history+message, output=final text
├── claude-messages                  [LLM]     input=messages, output=tool_use blocks
├── tool-dispatch                    [CHAIN]   input={name,input,userId}, output=tool result JSON
│   └── search-products              [TOOL]    input=query, output={results, totalFound}
└── claude-messages                  [LLM]     input=messages+tool_result, output=final text
```

## Running

```bash
cp env.example .env.local   # fill in your API keys + Arize space id / api key
npm install
npm run dev                 # starts ChromaDB + indexes products + builds + runs the Java backend + Next.js
```

See the [root README](../../README.md) for full details.

## Key Files

| File | Purpose |
|------|---------|
| `backend/build.gradle.kts` | Gradle build (Spring Boot 3.5, Anthropic Java SDK 2.35, OI annotation 0.1.2, OTel 1.50, Java 21) |
| `backend/src/main/java/com/wondertoys/App.java` | Spring Boot main + ByteBuddy install + `AnthropicClient` bean |
| `backend/src/main/java/com/wondertoys/Tracing.java` | OTel SDK + OTLP gRPC exporter → AX + `OpenInferenceAgent.register(...)` |
| `backend/src/main/java/com/wondertoys/ShoppingAgent.java` | `@Agent` / `@LLM` / `@Chain`-annotated agent loop + system prompt |
| `backend/src/main/java/com/wondertoys/ChatController.java` | `/chat` SSE endpoint |
| `backend/src/main/java/com/wondertoys/ProductsController.java` | `/products/featured` + `/products/{id}` |
| `backend/src/main/java/com/wondertoys/tools/WonderToysTools.java` | Five `@Tool`-annotated methods + JSON schemas + dispatch |
| `backend/src/main/java/com/wondertoys/inventory/` | `Product`, `ProductRepository`, `Order`, `OrderStore` |
| `backend/src/main/java/com/wondertoys/chroma/ChromaClient.java` | HTTP client for the local ChromaDB server |
| `backend/src/main/resources/products.json` | Symlink to the canonical 200-product dataset in `langchain-py` |
| `src/app/api/chat/route.ts` | Next.js proxy to the Java backend |
| `src/components/Chat.tsx` | Chat UI with product card rendering |
| `scripts/start.sh` | Dev startup (ChromaDB + index + `gradlew bootJar` + run + Next.js) |
