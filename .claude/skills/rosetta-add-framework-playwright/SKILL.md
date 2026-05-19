---
name: rosetta-add-framework-playwright
description: Run a public-flow Playwright smoke test against a freshly-built framework tier's Next.js frontend. Covers home page rendering + product browsing — the parts that don't require X/Twitter OAuth. The Playwright project (package.json, config, tests) lives inside this skill directory and is checked into the repo. Part of the rosetta-add-framework flow.
---

# Playwright UI smoke

Lightweight UI test covering the public, unauthenticated paths of the Wonder Toys frontend. Authenticated chat flow needs a NextAuth bypass and is out of scope for this skill.

## Inputs

- `FRAMEWORK_DIR` — e.g. `google-adk-py`
- `TIER` — `no-observability` | `phoenix` | `ax` (any tier works; the UI is identical across tiers)
- `BASE_URL` — defaults to `http://localhost:3000`

## Where Playwright lives

The Playwright project is checked into this skill's directory:

```
.claude/skills/rosetta-add-framework-playwright/
├── SKILL.md                    (this file)
├── package.json                Playwright deps
├── package-lock.json
├── playwright.config.ts
└── tests/
    └── public-flow.spec.ts
```

`node_modules/` and `test-results/` are gitignored — see "First-run install" below.

## First-run install

If `.claude/skills/rosetta-add-framework-playwright/node_modules/` doesn't exist (fresh clone or first time running this skill), install:

```bash
SKILL_DIR=/Users/jimbobbennett/github/project-rosetta-stone/.claude/skills/rosetta-add-framework-playwright
cd "$SKILL_DIR"
test -d node_modules || npm install --silent
test -d ~/Library/Caches/ms-playwright || npx playwright install chromium
```

## Run the test

```bash
SKILL_DIR=/Users/jimbobbennett/github/project-rosetta-stone/.claude/skills/rosetta-add-framework-playwright

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

# Run the suite from the skill directory
cd "$SKILL_DIR"
BASE_URL="${BASE_URL:-http://localhost:3000}" npx playwright test --reporter=list
```

Pass criteria: both tests green. Failure modes:
- **Title mismatch** — frontend wasn't built from the canonical source; check for accidental changes to layout.tsx / page.tsx
- **Sign-in prompt missing** — NextAuth config may have shifted; verify the `Sign in with X` button still renders in the auth-gated state
- **Detail page image missing** — `/product/[id]` route was modified or the products.json is missing

## Output

```
PLAYWRIGHT: <TIER>/<FRAMEWORK_DIR>
  tests: <N> passed, <M> failed
  artefacts: .claude/skills/rosetta-add-framework-playwright/playwright-report/ (HTML)
             .claude/skills/rosetta-add-framework-playwright/test-results/ (traces on failure)
```

## Notes

- The Playwright project is **shared across all tiers** and lives inside this skill — bundled as a single unit so the skill is self-contained.
- Tests are deliberately minimal — they catch the most common breakage (frontend accidentally diverged from the source clone) without taking on the auth complexity that would let us test chat directly.
- If a tier customises the frontend in a way that breaks these tests (legitimate UI changes), that's a signal to either update the tests or rethink the change — UI should stay identical across all tiers per project convention.
- `.gitignore` already covers `.claude/skills/rosetta-add-framework-playwright/node_modules/`, `test-results/`, and `playwright-report/`.
