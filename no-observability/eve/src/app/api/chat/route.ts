import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

// The Eve agent runs as a separate dev server (filesystem-first runtime) that
// exposes the built-in HTTP channel. This route proxies to it and translates
// Eve's NDJSON session stream into the Wonder Toys SSE shape the chat UI
// expects (`data: {"text":"..."}\n\n` ... `data: [DONE]\n\n`).
const EVE_URL = process.env.EVE_URL || "http://127.0.0.1:2000";

// Honor the same eval-bypass header the other tiers use for headless smoke
// tests, so curl can hit /api/chat without an X/Twitter OAuth session.
const EVAL_SECRET = process.env.EVAL_SECRET || "";

interface ChatMessage {
  role: string;
  content: string;
}

export async function POST(req: Request) {
  let userId: string;

  const evalSecret = req.headers.get("x-eval-secret");
  const evalUserId = req.headers.get("x-eval-user-id");
  if (EVAL_SECRET && evalSecret && evalSecret === EVAL_SECRET) {
    userId = evalUserId || "eval-user";
  } else {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    userId =
      (session.user as { id?: string }).id || session.user.email || "anonymous";
  }

  const { messages } = (await req.json()) as { messages: ChatMessage[] };

  // The chat UI owns conversation history (it sends the messages so far each
  // request, mirroring the stateless TypeScript tiers). We send the latest
  // user message as the new Eve turn and prepend the earlier turns as context
  // so the agent has the conversation. The userId rides along as Eve client
  // context — the runtime surfaces it to the model as `Client context: ...`,
  // and the system prompt tells the model to thread it into the userId tool
  // arguments (parity with how the vercel-ai-sdk tier injects it).
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  const userMessage = lastUser?.content ?? "";

  const priorTurns = messages
    .slice(0, lastUser ? messages.lastIndexOf(lastUser) : 0)
    .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
    .join("\n");

  const message = priorTurns
    ? `Conversation so far:\n${priorTurns}\n\nUser: ${userMessage}`
    : userMessage;

  // 1. Create a session. Eve responds 202 immediately with the session id.
  const createRes = await fetch(`${EVE_URL}/eve/v1/session`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      message,
      clientContext: { userId },
    }),
  });

  if (!createRes.ok && createRes.status !== 202) {
    const body = await createRes.text();
    return NextResponse.json(
      { error: "Eve agent error", detail: body },
      { status: 502 }
    );
  }

  const created = (await createRes.json()) as { sessionId?: string };
  const sessionId =
    created.sessionId || createRes.headers.get("x-eve-session-id") || "";

  if (!sessionId) {
    return NextResponse.json(
      { error: "Eve agent did not return a session id" },
      { status: 502 }
    );
  }

  // 2. Attach to the NDJSON stream and translate to the Wonder Toys SSE shape.
  const streamRes = await fetch(
    `${EVE_URL}/eve/v1/session/${sessionId}/stream`,
    { headers: { accept: "application/x-ndjson" } }
  );

  if (!streamRes.ok || !streamRes.body) {
    return NextResponse.json(
      { error: "Eve agent stream unavailable" },
      { status: 502 }
    );
  }

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const readable = new ReadableStream({
    async start(controller) {
      const reader = streamRes.body!.getReader();
      let buffer = "";

      // Eve's `message.appended` events carry the cumulative text for the
      // Eve's `message.appended` carries `messageDelta` (the new text) and
      // `messageSoFar` (cumulative). We emit `messageDelta` directly. `emitted`
      // tracks whether the current assistant block has produced any text yet
      // (so `message.completed` can backfill clients that ignore deltas).
      let emitted = 0;
      // True once we've emitted assistant text and then saw a tool call, so we
      // know to inject a paragraph break when text resumes (keeps product
      // cards rendering correctly).
      let hadTextBeforeToolCall = false;
      let inToolCall = false;

      const send = (text: string) => {
        if (!text) return;
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ text })}\n\n`)
        );
      };

      const handleEvent = (evt: { type: string; data?: unknown }) => {
        const data = (evt.data ?? {}) as Record<string, unknown>;

        switch (evt.type) {
          case "actions.requested": {
            if (emitted > 0) hadTextBeforeToolCall = true;
            inToolCall = true;
            break;
          }
          case "message.appended": {
            const delta =
              typeof data.messageDelta === "string"
                ? (data.messageDelta as string)
                : "";
            if (!delta) break;

            // Resuming text after a tool call: paragraph break first.
            if (inToolCall && hadTextBeforeToolCall && emitted === 0) {
              send("\n\n");
            }
            inToolCall = false;
            send(delta);
            emitted += delta.length;
            break;
          }
          case "message.completed": {
            // Finalized block. If we never streamed deltas (client ignores
            // message.appended), emit the full block text now.
            const text =
              typeof data.message === "string"
                ? (data.message as string)
                : "";
            if (text && emitted === 0) {
              if (inToolCall && hadTextBeforeToolCall) send("\n\n");
              inToolCall = false;
              send(text);
            }
            // Reset per-block tracker for the next assistant block.
            emitted = 0;
            break;
          }
          default:
            break;
        }
      };

      try {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          let nl: number;
          while ((nl = buffer.indexOf("\n")) !== -1) {
            const line = buffer.slice(0, nl).trim();
            buffer = buffer.slice(nl + 1);
            if (!line) continue;
            let evt: { type: string; data?: unknown };
            try {
              evt = JSON.parse(line);
            } catch {
              continue;
            }
            handleEvent(evt);
            // In conversation mode the turn ends with `turn.completed` and the
            // session parks on `session.waiting`. Terminate the SSE there (the
            // UI owns history and starts a fresh Eve session per request).
            if (
              evt.type === "session.waiting" ||
              evt.type === "session.completed" ||
              evt.type === "session.failed" ||
              evt.type === "turn.failed"
            ) {
              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              controller.close();
              return;
            }
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
