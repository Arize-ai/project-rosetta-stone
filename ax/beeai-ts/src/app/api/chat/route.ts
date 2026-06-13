import { streamAgentResponse, type ChatMessage } from "@/beeai/agent";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

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
    userId =
      (session.user as { id?: string }).id || session.user.email || "anonymous";
  }
  const { messages } = (await req.json()) as { messages: ChatMessage[] };

  const userContext = `The current authenticated user's ID is: ${userId}. Use this userId when making purchases or checking order status.`;

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      try {
        let hadTextBeforeToolCall = false;
        let inToolCall = false;

        for await (const event of streamAgentResponse(messages, userContext)) {
          if (event.type === "text-delta") {
            if (inToolCall && hadTextBeforeToolCall) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ text: "\n\n" })}\n\n`),
              );
            }
            inToolCall = false;
            hadTextBeforeToolCall = true;
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ text: event.text })}\n\n`),
            );
          } else if (event.type === "tool-call") {
            inToolCall = true;
          }
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (error) {
        console.error("Chat stream error:", error);
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
