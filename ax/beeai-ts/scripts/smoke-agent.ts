// Direct smoke test of the BeeAI agent layer — bypasses NextAuth so we can
// validate the agent + tools + streaming + Phoenix tracing without driving
// the UI.
//
// Run: ANTHROPIC_API_KEY=... npx tsx scripts/smoke-agent.ts

import "dotenv/config";
import { initTracing, getTracerProvider } from "@/beeai/tracing";

// Type-only import so we can name the message shape without dragging in
// beeai-framework at module load (we want tracing initialised first).
import type { ChatMessage } from "@/beeai/agent";

const USER_CONTEXT =
  "The current authenticated user's ID is: smoke-test. Use this userId when making purchases or checking order status.";

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY not set");

  // Init tracing BEFORE the agent module loads. OpenInference's
  // `manuallyInstrument(beeaiFramework)` needs to patch the framework
  // classes before they're referenced by user code.
  await initTracing();
  const { streamAgentResponse } = await import("@/beeai/agent");

  const history: ChatMessage[] = [];
  async function runTurn(userText: string): Promise<string> {
    const messages: ChatMessage[] = [...history, { role: "user", content: userText }];
    let assembled = "";
    let toolCalls = 0;
    process.stdout.write(`\n▶ user: ${userText}\n  ← `);
    for await (const ev of streamAgentResponse(messages, USER_CONTEXT)) {
      if (ev.type === "text-delta") {
        assembled += ev.text;
        process.stdout.write(ev.text);
      } else if (ev.type === "tool-call") {
        toolCalls++;
      }
    }
    process.stdout.write(
      `\n  (tool calls: ${toolCalls}, text length: ${assembled.length})\n`,
    );
    return assembled;
  }

  const r1 = await runTurn("Show me dragon toys");
  history.push({ role: "user", content: "Show me dragon toys" }, { role: "assistant", content: r1 });

  const r2 = await runTurn("I'd like to buy the plush one");
  history.push(
    { role: "user", content: "I'd like to buy the plush one" },
    { role: "assistant", content: r2 },
  );

  const r3 = await runTurn(
    "Ship it to John Smith, 123 Dragon Lane, Springfield, IL 62701, US",
  );
  history.push(
    { role: "user", content: "Ship it to John Smith, 123 Dragon Lane, Springfield, IL 62701, US" },
    { role: "assistant", content: r3 },
  );

  console.log("\n✅ smoke-agent: 3-turn conversation complete");

  // Explicit force-flush + shutdown so the OTLP/protobuf POST to
  // otlp.arize.com actually completes before the process exits. Without
  // this the SimpleSpanProcessor races the process and AX never receives
  // the spans.
  const provider = getTracerProvider();
  if (provider?.forceFlush) await provider.forceFlush();
  if (provider?.shutdown) await provider.shutdown();
  console.log("[smoke] tracer provider flushed + shut down");
}

main().catch((err) => {
  console.error("\nFAIL:", err);
  process.exit(1);
});
