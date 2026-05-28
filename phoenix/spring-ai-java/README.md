# Wonder Toys — Spring AI Java (Phoenix)

This is the Spring AI (Java) variant of the Wonder Toys shopping agent instrumented for Arize Phoenix.

## Architecture

- **Spring Boot 3.5 backend** (Java 21, port 18002) — agent, tools, and API
- **Next.js frontend** — UI, auth, proxies chat to the Java backend
- **Agent**: Spring AI `ChatClient` built fluently per request via `chatClientBuilder.prompt()`
- **LLM**: `spring-ai-starter-model-anthropic` (`AnthropicChatModel` auto-configured by Boot)
- **Tools**: Methods on a Spring component annotated with Spring AI `@Tool` + `@ToolParam`
- **Streaming**: `chatClient.prompt().stream().chatResponse()` returns `Flux<ChatResponse>`; we
  subscribe and bridge text chunks to a `data: {"text":"…"}` SSE wire format identical to the
  Python and LangChain4j tiers
- **Tracing**: OpenInference `SpringAIInstrumentor` plugged in as a micrometer `ObservationHandler`;
  Spring AI's auto-config wires the registry onto `AnthropicChatModel` automatically
- **Vector search**: ChromaDB via the JDK `HttpClient`

## Why port 18002?

The LangChain4j Java tier uses 8001. Spring AI uses 18002 so both can run on the same host
without colliding. Override with `SERVER_PORT=…` if you need to.

## Running

```bash
cp env.example .env.local   # fill in your API keys + PHOENIX_API_KEY
npm install
npm run dev                 # starts ChromaDB + indexes products + builds + runs the Java backend + Next.js
```

See the [root README](../../README.md) for full details.

## What differs from `no-observability/spring-ai-java/`

- `backend/build.gradle.kts` — adds `openinference-instrumentation-springAI` + OTel SDK + OTLP HTTP exporter
- `backend/src/main/java/com/wondertoys/Tracing.java` — **new file**: OTel SDK setup + `ObservationRegistry` bean
- `backend/src/main/resources/application.yml` — adds `wondertoys.phoenix.*` keys
- `env.example` — adds `PHOENIX_COLLECTOR_ENDPOINT` / `PHOENIX_API_KEY` / `PHOENIX_PROJECT_NAME`

The `ObservationRegistry` bean is the load-bearing piece: Spring AI's auto-config picks it up via
`ObjectProvider<ObservationRegistry>` and wires it into `AnthropicChatModel`. The
`SpringAIInstrumentor` we register on that registry turns micrometer observation events into
OpenInference spans, which the OTLP HTTP exporter ships to Phoenix.

## Key Files

| File | Purpose |
|------|---------|
| `backend/build.gradle.kts` | Gradle build (Spring Boot 3.5, Spring AI 1.0.7, OTel 1.50.0, Java 21) |
| `backend/src/main/java/com/wondertoys/App.java` | Spring Boot main — no manual model bean; auto-configured `ChatClient.Builder` |
| `backend/src/main/java/com/wondertoys/Tracing.java` | **Phoenix tier only**: OTel SDK + `ObservationRegistry` bean |
| `backend/src/main/java/com/wondertoys/ShoppingAgent.java` | Per-request `ChatClient.prompt()` builder + system prompt |
| `backend/src/main/java/com/wondertoys/ChatController.java` | `/chat` SSE endpoint, bridges `Flux<ChatResponse>` → SSE |
| `backend/src/main/java/com/wondertoys/ProductsController.java` | `/products/featured` + `/products/{id}` |
| `backend/src/main/java/com/wondertoys/tools/WonderToysTools.java` | The five Spring AI `@Tool` methods |
| `backend/src/main/resources/products.json` | Symlink to the canonical 200-product dataset in `langchain-py` |
