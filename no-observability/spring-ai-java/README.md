# Wonder Toys — Spring AI Java (No Observability)

This is the Spring AI (Java) variant of the Wonder Toys shopping agent with no observability instrumentation.

## Architecture

- **Spring Boot 3.5 backend** (Java 21, port 18002) — agent, tools, and API
- **Next.js frontend** — UI, auth, proxies chat to the Java backend
- **Agent**: Spring AI `ChatClient` built fluently per request via `chatClientBuilder.prompt()`
- **LLM**: `spring-ai-starter-model-anthropic` (`AnthropicChatModel` auto-configured by Boot)
- **Tools**: Methods on a Spring component annotated with Spring AI `@Tool` + `@ToolParam`
- **Streaming**: `chatClient.prompt().stream().chatResponse()` returns `Flux<ChatResponse>`; we
  subscribe and bridge text chunks to a `data: {"text":"…"}` SSE wire format identical to the
  Python and LangChain4j tiers
- **Vector search**: ChromaDB via the JDK `HttpClient` (the Python tier's indexer populates the
  collection at dev startup)

## Why port 18002?

The LangChain4j Java tier uses 8001. Spring AI uses 18002 so both can run on the same host
without colliding. Override with `SERVER_PORT=…` if you need to.

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

## Key Files

| File | Purpose |
|------|---------|
| `backend/build.gradle.kts` | Gradle build (Spring Boot 3.5, Spring AI 1.0.7 BOM, Java 21) |
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
