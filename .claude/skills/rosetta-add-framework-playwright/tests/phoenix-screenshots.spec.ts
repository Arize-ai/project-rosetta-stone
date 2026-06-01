import { test } from "@playwright/test";
import path from "node:path";
import fs from "node:fs";

// Captures Phoenix session view + per-trace screenshots.
//
// Driven by env vars from the rosetta-pr-screenshots skill orchestrator:
//   OUT_DIR              absolute path to write PNGs into
//   PHX_SESSION_URL      full Phoenix session URL (built by the orchestrator)
//   PHX_TRACE_URLS       JSON array of trace URLs
//
// Phoenix runs locally on :6006 and has no auth, so no storageState needed.

const OUT_DIR = process.env.OUT_DIR;
const SESSION_URL = process.env.PHX_SESSION_URL;
const TRACE_URLS_JSON = process.env.PHX_TRACE_URLS ?? "[]";

test.skip(!SESSION_URL || !OUT_DIR, "PHX_SESSION_URL or OUT_DIR not set");

test.describe.configure({ timeout: 60_000 });

test.use({ viewport: { width: 1440, height: 900 } });

// Phoenix's tree uses different selectors than AX. We try a few candidates
// in order; the first one that finds collapsed nodes wins. Returns the
// count expanded so callers can loop until quiet.
const EXPAND_JS = `(() => {
  const selectors = [
    'button[aria-expanded="false"][aria-label*="expand" i]',
    'button[aria-expanded="false"][data-cy*="expand"]',
    'button[aria-expanded="false"][title*="expand" i]',
    '[role="button"][aria-expanded="false"]',
  ];
  let total = 0;
  for (const sel of selectors) {
    const btns = Array.from(document.querySelectorAll(sel));
    if (btns.length === 0) continue;
    btns.forEach((b) => b.click());
    total += btns.length;
  }
  return total;
})()`;

async function expandAll(page: import("@playwright/test").Page) {
  for (let i = 0; i < 8; i++) {
    const n = (await page.evaluate(EXPAND_JS)) as number;
    if (!n) break;
    await page.waitForTimeout(400);
  }
}

test.beforeAll(() => {
  if (OUT_DIR) fs.mkdirSync(OUT_DIR, { recursive: true });
});

test("phoenix session view", async ({ page }) => {
  await page.goto(SESSION_URL!, { waitUntil: "domcontentloaded" });
  // Phoenix renders the sidebar nav ("Tracing") immediately and the session
  // content shortly after. Wait for the sidebar then a short settle so the
  // session traces table populates.
  await page
    .getByText("Tracing", { exact: false })
    .first()
    .waitFor({ state: "visible", timeout: 30_000 })
    .catch(() => {});
  await page.waitForTimeout(3000);
  await expandAll(page);
  await page.waitForTimeout(1500);
  await page.screenshot({
    path: path.join(OUT_DIR!, "phoenix-01-session.png"),
    fullPage: true,
  });
});

const traceUrls: string[] = JSON.parse(TRACE_URLS_JSON);

for (const [idx, url] of traceUrls.entries()) {
  const n = String(idx + 2).padStart(2, "0");
  const tidMatch = url.match(/traces\/([0-9a-fA-F]+)/);
  const tidShort = tidMatch ? tidMatch[1].slice(-8) : `idx${idx + 1}`;

  test(`phoenix trace ${idx + 1} (${tidShort})`, async ({ page }) => {
    await page.goto(url, { waitUntil: "domcontentloaded" });
    // The trace detail panel mounts on the right; wait for the "Status"
    // label that's part of its header summary.
    await page
      .getByText("Status", { exact: false })
      .first()
      .waitFor({ state: "visible", timeout: 30_000 })
      .catch(() => {});
    await page.waitForTimeout(2500);
    await page.screenshot({
      path: path.join(OUT_DIR!, `phoenix-${n}-trace-${tidShort}.png`),
      fullPage: true,
    });
  });
}
