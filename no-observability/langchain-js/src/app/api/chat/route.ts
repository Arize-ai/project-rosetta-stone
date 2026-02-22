import { shoppingAgent, SYSTEM_PROMPT } from "@/langchain/agent";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { HumanMessage, AIMessage, SystemMessage } from "@langchain/core/messages";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id?: string }).id || session.user.email || "anonymous";
  const { messages } = await req.json();

  // Convert client messages to LangChain message types and prepend system context
  const langchainMessages = [
    new SystemMessage(
      SYSTEM_PROMPT +
        `\n\nThe current authenticated user's ID is: ${userId}. Use this userId when making purchases or checking order status.`
    ),
    ...messages.map((m: { role: string; content: string }) => {
      if (m.role === "user") return new HumanMessage(m.content);
      if (m.role === "assistant") return new AIMessage(m.content);
      if (m.role === "system") return new SystemMessage(m.content);
      return new HumanMessage(m.content);
    }),
  ];

  // Convert the LangChain stream to a ReadableStream for the client.
  // We use streamEvents to detect tool-call boundaries and inject a paragraph
  // break so pre-tool and post-tool text don't run together.
  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      try {
        let hadTextBeforeToolCall = false;
        let inToolCall = false;

        const eventStream = shoppingAgent.streamEvents(
          { messages: langchainMessages },
          { version: "v2" }
        );

        for await (const event of eventStream) {
          if (event.event === "on_chat_model_stream") {
            // Text token from the LLM
            const chunk = event.data.chunk;
            let text = "";

            if (typeof chunk.content === "string") {
              text = chunk.content;
            } else if (Array.isArray(chunk.content)) {
              // For Anthropic, content blocks are objects — only emit text blocks
              for (const block of chunk.content) {
                if (block.type === "text" && block.text) {
                  text += block.text;
                }
              }
            }

            if (text) {
              // If we're resuming text after a tool call, inject a paragraph break
              if (inToolCall && hadTextBeforeToolCall) {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ text: "\n\n" })}\n\n`)
                );
              }
              inToolCall = false;
              hadTextBeforeToolCall = true;
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ text })}\n\n`)
              );
            }
          } else if (event.event === "on_tool_start") {
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
