import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const BACKEND_SECRET = process.env.BACKEND_SECRET || "";
const WS_URL = process.env.NEXT_PUBLIC_VOICE_WS_URL || "ws://localhost:8001/voice";

/**
 * Mints a short-lived connection bundle for the browser's WebSocket
 * upgrade to the Python backend's /voice endpoint.
 *
 * Browsers can't set arbitrary headers on a WebSocket upgrade, so we put
 * the shared backend secret and the authenticated user id in the query
 * string. The backend validates both. The token is the same shared secret
 * the HTTP `/api/chat` route uses; it's safe to expose to the browser only
 * for localhost dev — in any deployed environment, swap this for a short-
 * lived signed token (e.g. JWT) instead.
 */
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId =
    (session.user as { id?: string }).id || session.user.email || "anonymous";

  return NextResponse.json({
    wsUrl: WS_URL,
    token: BACKEND_SECRET,
    userId,
  });
}
