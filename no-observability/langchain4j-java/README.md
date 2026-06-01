# Wonder Toys — LangChain4j Java (No Observability)

This is the LangChain4j (Java) variant of the Wonder Toys shopping agent with no observability instrumentation.

## Architecture

- **Spring Boot 3.5 backend** (Java 21, port 8001) — agent, tools, and API
- **Next.js frontend** — UI, auth, proxies chat to the Java backend
- **Agent**: LangChain4j 1.0 `AiServices` with `TokenStream` streaming
- **LLM**: `langchain4j-anthropic` (`AnthropicStreamingChatModel`)
- **Tools**: Methods on a Spring component annotated with `@Tool` + `@P`
- **Streaming**: `TokenStream.onPartialResponse` / `onToolExecuted` bridged to Spring `SseEmitter`
- **Vector search**: ChromaDB via the JDK `HttpClient` (the Python tier's indexer populates the collection at dev startup)

## Running

```bash
cp env.example .env.local   # fill in your API keys
npm install
npm run dev                 # starts ChromaDB + indexes products + builds + runs the Java backend + Next.js
```

The dev script reuses the sibling Python tier's `index_products.py` to populate ChromaDB — there's no native Java indexer because the heavy lifting (default embeddings) already lives in ChromaDB itself once indexed.

See the [root README](../../README.md) for full details.

## Key Files

| File | Purpose |
|------|---------|
| `backend/build.gradle.kts` | Gradle build (Spring Boot 3.5, LangChain4j 1.0, Java 21) |
| `backend/src/main/java/com/wondertoys/App.java` | Spring Boot main + `StreamingChatModel` bean |
| `backend/src/main/java/com/wondertoys/Assistant.java` | LangChain4j AI service interface |
| `backend/src/main/java/com/wondertoys/ShoppingAgent.java` | Per-request `Assistant` factory + system prompt |
| `backend/src/main/java/com/wondertoys/ChatController.java` | `/chat` SSE endpoint, bridges `TokenStream` → SSE |
| `backend/src/main/java/com/wondertoys/ProductsController.java` | `/products/featured` + `/products/{id}` |
| `backend/src/main/java/com/wondertoys/tools/WonderToysTools.java` | The five `@Tool` methods |
| `backend/src/main/java/com/wondertoys/inventory/` | `Product`, `ProductRepository`, `Order`, `OrderStore` |
| `backend/src/main/java/com/wondertoys/chroma/ChromaClient.java` | HTTP client for the local ChromaDB server |
| `backend/src/main/resources/products.json` | Symlink to the canonical 200-product dataset in `langchain-py` |
| `src/app/api/chat/route.ts` | Next.js proxy to the Java backend |
| `src/components/Chat.tsx` | Chat UI with product card rendering |
| `scripts/start.sh` | Dev startup (ChromaDB + index + `gradlew bootJar` + run + Next.js) |
