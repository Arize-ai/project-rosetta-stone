import "dotenv/config";
import { register } from "@arizeai/phoenix-otel";
import { BeeAIInstrumentation } from "@arizeai/openinference-instrumentation-beeai";
import * as beeaiFramework from "beeai-framework";

async function main() {
  // Let phoenix-otel construct its own span processor.
  const provider = register({
    projectName: "wonder-toys-beeai-ts",
    url: "http://localhost:6006",
    batch: false,
  });

  const inst = new BeeAIInstrumentation({ tracerProvider: provider });
  inst.manuallyInstrument(beeaiFramework as any);

  const { AnthropicChatModel } = await import("beeai-framework/adapters/anthropic/backend/chat");
  const { ReActAgent } = await import("beeai-framework/agents/react/agent");
  const { UnconstrainedMemory } = await import("beeai-framework/memory/unconstrainedMemory");
  const { searchProductsTool } = await import("@/beeai/tools/search-products");

  const llm = new AnthropicChatModel("claude-sonnet-4-6");
  llm.config({ parameters: { stream: true } as any });
  const agent = new ReActAgent({ llm, memory: new UnconstrainedMemory(), tools: [searchProductsTool] });
  await agent.run({ prompt: "Show me dragon toys" });
  await (provider as any).forceFlush();
  await (provider as any).shutdown();
}
main().catch(console.error);
