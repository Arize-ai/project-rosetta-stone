import { test } from "@playwright/test";
import path from "node:path";
import os from "node:os";
import fs from "node:fs";

// Captures Arize AX session view + per-trace screenshots.
//
// Driven by env vars from the rosetta-pr-screenshots skill orchestrator:
//   OUT_DIR              absolute path to write PNGs into
//   AX_SESSION_URL       full AX session URL (built by the orchestrator)
//   AX_TRACE_URLS        JSON array of trace URLs (e.g. '["url1","url2"]')
//   AX_STORAGE_STATE     path to storage state JSON (default ~/.rosetta-stone/ax-auth.json)
//
// The whole file skips if AX_SESSION_URL isn't set, so a generic `npm test`
// only runs the public-flow smoke.

const OUT_DIR = process.env.OUT_DIR;
const SESSION_URL = process.env.AX_SESSION_URL;
const TRACE_URLS_JSON = process.env.AX_TRACE_URLS ?? "[]";
const STORAGE_STATE =
  process.env.AX_STORAGE_STATE ??
  path.join(os.homedir(), ".rosetta-stone", "ax-auth.json");

test.skip(!SESSION_URL || !OUT_DIR, "AX_SESSION_URL or OUT_DIR not set");

// AX SPA is heavy — give each test plenty of room to load + render + expand.
test.describe.configure({ timeout: 90_000 });

test.use({
  storageState: STORAGE_STATE,
  viewport: { width: 1440, height: 900 },
});

// Expand every collapsed accordion in the AX session/trace panels. Returns
// the number expanded so callers can loop until quiet.
const EXPAND_JS = `(() => {
  const btns = Array.from(document.querySelectorAll('button.ac-accordion-trigger[aria-expanded="false"]'));
  btns.forEach((b) => b.click());
  return btns.length;
})()`;

async function expandAll(page: import("@playwright/test").Page) {
  for (let i = 0; i < 8; i++) {
    const n = (await page.evaluate(EXPAND_JS)) as number;
    if (!n) break;
    await page.waitForTimeout(400);
  }
}

test.beforeAll(() => {
  if (!fs.existsSync(STORAGE_STATE)) {
    throw new Error(
      `AX storage state not found at ${STORAGE_STATE}. Run auth-bootstrap.mjs once.`
    );
  }
  if (OUT_DIR) fs.mkdirSync(OUT_DIR, { recursive: true });
});

test("ax session view", async ({ page }) => {
  await page.goto(SESSION_URL!, { waitUntil: "domcontentloaded" });
  // Wait for the SPA to render. The session panel is the most reliable
  // marker — accordion triggers appear once trace data has loaded.
  await page
    .waitForSelector("button.ac-accordion-trigger", { timeout: 30_000 })
    .catch(() => {
      // If we can't find the accordion, the session may be empty. Continue
      // anyway and screenshot whatever rendered.
    });
  await expandAll(page);
  await page.waitForTimeout(1500);
  await page.screenshot({
    path: path.join(OUT_DIR!, "ax-01-session.png"),
    fullPage: true,
  });
});

const traceUrls: string[] = JSON.parse(TRACE_URLS_JSON);

for (const [idx, url] of traceUrls.entries()) {
  const n = String(idx + 2).padStart(2, "0");
  // Trace IDs in URLs use `selectedTraceId=<hex>` — pull the last 8 chars
  // for the filename so it's recognizable but short.
  const tidMatch = url.match(/selectedTraceId=([0-9a-fA-F]+)/);
  const tidShort = tidMatch ? tidMatch[1].slice(-8) : `idx${idx + 1}`;

  test(`ax trace ${idx + 1} (${tidShort})`, async ({ page }) => {
    await page.goto(url, { waitUntil: "domcontentloaded" });
    // Wait for the trace detail panel to render. "Trace Tree" is the
    // tab label that appears once the span tree component mounts.
    await page
      .getByText("Trace Tree", { exact: false })
      .first()
      .waitFor({ state: "visible", timeout: 30_000 })
      .catch(() => {});
    await page.waitForTimeout(2500);
    await page.screenshot({
      path: path.join(OUT_DIR!, `ax-${n}-trace-${tidShort}.png`),
      fullPage: true,
    });
  });
}
