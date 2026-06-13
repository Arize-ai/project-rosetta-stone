import { run, user, assistant } from "@openai/agents";
import type { AgentInputItem } from "@openai/agents";
import { getAgent, SYSTEM_PROMPT } from "@/ai/agent";
import { getTracerProvider } from "@/ai/tracing";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

type ChatMessage = { role: "user" | "assistant" | "system"; content: string };

export async function POST(req: Request) {
  let userId: string;

  const evalSecret = req.headers.get("x-eval-secret");
  const configuredSecret = process.env.EVAL_SECRET;

  if (configuredSecret && evalSecret === configuredSecret) {
    userId = req.headers.get("x-eval-user-id") ?? "eval-user-001";
  } else {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    userId = (session.user as { id?: string }).id || session.user.email || "anonymous";
  }
  const { messages } = (await req.json()) as { messages: ChatMessage[] };

  // Build conversation history as AgentInputItem[]. The system prompt is
  // provided to the agent via `instructions`; we layer the userId context on
  // top by appending a system-style note when constructing the agent below.
  const history: AgentInputItem[] = [];
  for (const msg of messages) {
    if (msg.role === "user") {
      history.push(user(msg.content));
    } else if (msg.role === "assistant") {
      history.push(assistant(msg.content));
    }
  }

  const agent = getAgent().clone({
    instructions: `${SYSTEM_PROMPT}\n\nThe current authenticated user's ID is: ${userId}. Use this userId when making purchases or checking order status.`,
  });

  const stream = await run(agent, history, { stream: true, maxTurns: 10 });

  // Translate the agents SDK stream into the same SSE shape every other tier
  // emits: `data: {"text":"..."}\n\n` chunks followed by `data: [DONE]\n\n`.
  // Inject a `\n\n` between pre-tool and post-tool text so they don't run
  // together visually.
  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      try {
        let hadTextBeforeToolCall = false;
        let inToolCall = false;

        for await (const event of stream.toStream()) {
          if (event.type === "raw_model_stream_event") {
            const data = event.data;
            // Responses-API text deltas land as `output_text_delta`.
            if (data?.type === "output_text_delta" && typeof data.delta === "string") {
              if (inToolCall && hadTextBeforeToolCall) {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ text: "\n\n" })}\n\n`)
                );
              }
              inToolCall = false;
              hadTextBeforeToolCall = true;
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ text: data.delta })}\n\n`)
              );
            }
          } else if (event.type === "run_item_stream_event") {
            if (event.item.type === "tool_call_item") {
              inToolCall = true;
            }
          }
        }

        await stream.completed;
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();

        // Force-flush the OTel batch processor so spans for this turn ship
        // to AX before the request handler exits. Without this, batched
        // spans can sit in the buffer until the next interval and miss the
        // serverless response cycle entirely.
        try {
          await getTracerProvider()?.forceFlush();
        } catch {
          // best-effort; never fail the response over a flush error
        }
      } catch (error) {
        controller.error(error);
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
