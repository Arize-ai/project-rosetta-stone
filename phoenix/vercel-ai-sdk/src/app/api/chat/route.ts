import { streamText, stepCountIs } from "ai";
import { model, tools, SYSTEM_PROMPT } from "@/ai/agent";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { context } from "@opentelemetry/api";
import { setSession } from "@arizeai/openinference-core";

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
  const { messages } = await req.json();
  const sessionId = req.headers.get("x-session-id") ?? crypto.randomUUID();

  // Append user context to the system prompt
  const system = `${SYSTEM_PROMPT}\n\nThe current authenticated user's ID is: ${userId}. Use this userId when making purchases or checking order status.`;

  const result = context.with(
    setSession(context.active(), { sessionId }),
    () => streamText({
      model,
      system,
      messages,
      tools,
      stopWhen: stepCountIs(10),
      experimental_telemetry: { isEnabled: true },
    }),
  );

  // Convert the Vercel AI SDK stream to a ReadableStream for the client.
  // We iterate fullStream to detect tool-call boundaries and inject a paragraph
  // break so pre-tool and post-tool text don't run together.
  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      try {
        let hadTextBeforeToolCall = false;
        let inToolCall = false;

        for await (const part of result.fullStream) {
          if (part.type === "text-delta") {
            // If we're resuming text after a tool call, inject a paragraph break
            if (inToolCall && hadTextBeforeToolCall) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ text: "\n\n" })}\n\n`)
              );
            }
            inToolCall = false;
            hadTextBeforeToolCall = true;
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ text: part.text })}\n\n`)
            );
          } else if (part.type === "tool-call") {
            inToolCall = true;
          }
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
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
