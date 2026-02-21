import { mastra } from "@/mastra";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

const shoppingAgent = mastra.getAgent("shoppingAgent");

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id?: string }).id || session.user.email || "anonymous";
  const { messages } = await req.json();

  // Prepend user context to the system message
  const messagesWithContext = [
    {
      role: "system" as const,
      content: `The current authenticated user's ID is: ${userId}. Use this userId when making purchases or checking order status.`,
    },
    ...messages,
  ];

  const stream = await shoppingAgent.stream(messagesWithContext);

  // Convert the Mastra stream to a ReadableStream for the client.
  // We use fullStream (Vercel AI SDK) to detect tool-call boundaries and
  // inject a paragraph break so pre-tool and post-tool text don't run together.
  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      try {
        let hadTextBeforeToolCall = false;
        let inToolCall = false;

        for await (const part of stream.fullStream) {
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
              encoder.encode(`data: ${JSON.stringify({ text: part.payload.text })}\n\n`)
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
