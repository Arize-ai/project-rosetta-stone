# Wonder Toys — OpenInference Annotation Tracing → Arize Phoenix

This is the framework-agnostic Java variant of the Wonder Toys shopping agent, instrumented with [OpenInference annotation tracing](https://arize.com/docs/ax/integrations/java/annotation/annotation-tracing) and exporting to [Arize Phoenix](https://phoenix.arize.com).

Unlike every other tier in this repo, there's no agent framework here — it's a hand-rolled agent loop on top of the official Anthropic Java SDK. Observability comes from `@Agent` / `@Chain` / `@LLM` / `@Tool` annotations applied to that hand-rolled code, with `OpenInferenceAgentInstaller.install()` doing the runtime ByteBuddy attachment.

## Architecture

- **Spring Boot 3.5 backend** (Java 21, port 18004) — agent, tools, and API
- **Next.js frontend** (port 3000) — UI, auth, proxies chat to the Java backend
- **Agent**: hand-rolled streaming loop (see `ShoppingAgent.java`)
- **LLM**: `com.anthropic:anthropic-java` (official SDK) with `messages().createStreaming(...)`
- **Tools**: plain Java methods on a Spring component, annotated with `@Tool`
- **Observability**: `com.arize:openinference-instrumentation-annotation` + `io.opentelemetry:opentelemetry-sdk` → OTLP/HTTP → Phoenix
- **Vector search**: ChromaDB via the JDK `HttpClient`

## What differs from `no-observability/annotation-java/`

Three additions plus annotations on existing methods:

1. `backend/build.gradle.kts` — adds `com.arize:openinference-instrumentation-annotation:0.1.2`, `io.opentelemetry:opentelemetry-sdk:1.50.0`, and the OTLP HTTP exporter
2. `backend/src/main/java/com/wondertoys/App.java` — calls `OpenInferenceAgentInstaller.install()` **before** `SpringApplication.run(...)` so the ByteBuddy agent attaches before Spring loads any annotated class
3. `backend/src/main/java/com/wondertoys/Tracing.java` — **new file**, builds the OTel SDK + OTLP/HTTP exporter to Phoenix, wraps the resulting tracer in an `OITracer`, and registers it via `OpenInferenceAgent.register(...)`
4. `ShoppingAgent.chat(...)` gets `@Agent(name = "wonder-toys-agent")` — root span per request
5. `ShoppingAgent.callClaude(...)` gets `@LLM(name = "claude-messages")` — one LLM span per Anthropic round-trip
6. `ShoppingAgent.invokeTool(...)` gets `@Chain(name = "tool-dispatch")` — wraps each tool invocation
7. Every public method on `WonderToysTools` gets `@Tool(name = "...", description = "...")` — TOOL span per tool call, with the description carried into the span attributes
8. `application.yml` adds the `wondertoys.phoenix.*` block (endpoint / api-key / project-name)
9. `env.example` adds `PHOENIX_COLLECTOR_ENDPOINT` / `PHOENIX_API_KEY` / `PHOENIX_PROJECT_NAME`

That's it. No source-level changes to the agent loop, the tools, the Spring controllers, or anything else.

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
cp env.example .env.local   # fill in your API keys + Phoenix endpoint
npm install
npm run dev                 # starts ChromaDB + indexes products + builds + runs the Java backend + Next.js
```

For local Phoenix, run `docker run -p 6006:6006 arizephoenix/phoenix:latest` and leave `PHOENIX_COLLECTOR_ENDPOINT=http://localhost:6006/v1/traces` (no API key needed).

See the [root README](../../README.md) for full details.

## Key Files

| File | Purpose |
|------|---------|
| `backend/build.gradle.kts` | Gradle build (Spring Boot 3.5, Anthropic Java SDK 2.35, OI annotation 0.1.2, OTel 1.50, Java 21) |
| `backend/src/main/java/com/wondertoys/App.java` | Spring Boot main + ByteBuddy install + `AnthropicClient` bean |
| `backend/src/main/java/com/wondertoys/Tracing.java` | OTel SDK + OTLP/HTTP exporter + `OpenInferenceAgent.register(...)` |
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
