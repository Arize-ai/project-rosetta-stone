import { streamAgent } from "@/ai/agent";
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

  // Translate the agent's SSE generator into a streamed HTTP response. The
  // generator emits `data: {"text":"..."}\n\n` chunks followed by
  // `data: [DONE]\n\n`, identical to every other tier.
  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of streamAgent(messages, userId)) {
          controller.enqueue(encoder.encode(chunk));
        }
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
