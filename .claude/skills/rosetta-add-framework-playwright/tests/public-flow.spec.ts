import { test, expect } from "@playwright/test";

// Public-flow smoke: the home page and chat are accessible without sign-in.

test("home page renders the shopping assistant", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Wonder Toys/i);
  await expect(
    page.getByRole("heading", { name: /Wonder Toys/i, level: 1 })
  ).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText(/Welcome to Wonder Toys/i)).toBeVisible();
});

test("product detail page is publicly accessible and shows the product image", async ({ page }) => {
  // Product detail pages (`/product/<id>`) are the entry point for shared
  // product links — we hit a known seed product.
  await page.goto("/product/toy-001");
  await expect(page.locator('img[src^="/product-images/"]').first()).toBeVisible({
    timeout: 15_000,
  });
});
