# Wonder Toys — OpenInference Annotation Tracing (No Observability)

This is the framework-agnostic Java variant of the Wonder Toys shopping agent with **no observability instrumentation**. Unlike every other tier in this repo, there's no agent framework here — it's a hand-rolled agent loop on top of the official Anthropic Java SDK.

It's the baseline for the `phoenix/annotation-java/` and `ax/annotation-java/` tiers, which add `@Agent` / `@Chain` / `@LLM` / `@Tool` annotations from `com.arize:openinference-instrumentation-annotation` and wire them up at startup via a ByteBuddy Java agent.

## Architecture

- **Spring Boot 3.5 backend** (Java 21, port 18004) — agent, tools, and API
- **Next.js frontend** (port 3000) — UI, auth, proxies chat to the Java backend
- **Agent**: hand-rolled streaming loop (see `ShoppingAgent.java`)
- **LLM**: `com.anthropic:anthropic-java` (official SDK) with `messages().createStreaming(...)`
- **Tools**: plain Java methods on a Spring component with manually-authored JSON schemas in `toolSpecs()`
- **Streaming**: SDK `StreamResponse<RawMessageStreamEvent>` → SSE writer
- **Vector search**: ChromaDB via the JDK `HttpClient` (the Python tier's indexer populates the collection at dev startup)

## The agent loop

The loop owns the model-side ReAct pattern explicitly — no framework abstraction:

1. Build a `MessageCreateParams` with system prompt + history + tools
2. Call `messages().createStreaming(...)` and consume `RawMessageStreamEvent` events
3. Push `TextDelta` chunks to the SSE consumer; accumulate `InputJsonDelta` chunks into per-block buffers keyed by block index
4. After the stream closes, parse each buffered tool-use into a `Map<String, Object>` and dispatch it via `WonderToysTools.dispatch(name, input, userId)`
5. Append an `assistant` message containing the tool-use blocks + a `user` message containing the tool results, then loop
6. When the model finishes with no tool uses, return

The annotation tiers wrap each step in a span via runtime ByteBuddy instrumentation — see the phoenix/ax tier READMEs for the wiring.

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
| `backend/build.gradle.kts` | Gradle build (Spring Boot 3.5, Anthropic Java SDK 2.35, Java 21) |
| `backend/src/main/java/com/wondertoys/App.java` | Spring Boot main + `AnthropicClient` bean |
| `backend/src/main/java/com/wondertoys/ShoppingAgent.java` | Hand-rolled streaming agent loop + system prompt |
| `backend/src/main/java/com/wondertoys/ChatController.java` | `/chat` SSE endpoint — pushes deltas to the writer |
| `backend/src/main/java/com/wondertoys/ProductsController.java` | `/products/featured` + `/products/{id}` |
| `backend/src/main/java/com/wondertoys/tools/WonderToysTools.java` | The five tool methods + `toolSpecs()` JSON schemas + `dispatch(...)` |
| `backend/src/main/java/com/wondertoys/inventory/` | `Product`, `ProductRepository`, `Order`, `OrderStore` |
| `backend/src/main/java/com/wondertoys/chroma/ChromaClient.java` | HTTP client for the local ChromaDB server |
| `backend/src/main/resources/products.json` | Symlink to the canonical 200-product dataset in `langchain-py` |
| `src/app/api/chat/route.ts` | Next.js proxy to the Java backend |
| `src/components/Chat.tsx` | Chat UI with product card rendering |
| `scripts/start.sh` | Dev startup (ChromaDB + index + `gradlew bootJar` + run + Next.js) |
