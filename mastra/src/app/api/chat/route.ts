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

  // Convert the Mastra stream to a ReadableStream for the client
  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream.textStream) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ text: chunk })}\n\n`)
          );
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
