---
name: rosetta-test
description: End-to-end test a Rosetta Stone framework × platform combination. Provisions a fresh isolated project on Arize AX or Phoenix, generates 25 synthetic traces, runs the 6 evals, verifies every trace was evaluated, then deletes the project. Trigger when the user asks to "test the <framework> <platform> project", "run e2e on <framework> <platform>", "verify <framework> works on <platform>", or any similar phrasing. Frameworks and platforms are discovered from the directory layout — no hardcoded list, so this works for any new framework added under ax/ or phoenix/.
---

# Rosetta Stone End-to-End Test

Orchestrates a full lifecycle test of one framework × platform combination from this repo.

## Inputs

Parse from the user's invocation:

- `<framework>` — e.g. `mastra`, `langchain-py`, `microsoft-agent-py`, `vercel-ai-sdk`, or any new framework directory
- `<platform>` — `ax` or `phoenix`
- `--keep` (optional) — skip the cleanup phase so the project remains for inspection

The skill is **generic**: it never hardcodes the framework list. New frameworks added to `ax/` or `phoenix/` work automatically as long as they follow the existing convention.

## Convention contract

A `<platform>/<framework>/` directory is testable if:

1. It exists.
2. Its `package.json` defines `synthetic-requests` as an npm script.
3. For `phoenix` only: `package.json` also defines `evals`.

Validate this before doing anything else. Abort early with a clear error if violated — list the directories that *are* available under that platform so the user can correct typos.

## Phases

Execute in order. Each phase has a dedicated skill file with the detailed steps — read it and follow.

1. **Setup** — `.claude/skills/rosetta-test-setup/SKILL.md`
   Validates the target dir + credentials, mints a unique project name, writes a `.env.test-local` overlay, pre-creates the AX project (Phoenix auto-creates on first trace).

2. **Traces** — `.claude/skills/rosetta-test-traces/SKILL.md`
   Runs `npm run synthetic-requests` with the env overlay loaded.

3. **Evals** — `.claude/skills/rosetta-test-evals/SKILL.md`
   Phoenix: runs `npm run evals`.
   AX: ensures shared `rosetta-e2e-*` evaluators exist (creates only the missing ones), then creates and triggers a per-run task scoped to the new project.

4. **Verify** — `.claude/skills/rosetta-test-verify/SKILL.md`
   Asserts 25 root traces exist and every trace has every applicable eval annotation. Reports pass/fail with details. Eval score values are not checked — only presence.

5. **Cleanup** — `.claude/skills/rosetta-test-cleanup/SKILL.md`
   Always runs (success or failure), **unless** the user passed `--keep`. Deletes the platform project and removes `.env.test-local`. If a prior phase aborted, still attempt cleanup.

## State to thread through phases

Setup emits these and every later phase needs them:

- `PROJECT_NAME` — the unique name (`rosetta-e2e-<framework>-<YYYYMMDDHHMM>-<rand4>`)
- `PROJECT_DIR` — absolute path to `<platform>/<framework>/`
- `PLATFORM` — `ax` or `phoenix`
- `ENV_OVERLAY` — absolute path to `<PROJECT_DIR>/.env.test-local`
- For AX: `ARIZE_SPACE_ID` (resolved from `.env.local`)

Carry these forward when invoking subsequent phases. Print them at the start of the run so the user can manually resume if something breaks.

## Failure handling

- Setup failure → no cleanup needed (nothing was created).
- Traces / Evals / Verify failure → still run cleanup unless `--keep`.
- Verify failure with `--keep` → leave the project so the user can inspect it in the UI.

Report verify results before invoking cleanup so the user sees the truth even if deletion succeeds.

## Output

End-of-run summary:

```
Rosetta E2E: <framework> on <platform>
  Project:  <PROJECT_NAME>
  Traces:   <count> / 25
  Evals:    <coverage report>
  Result:   PASS | FAIL
  Cleanup:  deleted | kept (--keep)
```
