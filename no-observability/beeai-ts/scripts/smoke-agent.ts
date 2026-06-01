// Direct smoke test of the BeeAI agent layer — bypasses NextAuth so we can
// validate the agent + tools + streaming without driving the UI.
//
// Run: ANTHROPIC_API_KEY=... npx tsx scripts/smoke-agent.ts

import "dotenv/config";
import { streamAgentResponse, type ChatMessage } from "@/beeai/agent";

const USER_CONTEXT =
  "The current authenticated user's ID is: smoke-test. Use this userId when making purchases or checking order status.";

async function runTurn(history: ChatMessage[], userText: string): Promise<string> {
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
  process.stdout.write(`\n  (tool calls: ${toolCalls}, text length: ${assembled.length})\n`);
  return assembled;
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY not set");
  const history: ChatMessage[] = [];

  const r1 = await runTurn(history, "Show me dragon toys");
  history.push({ role: "user", content: "Show me dragon toys" }, { role: "assistant", content: r1 });

  const r2 = await runTurn(history, "I'd like to buy the plush one");
  history.push(
    { role: "user", content: "I'd like to buy the plush one" },
    { role: "assistant", content: r2 },
  );

  const r3 = await runTurn(
    history,
    "Ship it to John Smith, 123 Dragon Lane, Springfield, IL 62701, US",
  );
  history.push(
    { role: "user", content: "Ship it to John Smith, 123 Dragon Lane, Springfield, IL 62701, US" },
    { role: "assistant", content: r3 },
  );

  console.log("\n✅ smoke-agent: 3-turn conversation complete");
}

main().catch((err) => {
  console.error("\nFAIL:", err);
  process.exit(1);
});
