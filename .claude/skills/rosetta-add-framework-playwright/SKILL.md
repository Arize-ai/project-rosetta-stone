---
name: rosetta-add-framework-playwright
description: Run a public-flow Playwright smoke test against a freshly-built framework tier's Next.js frontend. Covers home page rendering + product browsing — the parts that don't require X/Twitter OAuth. Sets up Playwright at the repo root on first invocation. Part of the rosetta-add-framework flow.
---

# Playwright UI smoke

Lightweight UI test covering the public, unauthenticated paths of the Wonder Toys frontend. Authenticated chat flow needs a NextAuth bypass and is out of scope for this skill.

## Inputs

- `FRAMEWORK_DIR` — e.g. `google-adk-py`
- `TIER` — `no-observability` | `phoenix` | `ax` (any tier works; the UI is identical across tiers)
- `BASE_URL` — defaults to `http://localhost:3000`

## One-time setup

If `playwright/` doesn't exist at the repo root, create it:

```bash
mkdir -p /Users/jimbobbennett/github/project-rosetta-stone/playwright/tests
cd /Users/jimbobbennett/github/project-rosetta-stone/playwright
cat > package.json <<'JSON'
{
  "name": "rosetta-playwright",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "test": "playwright test"
  },
  "devDependencies": {
    "@playwright/test": "^1.49.0"
  }
}
JSON

cat > playwright.config.ts <<'TS'
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,        // serial — only one Next.js dev server at a time
  retries: 0,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: process.env.BASE_URL ?? "http://localhost:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
});
TS

cat > tests/public-flow.spec.ts <<'TS'
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
TS

cd /Users/jimbobbennett/github/project-rosetta-stone/playwright
npm install --silent
npx playwright install chromium
```

(Verify by `ls playwright/` — it should have `package.json`, `playwright.config.ts`, `tests/`, `node_modules/`.)

## Run the test

```bash
# Boot the framework's Next.js dev server if not already running.
# Prereq: `npm install` must have run in $TIER/$FRAMEWORK_DIR already (the
# tier-build skill does this in step 6). Without node_modules, npx next dev
# fails with "couldn't find next/package.json".
if ! curl -sf http://localhost:3000/ > /dev/null 2>&1; then
  cd "/Users/jimbobbennett/github/project-rosetta-stone/$TIER/$FRAMEWORK_DIR"
  test -d node_modules || { echo "node_modules missing — run tier-build's step 6 first"; exit 1; }
  npm run dev > /tmp/rosetta-playwright-dev.log 2>&1 &
  DEV_PID=$!
  until curl -sf http://localhost:3000/ > /dev/null 2>&1; do
    # Catch the Turbopack-root failure mode and surface it loudly — the
    # tier-build skill should have already added turbopack.root to
    # next.config.ts; this is a defensive check.
    if grep -q "Turbopack build failed" /tmp/rosetta-playwright-dev.log 2>/dev/null; then
      echo "Next.js failed to start — likely missing turbopack.root in next.config.ts."
      echo "See tier-build skill step 2b. Tail of dev log:"
      tail -20 /tmp/rosetta-playwright-dev.log
      exit 1
    fi
    if ! kill -0 $DEV_PID 2>/dev/null; then
      echo "dev script died:"; tail -20 /tmp/rosetta-playwright-dev.log; exit 1
    fi
    sleep 2
  done
fi

# Run the suite
cd /Users/jimbobbennett/github/project-rosetta-stone/playwright
BASE_URL="${BASE_URL:-http://localhost:3000}" npx playwright test --reporter=list
```

Pass criteria: both tests green. Failure modes:
- **Title mismatch** — frontend wasn't built from the canonical source; check for accidental changes to layout.tsx / page.tsx
- **No product images** — ChromaDB indexing failed or `/api/products/featured` is erroring; check `/tmp/rosetta-playwright-dev.log`
- **Detail page 404** — `/product/[id]` route was modified or the products.json is missing

## Output

```
PLAYWRIGHT: <TIER>/<FRAMEWORK_DIR>
  tests: <N> passed, <M> failed
  artefacts: playwright/playwright-report/ (HTML), playwright/test-results/ (traces on failure)
```

## Notes

- The Playwright project is **shared across all tiers** at the repo root. It's pinned via its own `package.json` so it doesn't pollute any individual tier's deps.
- Tests are deliberately minimal — they catch the most common breakage (frontend got accidentally diverged from the source clone) without taking on the auth complexity that would let us test chat directly.
- If a tier customises the frontend in a way that breaks these tests (legitimate UI changes), that's a signal to either update the tests or rethink the change — UI should stay identical across all tiers per project convention.
- Add `playwright/node_modules/` and `playwright/playwright-report/` and `playwright/test-results/` to `.gitignore` after first setup.
