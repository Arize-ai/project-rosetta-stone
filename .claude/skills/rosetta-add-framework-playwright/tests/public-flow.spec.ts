import { test, expect } from "@playwright/test";

// Public-flow smoke: anything that doesn't require NextAuth.
// The home page gates featured products + chat behind X/Twitter sign-in,
// so we can only verify the unauthenticated landing renders.

test("unauthenticated landing renders sign-in prompt", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Wonder Toys/i);
  await expect(
    page.getByRole("heading", { name: /Wonder Toys/i, level: 1 })
  ).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText(/Sign in to start shopping/i)).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Sign in with X/i })
  ).toBeVisible();
});

test("product detail page is publicly accessible and shows the product image", async ({ page }) => {
  // Product detail pages (`/product/<id>`) are the entry point for shared
  // product links — they don't require auth. We hit a known seed product.
  await page.goto("/product/toy-001");
  await expect(page.locator('img[src^="/product-images/"]').first()).toBeVisible({
    timeout: 15_000,
  });
});
