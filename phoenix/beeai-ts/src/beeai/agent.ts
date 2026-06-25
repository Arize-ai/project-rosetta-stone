import { AnthropicChatModel } from "beeai-framework/adapters/anthropic/backend/chat";
import { ReActAgent } from "beeai-framework/agents/react/agent";
import { UnconstrainedMemory } from "beeai-framework/memory/unconstrainedMemory";
import { SystemMessage, UserMessage, AssistantMessage } from "beeai-framework/backend/message";

import { searchProductsTool } from "./tools/search-products";
import { getProductTool } from "./tools/get-product";
import { purchaseProductTool } from "./tools/purchase";
import { checkOrderStatusTool } from "./tools/order-status";
import { cancelOrderToolBeeAI } from "./tools/cancel-order";

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

7. **Important**: You have a userId available in the conversation context. Always use it when making purchases or checking orders. The userId will be provided in the system context.`;

// We use `ReActAgent` (BeeAI's ReAct-pattern agent) because:
//   1. It's compatible with `@arizeai/openinference-instrumentation-beeai`, which
//      pins beeai-framework to `>=0.1.9 <0.1.14`. RequirementAgent only exists
//      on newer versions.
//   2. Unlike `ToolCallingAgent` on 0.1.13, ReActAgent exposes proper
//      token-level streaming via the `partialUpdate` event with
//      `update.key === "final_answer"` — necessary for the chat SSE UX.
function buildAgent() {
  const llm = new AnthropicChatModel("claude-sonnet-4-6");
  llm.config({ parameters: { stream: true } as never });
  return new ReActAgent({
    llm,
    memory: new UnconstrainedMemory(),
    tools: [
      searchProductsTool,
      getProductTool,
      purchaseProductTool,
      checkOrderStatusTool,
      cancelOrderToolBeeAI,
    ],
  });
}

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export async function* streamAgentResponse(
  messages: ChatMessage[],
  userContext: string,
): AsyncGenerator<{ type: "text-delta"; text: string } | { type: "tool-call" }, void, unknown> {
  const agent = buildAgent();

  // Replay history into memory; the most recent user message becomes the
  // new `prompt`.
  const history = messages.slice(0, -1);
  const lastUser = messages[messages.length - 1];
  if (!lastUser || lastUser.role !== "user") {
    throw new Error("expected the final message to be a user message");
  }

  await agent.memory.add(new SystemMessage(SYSTEM_PROMPT));
  await agent.memory.add(new SystemMessage(userContext));
  for (const m of history) {
    if (m.role === "user") await agent.memory.add(new UserMessage(m.content));
    else if (m.role === "assistant") await agent.memory.add(new AssistantMessage(m.content));
    else if (m.role === "system") await agent.memory.add(new SystemMessage(m.content));
  }

  type Event = { type: "text-delta"; text: string } | { type: "tool-call" };
  const queue: Event[] = [];
  let done = false;
  let resolveWaiter: (() => void) | null = null;
  const wake = () => {
    if (resolveWaiter) {
      const r = resolveWaiter;
      resolveWaiter = null;
      r();
    }
  };

  const runPromise = agent
    .run({ prompt: lastUser.content })
    .observe((emitter) => {
      // ReActAgent emits `partialUpdate` events for each streaming chunk.
      // We only forward the `final_answer` deltas — the other keys
      // (`thought`, `tool_name`, `tool_input`) are internal reasoning the
      // user shouldn't see.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (emitter as any).on(
        "partialUpdate",
        (data: { update?: { key?: string; value?: string } }) => {
          if (data?.update?.key === "final_answer" && typeof data.update.value === "string") {
            queue.push({ type: "text-delta", text: data.update.value });
            wake();
          }
        },
      );
      // Tool boundaries — inject a `\n\n` paragraph break between pre- and
      // post-tool text so the response doesn't run together.
      emitter.match(
        /tool\.[^.]+\.start$/,
        (_d: unknown, _evt: { path: string }) => {
          queue.push({ type: "tool-call" });
          wake();
        },
        { matchNested: true },
      );
    })
    .then(() => {
      done = true;
      wake();
    })
    .catch((err) => {
      done = true;
      wake();
      throw err;
    });

  while (true) {
    while (queue.length > 0) {
      yield queue.shift()!;
    }
    if (done) break;
    await new Promise<void>((res) => {
      resolveWaiter = res;
    });
  }
  await runPromise;
}
