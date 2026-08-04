import {
  createSdkMcpServer,
  type Options,
  type SDKMessage,
} from "@anthropic-ai/claude-agent-sdk";
import {
  trace,
  context,
  SpanStatusCode,
  type Span,
} from "@opentelemetry/api";
import {
  SemanticConventions,
  OpenInferenceSpanKind,
} from "@arizeai/openinference-semantic-conventions";
import { searchProducts } from "./tools/search-products";
import { getProduct } from "./tools/get-product";
import { purchaseProduct } from "./tools/purchase";
import { checkOrderStatus } from "./tools/order-status";
import { cancelOrderTool } from "./tools/cancel-order";
import { enterUserId } from "./context";
import {
  initTracing,
  getInstrumentedQuery,
  getTracer,
  getTracerProvider,
} from "./tracing";

export const MODEL = "claude-sonnet-4-6";

// The Wonder Toys tools are served in-process via `createSdkMcpServer` — the
// TypeScript equivalent of the Python tier's `create_sdk_mcp_server`. Each tool
// runs in this Next.js process, so the ambient user id set on the request
// context (see ./context) is visible to the tool handlers without the model
// having to pass it. Tool names as seen by the model are namespaced
// `mcp__wonder_toys__<name>`.
const MCP_SERVER_NAME = "wonder_toys";

const wonderToysServer = createSdkMcpServer({
  name: MCP_SERVER_NAME,
  version: "1.0.0",
  tools: [
    searchProducts,
    getProduct,
    purchaseProduct,
    checkOrderStatus,
    cancelOrderTool,
  ],
});

const allowedTools = [
  `mcp__${MCP_SERVER_NAME}__search_products`,
  `mcp__${MCP_SERVER_NAME}__get_product_detail`,
  `mcp__${MCP_SERVER_NAME}__purchase_product`,
  `mcp__${MCP_SERVER_NAME}__check_order_status`,
  `mcp__${MCP_SERVER_NAME}__cancel_order`,
];

export const SYSTEM_PROMPT = `You are a friendly and helpful shopping assistant for "Wonder Toys", a children's toy store. Your job is to help customers find the perfect toys, answer questions about products, and help them complete purchases.

## Your Capabilities
- Search for products by description, keywords, age range, or category
- Get detailed information about specific products
- Help customers purchase products (their credit card is already on file)
- Check order status for previous purchases
- Cancel orders that haven't been delivered yet

## Formatting Product Information

When displaying products, always use rich markdown formatting with images. This is critical for a good shopping experience.

**IMPORTANT: Image URLs must come EXACTLY from the \`image\` field returned by the tool (e.g. \`/product-images/toy-001.png\`). These are local paths starting with \`/\`. NEVER invent, guess, or use external URLs for images. Use the exact path from the tool result.**

### Search Results (multiple products)
For each product in search results, format as:

![Product Name](/product-images/toy-XXX.png)
**Product Name** — $price
⭐ rating (count ratings) · Ages age_range · by Manufacturer
Description text

### Product Details (single product, detailed view)
When showing a single product's details, format as:

![Product Name](/product-images/toy-XXX.png)
## Product Name
**$price** · ⭐ rating (count ratings) · Best Seller Rank #rank

**Ages:** age_range · **Category:** category · **By:** manufacturer
**Dimensions:** L×W×H inches, weight lbs
**In Stock:** inventory available

Description or marketing copy

## Guidelines
1. **Product Search**: When customers describe what they're looking for, use the search tool with relevant queries, keywords, and age filters. Be proactive about suggesting age-appropriate options.

2. **Product Details**: When a customer shows interest in a product, use the get-product tool and show the full detailed view with the product image, marketing copy, dimensions, rating, manufacturer, and best seller rank.

3. **Purchasing**: Before completing a purchase:
   - Confirm the product(s) and quantities
   - Ask for shipping details (recipient name, street address, city, state/province, ZIP/postal code, country)
   - The customer's credit card is already saved in our system, so just confirm they'd like to proceed
   - After purchase, share the order ID and total

4. **Order Status**: Help customers check on their orders. They can provide an order ID, or describe what they ordered (e.g., "where's my dinosaur set?") and you'll search for matching orders.

5. **Order Cancellation**: Customers can cancel orders that are still processing or shipping. Use the cancel-order tool with the order ID. Delivered orders cannot be cancelled. Always confirm with the customer before cancelling.

6. **Tone**: Be warm, enthusiastic about toys, and helpful. Use a conversational tone appropriate for a toy store. Suggest related products when relevant.

7. **Important**: The user is authenticated. When making purchases or checking orders, the system automatically provides your user identification — you do not need to ask for or manage user IDs.`;

function buildOptions(resumeSessionId: string | undefined): Options {
  // allowedTools restricts the agent to just the Wonder Toys MCP tools (no
  // Bash/file access); bypassPermissions auto-approves them for headless
  // serving; settingSources: [] isolates the run from any local ~/.claude
  // config so behaviour is reproducible.
  return {
    systemPrompt: SYSTEM_PROMPT,
    model: MODEL,
    mcpServers: { [MCP_SERVER_NAME]: wonderToysServer },
    allowedTools,
    permissionMode: "bypassPermissions",
    settingSources: [],
    ...(resumeSessionId ? { resume: resumeSessionId } : {}),
  };
}

// Conversation memory. The TypeScript SDK has no persistent `ClaudeSDKClient`
// (only `query()`), so we retain the SDK session id per user and resume it on
// the next turn — the equivalent of the Python tier's per-user client. The
// turn counter lets us detect a reset (browser refresh sends a shrunk history)
// and start a fresh session.
const sessionIds: Map<string, string> = new Map();
const sessionTurns: Map<string, number> = new Map();

type ChatMessage = { role: "user" | "assistant" | "system"; content: string };

export async function* streamAgent(
  messages: ChatMessage[],
  userId: string
): AsyncGenerator<string> {
  const assistantTurns = messages.filter((m) => m.role === "assistant").length;
  const existingTurns = sessionTurns.get(userId) ?? 0;

  if (!sessionIds.has(userId) || assistantTurns < existingTurns) {
    // New conversation or a reset (browser refresh) — drop the stale session.
    sessionIds.delete(userId);
    sessionTurns.set(userId, 0);
  }

  const userMessages = messages.filter((m) => m.role === "user");
  if (userMessages.length === 0) {
    yield "data: [DONE]\n\n";
    return;
  }
  const lastMessage = userMessages[userMessages.length - 1].content;

  // Initialise tracing lazily on the first request. This MUST run in the same
  // module instance as `streamAgent` so the patched `query()` and the tracer
  // are visible here — Next.js resolves the top-level `instrumentation.ts` in a
  // different module instance than the app bundle, so a startup hook there
  // would set state this file can't see. `initTracing` is idempotent.
  await initTracing();

  // Make the user id ambient so the in-process tools can read it.
  enterUserId(userId);

  const resumeSessionId = sessionIds.get(userId);
  let capturedSessionId = resumeSessionId;

  let hadTextBefore = false;
  let inToolCall = false;

  // Emit per-generation LLM spans. The Claude Agent SDK instrumentor produces
  // AGENT and TOOL spans but no LLM spans — the SDK runs the Claude Code binary
  // as a subprocess and makes its model calls there, so an in-process LLM
  // instrumentor never sees them. We open a CHAIN parent span, run the
  // instrumented query() inside its context (so the AGENT span nests under it),
  // and synthesize an LLM span for each assistant generation as a child of the
  // same CHAIN — giving one coherent trace: CHAIN → { AGENT → TOOL…, LLM… }.
  // Token counts come from the final result message. The tracer is null only if
  // tracing failed to initialise, in which case this degrades to plain streaming.
  const tracer = getTracer();
  const query = await getInstrumentedQuery();
  const llmSpans: Span[] = [];

  const chainSpan = tracer
    ? tracer.startSpan("WonderToysAgent", {
        attributes: {
          [SemanticConventions.OPENINFERENCE_SPAN_KIND]:
            OpenInferenceSpanKind.CHAIN,
          [SemanticConventions.SESSION_ID]: userId,
          [SemanticConventions.INPUT_VALUE]: lastMessage,
        },
      })
    : null;
  const chainCtx = chainSpan
    ? trace.setSpan(context.active(), chainSpan)
    : context.active();

  let finalText = "";

  try {
    // Create both the query iterable and its iterator within the CHAIN
    // context. The instrumentor captures `context.active()` when query() is
    // called (to parent the inner turns) AND again when `[Symbol.asyncIterator]`
    // runs (to parent the AGENT span itself). A plain `for await` would invoke
    // the latter outside this scope, making the AGENT span a separate root
    // trace — so we take the iterator manually inside `context.with` and drive
    // it by hand. Result: one trace, CHAIN → { AGENT → TOOL…, LLM… }.
    const iterable = context.with(chainCtx, () =>
      query({ prompt: lastMessage, options: buildOptions(resumeSessionId) })
    ) as AsyncIterable<SDKMessage>;
    const iterator = context.with(chainCtx, () =>
      iterable[Symbol.asyncIterator]()
    );

    while (true) {
      const next = await context.with(chainCtx, () => iterator.next());
      if (next.done) break;
      const message = next.value;
      const sid = (message as { session_id?: string }).session_id;
      if (sid) capturedSessionId = sid;

      if (message.type === "result") {
        const usage = (message as { usage?: { input_tokens?: number; output_tokens?: number } }).usage;
        const result = (message as { result?: string }).result;
        if (typeof result === "string") finalText = result;
        const last = llmSpans[llmSpans.length - 1];
        if (last && usage) {
          last.setAttribute(
            SemanticConventions.LLM_TOKEN_COUNT_PROMPT,
            usage.input_tokens ?? 0
          );
          last.setAttribute(
            SemanticConventions.LLM_TOKEN_COUNT_COMPLETION,
            usage.output_tokens ?? 0
          );
        }
        continue;
      }

      if (message.type !== "assistant") continue;

      const content = message.message.content;
      const hasContent = content.some(
        (b) => b.type === "text" || b.type === "tool_use"
      );
      // Skip thinking-only messages so they don't create empty LLM spans.
      if (tracer && hasContent) {
        const outputText = content
          .filter((b): b is Extract<typeof b, { type: "text" }> => b.type === "text")
          .map((b) => b.text)
          .join("");
        const model = message.message.model;
        // Each assistant message carries its own usage — attribute tokens to
        // this generation's span. The final result message's usage is applied
        // to the last span below as a fallback.
        const usage = message.message.usage as
          | { input_tokens?: number; output_tokens?: number }
          | undefined;
        const span = tracer.startSpan(
          `${model} generation`,
          {
            attributes: {
              [SemanticConventions.OPENINFERENCE_SPAN_KIND]:
                OpenInferenceSpanKind.LLM,
              [SemanticConventions.LLM_MODEL_NAME]: model,
              [SemanticConventions.LLM_PROVIDER]: "anthropic",
              ...(usage?.input_tokens != null
                ? {
                    [SemanticConventions.LLM_TOKEN_COUNT_PROMPT]:
                      usage.input_tokens,
                  }
                : {}),
              ...(usage?.output_tokens != null
                ? {
                    [SemanticConventions.LLM_TOKEN_COUNT_COMPLETION]:
                      usage.output_tokens,
                  }
                : {}),
              ...(outputText
                ? { [SemanticConventions.OUTPUT_VALUE]: outputText }
                : {}),
            },
          },
          chainCtx
        );
        llmSpans.push(span);
      }

      for (const block of content) {
        if (block.type === "tool_use") {
          inToolCall = true;
          continue;
        }
        if (block.type === "text") {
          const textDelta = block.text;
          if (!textDelta) continue;
          if (inToolCall && hadTextBefore) {
            yield `data: ${JSON.stringify({ text: "\n\n" })}\n\n`;
          }
          inToolCall = false;
          hadTextBefore = true;
          yield `data: ${JSON.stringify({ text: textDelta })}\n\n`;
        }
      }
    }

    if (chainSpan) {
      if (finalText) {
        chainSpan.setAttribute(SemanticConventions.OUTPUT_VALUE, finalText);
      }
      chainSpan.setStatus({ code: SpanStatusCode.OK });
    }
  } catch (error) {
    if (chainSpan && error instanceof Error) {
      chainSpan.recordException(error);
      chainSpan.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
    }
    throw error;
  } finally {
    for (const span of llmSpans) span.end();
    chainSpan?.end();
    // Force-flush the batch processor so this turn's spans ship to AX before
    // the request handler exits, rather than waiting for the next interval.
    try {
      await getTracerProvider()?.forceFlush?.();
    } catch {
      // best-effort; never fail the response over a flush error
    }
  }

  if (capturedSessionId) sessionIds.set(userId, capturedSessionId);
  sessionTurns.set(userId, assistantTurns + 1);

  yield "data: [DONE]\n\n";
}
