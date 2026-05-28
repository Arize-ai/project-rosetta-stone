# Wonder Toys — Arconia (Java, Arize AX)

This is the Arconia variant of the Wonder Toys shopping agent instrumented for Arize AX.

[Arconia](https://github.com/arconia-io/arconia) is a Spring Boot add-on. Its
`arconia-opentelemetry-spring-boot-starter` auto-configures an OTel SDK + OTLP exporter from
`arconia.otel.*` properties, and `arconia-openinference-ai-semantic-conventions` turns Spring AI's
built-in micrometer observations into OpenInference-conventioned spans. The net effect is that
there is **no `Tracing.java` Java code in this tier** — everything the Spring AI tier does
manually inside `Tracing.java` is replaced by a single `arconia.otel.*` block in
`application.yml`.

## Architecture

- **Spring Boot 4.0 backend** (Java 21, port 18005) — agent, tools, and API
- **Arconia 0.27.0** — `arconia-opentelemetry-spring-boot-starter` (auto-config) +
  `arconia-openinference-ai-semantic-conventions` (Spring AI → OpenInference span mapping)
- **Next.js frontend** — UI, auth, proxies chat to the Java backend
- **Agent**: Spring AI `ChatClient` built fluently per request via `chatClientBuilder.prompt()`
- **LLM**: `spring-ai-starter-model-anthropic` (`AnthropicChatModel` auto-configured by Boot)
- **Tools**: Methods on a Spring component annotated with Spring AI `@Tool` + `@ToolParam`
- **Streaming**: `chatClient.prompt().stream().chatResponse()` returns `Flux<ChatResponse>`; we
  subscribe and bridge text chunks to a `data: {"text":"…"}` SSE wire format identical to the
  other Java tiers
- **Tracing**: Arconia OTel auto-config emits OpenInference-conventioned spans over **gRPC** to
  `otlp.arize.com:443` with `space_id` + `api_key` headers
- **Vector search**: ChromaDB via the JDK `HttpClient`

## Why port 18005?

The other Java tiers use 8001 (LangChain4j), 18002 (Spring AI), and 18004 (Annotation), so
Arconia uses 18005 to coexist on the same host. Override with `SERVER_PORT=…` if needed.

## Running

```bash
cp env.example .env.local   # fill in your API keys + ARIZE_SPACE_ID + ARIZE_API_KEY
npm install
npm run dev                 # starts ChromaDB + indexes products + builds + runs the Java backend + Next.js
```

See the [root README](../../README.md) for full details.

## What differs from `phoenix/arconia-java/`

- `backend/src/main/resources/application.yml` — `arconia.otel.exporter.otlp.protocol: grpc` (vs
  HTTP for Phoenix); endpoint is `otlp.arize.com:443`; headers are `space_id` + `api_key` (vs
  `authorization: Bearer …`)
- `backend/build.gradle.kts` — adds `opentelemetry-exporter-sender-okhttp` (the gRPC sender)
- `env.example` — `ARIZE_SPACE_ID` / `ARIZE_API_KEY` / `ARIZE_PROJECT_NAME` (vs `PHOENIX_*`)

Everything else — the agent, the tools, the controller — is identical to the Phoenix tier.

## What differs from `ax/spring-ai-java/`

The Spring AI tier handles tracing in **~120 lines of Java** inside `Tracing.java` — building
the `OpenTelemetrySdk`, `OtlpGrpcSpanExporter`, `BatchSpanProcessor`, `OITracer`, registering a
`SpringAIInstrumentor` as an `ObservationHandler`, and exposing an `ObservationRegistry` bean
for Spring AI's auto-config to pick up.

In this tier, **all of that is replaced by `application.yml` properties**. The Java side has no
tracing code at all — Arconia takes care of it from the BOM-imported starters.

## Key Files

| File | Purpose |
|------|---------|
| `backend/build.gradle.kts` | Gradle build (Spring Boot 4.0, Spring AI 2.0.0-M8, Arconia 0.27.0, Java 21) |
| `backend/src/main/java/com/wondertoys/App.java` | Spring Boot main — no manual model bean, no Tracing.java |
| `backend/src/main/java/com/wondertoys/ShoppingAgent.java` | Per-request `ChatClient.prompt()` builder + system prompt |
| `backend/src/main/java/com/wondertoys/ChatController.java` | `/chat` SSE endpoint, bridges `Flux<ChatResponse>` → SSE |
| `backend/src/main/java/com/wondertoys/ProductsController.java` | `/products/featured` + `/products/{id}` |
| `backend/src/main/java/com/wondertoys/tools/WonderToysTools.java` | The five Spring AI `@Tool` methods |
| `backend/src/main/resources/application.yml` | App config + `arconia.otel.*` gRPC exporter block |
| `backend/src/main/resources/products.json` | Symlink to the canonical 200-product dataset in `langchain-py` |
