# Wonder Toys — Spring AI Java (Arize AX)

This is the Spring AI (Java) variant of the Wonder Toys shopping agent instrumented for Arize AX.

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
  Spring AI's auto-config wires the registry onto `AnthropicChatModel` automatically. OTel
  exporter is gRPC to `otlp.arize.com:443` with `space_id` + `api_key` headers.
- **Vector search**: ChromaDB via the JDK `HttpClient`

## Why port 18002?

The LangChain4j Java tier uses 8001. Spring AI uses 18002 so both can run on the same host
without colliding. Override with `SERVER_PORT=…` if you need to.

## Running

```bash
cp env.example .env.local   # fill in your API keys + ARIZE_SPACE_ID + ARIZE_API_KEY
npm install
npm run dev                 # starts ChromaDB + indexes products + builds + runs the Java backend + Next.js
```

See the [root README](../../README.md) for full details.

## What differs from `phoenix/spring-ai-java/`

- `backend/src/main/java/com/wondertoys/Tracing.java` — OTLP **gRPC** exporter (vs Phoenix's HTTP),
  `space_id` + `api_key` headers (vs `authorization: Bearer …`)
- `backend/src/main/resources/application.yml` — `wondertoys.arize.*` keys (vs `wondertoys.phoenix.*`)
- `env.example` — `ARIZE_SPACE_ID` / `ARIZE_API_KEY` / `ARIZE_PROJECT_NAME` (vs `PHOENIX_*`)

Everything else — the build, the agent, the tools, the controller — is identical to the Phoenix tier.

## Key Files

| File | Purpose |
|------|---------|
| `backend/build.gradle.kts` | Gradle build (Spring Boot 3.5, Spring AI 1.0.7, OTel 1.50.0, Java 21) |
| `backend/src/main/java/com/wondertoys/App.java` | Spring Boot main — no manual model bean; auto-configured `ChatClient.Builder` |
| `backend/src/main/java/com/wondertoys/Tracing.java` | **AX tier**: OTel SDK + gRPC exporter to `otlp.arize.com:443` + `ObservationRegistry` bean |
| `backend/src/main/java/com/wondertoys/ShoppingAgent.java` | Per-request `ChatClient.prompt()` builder + system prompt |
| `backend/src/main/java/com/wondertoys/ChatController.java` | `/chat` SSE endpoint, bridges `Flux<ChatResponse>` → SSE |
| `backend/src/main/java/com/wondertoys/ProductsController.java` | `/products/featured` + `/products/{id}` |
| `backend/src/main/java/com/wondertoys/tools/WonderToysTools.java` | The five Spring AI `@Tool` methods |
| `backend/src/main/resources/products.json` | Symlink to the canonical 200-product dataset in `langchain-py` |
