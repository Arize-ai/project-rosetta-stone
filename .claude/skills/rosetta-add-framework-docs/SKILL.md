---
name: rosetta-add-framework-docs
description: Finalise a newly-added framework — updates the README's supported-frameworks table, directory tree, and per-framework "what differs" section, marks off the framework in the orchestrator skill's embedded TODO, commits per tier, and raises a PR. Part of the rosetta-add-framework flow.
---

# Finalise + commit + PR

Last phase of `rosetta-add-framework`. Updates docs, commits, raises a PR.

## Inputs

- `FRAMEWORK` — slug (e.g. `google-adk`)
- `FRAMEWORK_DIR` — directory name (e.g. `google-adk-py`)
- `LANGUAGE` — `py` or `ts`
- `FRAMEWORK_DISPLAY` — human-readable name (e.g. "Google ADK")
- `FRAMEWORK_HOMEPAGE` — URL for the README link (e.g. `https://google.github.io/adk-docs/`)
- `MODEL_OVERRIDE` (optional) — note if the framework needs a non-default Claude model
- `SESSION_TAGGING` — `auto` | `via-using-session` — for the PR description

## Steps

### 1. README — supported-frameworks table

Edit `/Users/jimbobbennett/github/project-rosetta-stone/README.md`. Find the **Supported frameworks** table and insert a new row alphabetically.

```markdown
| [<FRAMEWORK_DISPLAY>](<FRAMEWORK_HOMEPAGE>) | ✅ | — |
```

(Use `✅`/`—` based on `LANGUAGE`. Python frameworks: `✅` in Python column, `—` in TypeScript. Vice versa for TS.)

### 2. README — directory tree

Find the three tier blocks under "## What's in the box". Insert the new framework alphabetically in each:

```
│   ├── <FRAMEWORK_DIR>/         <FRAMEWORK_DISPLAY> (Python + Next.js)
```

(Indent and spacing must match the surrounding lines — copy an existing line and edit.)

### 3. README — Frameworks comparison table

Find the **Frameworks** comparison table. Insert a new row alphabetically:

```markdown
| **<FRAMEWORK_DISPLAY>** | <agent library> | <LLM client> | <streaming API> | Python FastAPI backend + Next.js frontend |
```

Source the four cell values from the research phase notes. Keep concise — one phrase per cell, code-fenced for class/function names.

### 4. README — "what differs between tiers"

Find "## What changes between tiers?" and insert a new section alphabetically:

```markdown
For **<FRAMEWORK_DISPLAY>**, only these files differ:

- `backend/tracing.py` — tracing initialization (new file, imported before `<framework>`)<inline note about any quirk: register vs manual TracerProvider, instrument_all, etc.>
- `backend/main.py` — imports `backend.tracing` before other backend modules
- `backend/requirements.txt` — observability packages (`arize-phoenix-otel` or `arize-otel` + `openinference-instrumentation-<framework>`)
- `env.example` — observability environment variables
```

### 5. Orchestrator TODO snapshot

Edit `/Users/jimbobbennett/github/project-rosetta-stone/.claude/skills/rosetta-add-framework/SKILL.md`. Find the framework's `[ ]` line in the TODO section and change it to `[x]`. Update the "last refreshed" date at the top of the TODO section.

### 6. Save framework gotchas to memory

For each non-obvious thing discovered (model override, manual tracer-provider, instrument_all, session caveat, eval extractor mismatch), save a memory entry:

- type: `project`
- name: `framework_<framework>_<aspect>` (e.g. `framework_crewai_strict_tools`, `framework_pydantic_ai_instrument_all`)
- body: lead with the fact, then **Why:** and **How to apply:** lines per the auto-memory `<body_structure>` rules

These accumulate over time as more frameworks are added — making each new addition faster.

### 7. Commit per tier + push + PR

```bash
cd /Users/jimbobbennett/github/project-rosetta-stone
BRANCH="feat/add-<FRAMEWORK>"
git checkout -b "$BRANCH"

# Stage and commit each tier separately so reviewers see the progression
git add no-observability/<FRAMEWORK_DIR>/
git commit -m "$(cat <<EOF
Add <FRAMEWORK_DISPLAY> — no-observability tier

<one paragraph: framework API choice, streaming approach, any model override>

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"

git add phoenix/<FRAMEWORK_DIR>/
git commit -m "$(cat <<EOF
Add <FRAMEWORK_DISPLAY> — Phoenix tier

<one paragraph: tracing pattern, any session.id wrap>

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"

git add ax/<FRAMEWORK_DIR>/
git commit -m "$(cat <<EOF
Add <FRAMEWORK_DISPLAY> — AX tier

<one paragraph: tracing pattern>

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"

git add README.md .claude/skills/rosetta-add-framework/SKILL.md
# Stage Playwright setup if this was the first framework to add it
[ -f playwright/package.json ] && git status --short playwright/ | grep -q '?? playwright/' && git add playwright/

git commit -m "$(cat <<EOF
Document <FRAMEWORK_DISPLAY> in README + mark off in TODO

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"

git push -u origin "$BRANCH"
```

### 8. Open the PR

```bash
gh pr create --title "Add <FRAMEWORK_DISPLAY>" --body "$(cat <<EOF
## Summary

- New tiers: \`no-observability/<FRAMEWORK_DIR>/\`, \`phoenix/<FRAMEWORK_DIR>/\`, \`ax/<FRAMEWORK_DIR>/\` running the identical Wonder Toys agent
- README updated: supported-frameworks table, directory tree, frameworks comparison, what-differs section
- TODO marked off in the rosetta-add-framework orchestrator skill
- <any framework-specific notes: model override, manual tracer-provider, session.id wrap, etc.>

## Verification

- [x] no-observability: lint + smoke chat + multi-turn history confirmed
- [x] phoenix: trace lands in \`wonder-toys-<framework>\` project; 25 synthetic requests + evals harness green
- [x] ax: trace lands in configured AX project; 25 synthetic requests green
- [x] session.id: <auto-tagged | tagged via \`using_session(user_id)\` wrap in agent.py>
- [x] Playwright public-flow smoke green

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

## Output

```
PR opened: <URL>
  branch: feat/add-<FRAMEWORK>
  commits: 4 (no-obs, phoenix, ax, docs)
  README updated: supported-frameworks, tree, frameworks-table, what-differs
  TODO marked off in orchestrator skill
  Memory saved: <count> framework gotchas
```
