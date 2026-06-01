# Wonder Toys — Arconia (Java, No Observability)

This is the Arconia variant of the Wonder Toys shopping agent with no observability
instrumentation. [Arconia](https://github.com/arconia-io/arconia) is a Spring Boot add-on
that streamlines configuration and adds auto-instrumentation for AI workloads. In this tier
we use it as a thin layer over Spring AI without enabling any exporter, so it serves as the
no-observability baseline for comparison against the Phoenix / AX tiers.

## Architecture

- **Spring Boot 3.5 backend** (Java 21, port 18005) — agent, tools, and API
- **Arconia BOM 0.27.0** — version-aligns Arconia modules; the BOM is here for parity with the
  observability tiers, but no exporter is wired up
- **Next.js frontend** — UI, auth, proxies chat to the Java backend
- **Agent**: Spring AI `ChatClient` built fluently per request via `chatClientBuilder.prompt()`
- **LLM**: `spring-ai-starter-model-anthropic` (`AnthropicChatModel` auto-configured by Boot)
- **Tools**: Methods on a Spring component annotated with Spring AI `@Tool` + `@ToolParam`
- **Streaming**: `chatClient.prompt().stream().chatResponse()` returns `Flux<ChatResponse>`; we
  subscribe and bridge text chunks to a `data: {"text":"…"}` SSE wire format identical to the
  other Java tiers
- **Vector search**: ChromaDB via the JDK `HttpClient` (the Python tier's indexer populates the
  collection at dev startup)

## Why port 18005?

The other Java tiers use 8001 (LangChain4j), 18002 (Spring AI), and 18004 (Annotation), so
Arconia uses 18005 to coexist on the same host. Override with `SERVER_PORT=…` if needed.

## Running

```bash
cp env.example .env.local   # fill in your API keys
npm install
npm run dev                 # starts ChromaDB + indexes products + builds + runs the Java backend + Next.js
```

The dev script reuses the sibling Python tier's `index_products.py` to populate ChromaDB — there's
no native Java indexer because the heavy lifting (default embeddings) already lives in ChromaDB
itself once indexed.

See the [root README](../../README.md) for full details.

## Comparing to the Spring AI tier

The Spring AI tier (`spring-ai-java/`) and this tier share the same `ChatClient` agent shape —
Arconia is a no-op for agent code in the no-observability baseline. The interesting difference
shows up in the Phoenix / AX tiers, where Arconia replaces the manual OTel SDK wiring of
`Tracing.java` with a single `arconia.otel.*` properties block.

## Key Files

| File | Purpose |
|------|---------|
| `backend/build.gradle.kts` | Gradle build (Spring Boot 3.5, Spring AI 1.0.7 + Arconia BOM, Java 21) |
| `backend/src/main/java/com/wondertoys/App.java` | Spring Boot main — no manual model bean; auto-configured `ChatClient.Builder` |
| `backend/src/main/java/com/wondertoys/ShoppingAgent.java` | Per-request `ChatClient.prompt()` builder + system prompt |
| `backend/src/main/java/com/wondertoys/ChatController.java` | `/chat` SSE endpoint, bridges `Flux<ChatResponse>` → SSE |
| `backend/src/main/java/com/wondertoys/ProductsController.java` | `/products/featured` + `/products/{id}` |
| `backend/src/main/java/com/wondertoys/tools/WonderToysTools.java` | The five Spring AI `@Tool` methods |
| `backend/src/main/java/com/wondertoys/inventory/` | `Product`, `ProductRepository`, `Order`, `OrderStore` |
| `backend/src/main/java/com/wondertoys/chroma/ChromaClient.java` | HTTP client for the local ChromaDB server |
| `backend/src/main/resources/products.json` | Symlink to the canonical 200-product dataset in `langchain-py` |
| `src/app/api/chat/route.ts` | Next.js proxy to the Java backend |
| `src/components/Chat.tsx` | Chat UI with product card rendering |
| `scripts/start.sh` | Dev startup (ChromaDB + index + `gradlew bootJar` + run + Next.js) |
