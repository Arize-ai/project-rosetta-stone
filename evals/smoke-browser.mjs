/**
 * Browser smoke test for the openai-voice tier.
 *
 * Exercises three things from a real Chromium context:
 *   1. The Next.js home page serves and redirects unauthenticated users
 *      to /login (proves the frontend stack — App Router, auth middleware,
 *      and all the bits that the synthetic-voice harness skips — is alive).
 *   2. The login page renders with the X sign-in button.
 *   3. From inside that browser context, a WebSocket opens to the voice
 *      backend and the OpenAI Realtime session reaches `session.ready`
 *      (proves the full browser → backend → OpenAI Realtime path that
 *      `useAudioCapture` would otherwise drive with a live microphone).
 *
 * Env:
 *   BASE_URL          (default http://localhost:3000)
 *   VOICE_WS_URL      (default ws://localhost:8001/voice)
 *   BACKEND_SECRET    Token required by the voice WS in dev. Loaded from
 *                     the .env.local of the openai-voice tier.
 *
 * Usage:
 *   npm install playwright --no-save  # one-time, in /evals
 *   npx playwright install chromium
 *   node evals/smoke-browser.mjs
 */

import { chromium } from "playwright";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Tier .env.local discovery — caller may set APP_DIR, else default to phoenix/openai-voice
const APP_DIR = process.env.APP_DIR
  ?? resolve(__dirname, "..", "phoenix", "openai-voice");
const ENV_PATH = resolve(APP_DIR, ".env.local");

if (existsSync(ENV_PATH)) {
  for (const line of readFileSync(ENV_PATH, "utf8").split("\n")) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const WS_URL = process.env.VOICE_WS_URL || "ws://localhost:8001/voice";
const BACKEND_SECRET = process.env.BACKEND_SECRET || "";

const fails = [];
function check(label, cond, detail = "") {
  const tag = cond ? "✓" : "✗";
  console.log(`  ${tag} ${label}${detail ? "  — " + detail : ""}`);
  if (!cond) fails.push(label);
}

async function main() {
  console.log(`Browser smoke (${BASE_URL})`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    permissions: ["microphone"],
  });
  const page = await context.newPage();

  // --- (1) Home page redirect ----------------------------------------
  console.log("\n[1/3] Unauth home page should redirect to /login");
  const homeRes = await page.goto(BASE_URL, { waitUntil: "networkidle" });
  check(
    "200 status",
    homeRes && homeRes.ok(),
    `${homeRes?.status()}`
  );
  check(
    "URL contains /login",
    page.url().includes("/login"),
    page.url()
  );

  // --- (2) Login page renders ----------------------------------------
  console.log("\n[2/3] /login renders");
  await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle" });
  const xButton = await page.getByRole("button", { name: /Sign in with X/i }).count();
  check("Sign-in-with-X button visible", xButton >= 1);

  const title = await page.locator("h1").first().textContent();
  check(
    "Wonder Toys title rendered",
    /Wonder Toys/.test(title || ""),
    JSON.stringify(title)
  );

  // --- (3) Voice WS reachable from a browser context -----------------
  // Open the actual /voice WebSocket from inside the running page so the
  // CORS / cookie / browser-side network path is exercised, not just curl.
  console.log("\n[3/3] Voice WebSocket from browser context reaches session.ready");
  const wsResult = await page.evaluate(
    async ([url, token]) => {
      const fullUrl = `${url}?token=${encodeURIComponent(token)}&user_id=browser-smoke`;
      const events = [];
      return await new Promise((resolveProm) => {
        const ws = new WebSocket(fullUrl);
        const timeout = setTimeout(() => {
          try { ws.close(); } catch {}
          resolveProm({ ok: false, reason: "timeout", events });
        }, 15000);

        ws.onopen = () => events.push("open");
        ws.onerror = (e) => events.push(`error:${e?.message || "unknown"}`);
        ws.onclose = (e) => {
          if (events.length < 5) {
            // close before we saw session.ready
            clearTimeout(timeout);
            resolveProm({ ok: false, reason: `closed (${e.code})`, events });
          }
        };
        ws.onmessage = (msg) => {
          try {
            const data = JSON.parse(msg.data);
            events.push(`recv:${data.type}`);
            if (data.type === "session.ready") {
              clearTimeout(timeout);
              try { ws.close(); } catch {}
              resolveProm({ ok: true, events });
            }
          } catch (e) {
            events.push(`parse-error`);
          }
        };
      });
    },
    [WS_URL, BACKEND_SECRET]
  );

  check(
    "session.ready received in browser",
    wsResult.ok === true,
    wsResult.ok ? `events: ${wsResult.events.join(", ")}` : `reason=${wsResult.reason}, events=${wsResult.events.join(",")}`
  );

  await browser.close();

  if (fails.length) {
    console.log(`\n✗ ${fails.length} check(s) failed: ${fails.join("; ")}`);
    process.exit(1);
  }
  console.log("\n✓ Browser smoke passed");
}

main().catch((err) => {
  console.error("FATAL:", err);
  process.exit(1);
});
