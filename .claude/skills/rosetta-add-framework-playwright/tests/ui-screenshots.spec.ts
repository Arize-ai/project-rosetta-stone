import { test, expect } from "@playwright/test";
import path from "node:path";
import fs from "node:fs";

// Captures Wonder Toys app UI screenshots: landing page + a product detail
// page. Both are public (no NextAuth gate), so no storageState needed.
//
// Driven by env vars from the rosetta-pr-screenshots skill orchestrator:
//   OUT_DIR              absolute path to write PNGs into
//   UI_BASE_URL          Next.js base URL (e.g. http://localhost:3010)
//   UI_PRODUCT_ID        product slug for the detail screenshot (default toy-001)

const OUT_DIR = process.env.OUT_DIR;
const BASE_URL = process.env.UI_BASE_URL;
const PRODUCT_ID = process.env.UI_PRODUCT_ID ?? "toy-001";

test.skip(!BASE_URL || !OUT_DIR, "UI_BASE_URL or OUT_DIR not set");

test.use({
  baseURL: BASE_URL,
  viewport: { width: 1440, height: 900 },
});

test.beforeAll(() => {
  if (OUT_DIR) fs.mkdirSync(OUT_DIR, { recursive: true });
});

test("ui landing page", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await expect(
    page.getByRole("heading", { name: /Wonder Toys/i, level: 1 })
  ).toBeVisible({ timeout: 15_000 });
  await page.screenshot({
    path: path.join(OUT_DIR!, "ui-01-landing.png"),
    fullPage: true,
  });
});

test("ui product detail page", async ({ page }) => {
  await page.goto(`/product/${PRODUCT_ID}`, { waitUntil: "networkidle" });
  await expect(
    page.locator('img[src^="/product-images/"]').first()
  ).toBeVisible({ timeout: 15_000 });
  await page.screenshot({
    path: path.join(OUT_DIR!, "ui-02-product.png"),
    fullPage: true,
  });
});
