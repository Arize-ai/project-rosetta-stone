import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8001";
const BACKEND_SECRET = process.env.BACKEND_SECRET || "";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id?: string }).id || session.user.email || "anonymous";
  const { messages } = await req.json();

  const backendResponse = await fetch(`${BACKEND_URL}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": BACKEND_SECRET,
      "X-User-ID": userId,
    },
    body: JSON.stringify({ messages }),
  });

  if (!backendResponse.ok) {
    return NextResponse.json(
      { error: "Backend error" },
      { status: backendResponse.status }
    );
  }

  // Proxy the SSE stream directly
  return new Response(backendResponse.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
