import "dotenv/config";
import { register } from "@arizeai/phoenix-otel";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-proto";
import { ConsoleSpanExporter, SimpleSpanProcessor } from "@opentelemetry/sdk-trace-node";
import { BeeAIInstrumentation } from "@arizeai/openinference-instrumentation-beeai";
import * as beeaiFramework from "beeai-framework";

async function main() {
  const provider = register({
    projectName: "wonder-toys-beeai-ts",
    spanProcessors: [
      new SimpleSpanProcessor(new ConsoleSpanExporter()),
      new SimpleSpanProcessor(
        new OTLPTraceExporter({ url: "http://localhost:6006/v1/traces" }),
      ),
    ],
  });

  const inst = new BeeAIInstrumentation({ tracerProvider: provider });
  inst.manuallyInstrument(beeaiFramework as any);

  const { AnthropicChatModel } = await import("beeai-framework/adapters/anthropic/backend/chat");
  const { ReActAgent } = await import("beeai-framework/agents/react/agent");
  const { UnconstrainedMemory } = await import("beeai-framework/memory/unconstrainedMemory");
  const { searchProductsTool } = await import("@/beeai/tools/search-products");

  const llm = new AnthropicChatModel("claude-sonnet-4-20250514");
  llm.config({ parameters: { stream: true } as any });
  const agent = new ReActAgent({ llm, memory: new UnconstrainedMemory(), tools: [searchProductsTool] });
  await agent.run({ prompt: "Show me dragon toys" });
  await new Promise(r => setTimeout(r, 3000));
}
main().catch(console.error);
