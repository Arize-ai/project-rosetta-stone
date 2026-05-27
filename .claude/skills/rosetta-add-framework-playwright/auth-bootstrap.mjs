#!/usr/bin/env node
// One-time AX auth capture for rosetta-pr-screenshots.
//
// Launches a headed Chromium window pointed at app.arize.com. The user logs
// in manually (Google SSO, email/password, whatever AX has configured for
// them). The script watches for the post-login URL pattern and, once it
// matches, writes the browser context's storage state to
// $HOME/.rosetta-stone/ax-auth.json (override with $AX_STORAGE_STATE).
//
// Re-run only when the saved session expires.
//
// Usage:
//   node auth-bootstrap.mjs
//
// Env:
//   AX_STORAGE_STATE   path for the storage state file (default below)
//   AX_LOGIN_URL       starting URL (default https://app.arize.com)

import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import os from "node:os";

const STATE_PATH =
  process.env.AX_STORAGE_STATE ??
  path.join(os.homedir(), ".rosetta-stone", "ax-auth.json");

const LOGIN_URL = process.env.AX_LOGIN_URL ?? "https://app.arize.com";

// Post-login URL patterns AX uses. /organizations/<id>/spaces/<id>/... is the
// canonical landing once the org/space is resolved; some flows redirect via
// /spaces/<id>/ first. Either is fine — by then the auth cookies are set.
const POST_LOGIN_RE = /\/(organizations|spaces)\//;

console.log(`[auth-bootstrap] launching Chromium → ${LOGIN_URL}`);
console.log(`[auth-bootstrap] target storage state: ${STATE_PATH}`);
console.log("");
console.log("→ Log in to Arize AX in the opened browser window.");
console.log("→ This script auto-detects a successful login and saves the session.");
console.log("→ It does NOT close the browser before saving, so you can navigate around.");
console.log("");

const browser = await chromium.launch({ headless: false });
const ctx = await browser.newContext();
const page = await ctx.newPage();

await page.goto(LOGIN_URL, { waitUntil: "domcontentloaded" });

// Wait forever for the URL to settle on a logged-in pattern. The user can
// take as long as they need.
try {
  await page.waitForURL(POST_LOGIN_RE, { timeout: 0 });
} catch (err) {
  console.error(`[auth-bootstrap] aborted: ${err.message}`);
  await browser.close();
  process.exit(1);
}

console.log(`[auth-bootstrap] post-login URL detected: ${page.url()}`);

// The URL changes before the SPA finishes its post-login handshake (writing
// access/refresh tokens to localStorage, populating session cookies). Wait
// for a known authenticated DOM element before saving — the left-nav
// "Tracing Projects" link only renders for an authenticated session.
console.log("[auth-bootstrap] waiting for authenticated UI to render…");
try {
  await page.getByText("Tracing Projects", { exact: false }).first().waitFor({
    state: "visible",
    timeout: 60_000,
  });
} catch (err) {
  console.warn(
    `[auth-bootstrap] couldn't find "Tracing Projects" within 60s — saving anyway: ${err.message}`
  );
}

// Belt-and-braces: a small further pause so deferred localStorage writes
// land (some auth flows refresh tokens shortly after first render).
await page.waitForTimeout(3000);

// Extract org_id / space_id from the URL so callers don't need to hardcode
// or resolve via the SDK. AX URLs are
// /organizations/<org_id>/spaces/<space_id>/...
const urlMatch = page.url().match(/\/organizations\/([^/]+)\/spaces\/([^/?]+)/);
const meta = urlMatch
  ? { ax_org_id: urlMatch[1], ax_space_id: decodeURIComponent(urlMatch[2]) }
  : {};

await mkdir(path.dirname(STATE_PATH), { recursive: true });
await ctx.storageState({ path: STATE_PATH });
console.log(`[auth-bootstrap] saved storage state → ${STATE_PATH}`);

// Sibling meta file for org_id / space_id (so the screenshot orchestrator
// doesn't have to round-trip the Arize SDK).
const metaPath = STATE_PATH.replace(/\.json$/, "-meta.json");
const { writeFile } = await import("node:fs/promises");
await writeFile(metaPath, JSON.stringify(meta, null, 2));
console.log(`[auth-bootstrap] saved meta → ${metaPath}`);
console.log(`   ${JSON.stringify(meta)}`);

await browser.close();
console.log("[auth-bootstrap] done.");
