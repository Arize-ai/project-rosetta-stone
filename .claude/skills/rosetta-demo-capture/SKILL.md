---
name: rosetta-demo-capture
description: Record a full Wonder Toys demo by running a canned 3-turn conversation (search dragons → buy plushie → ship), then opening Arize AX in Safari and screenshotting the session view plus every trace in it. Use when the user asks to "capture a demo", "record screenshots of an Arize session", "demo the agent flow", or any similar phrasing. macOS only — uses AppleScript and `screencapture`.
---

# Rosetta Demo Capture

End-to-end: boot a framework's backend, drive it through a canned multi-turn purchase flow, then capture the resulting session + traces in the Arize AX UI.

## Inputs

- `<framework>` — directory under `ax/` (e.g. `crewai-py`, `pydantic-ai-py`, `microsoft-agent-py`)
- `--output-dir <dir>` (optional) — screenshot destination. Default: `./demo-screenshots/<framework>-<YYYYMMDD-HHMMSS>/`
- `--user-id <id>` (optional) — session ID to use. Default: `demo-<YYYYMMDD-HHMMSS>-<rand4>`.

## Required setup

- macOS with Safari installed
- User already signed into Arize in Safari (the skill can't handle the login flow)
- **Safari → Settings → Advanced → "Show features for web developers"** enabled, then **Safari → Settings → Developer → "Allow JavaScript from Apple Events"** enabled. The skill uses `osascript … do JavaScript` to expand the session's trace tree before screenshotting. Without this, the session screenshot will show collapsed traces (still useful, just less detail).
- Framework's `agent.py` must tag spans with `session.id` (typically via OpenInference's `using_session(user_id)` wrap around the agent run). Without this, the session URL won't have anything to show. This is a per-framework responsibility — the skill assumes it's already in place. If the session screenshot comes out empty, that's the framework's bug, not the skill's.

The Arize `org_id` is needed for URL construction but is auto-resolved at runtime via the Arize SDK — no manual setup required.

## Steps

### 1. Validate inputs

```bash
PROJECT_DIR="$(pwd)/ax/<framework>"
test -d "$PROJECT_DIR" || { echo "No such directory: $PROJECT_DIR"; exit 1; }
test -f "$PROJECT_DIR/.env.local" || { echo "missing .env.local"; exit 1; }

# Source env so we have ARIZE_SPACE_ID, ARIZE_API_KEY, ARIZE_PROJECT_NAME
set -a; source "$PROJECT_DIR/.env.local"; set +a

# Resolve org_id via the Arize SDK (the ax CLI doesn't expose `organizations`
# yet, but the underlying Python SDK does). If the user has multiple orgs,
# pick the one that owns ARIZE_SPACE_ID — for most users there's only one.
ARIZE_ORG_ID=$(python3 -c "
import os
from arize import ArizeClient
orgs = ArizeClient().organizations.list().organizations
# Single-org users: just take the first. Multi-org users: take the one that owns the space.
if len(orgs) == 1:
    print(orgs[0].id)
else:
    space_id = os.environ['ARIZE_SPACE_ID']
    c = ArizeClient()
    for o in orgs:
        if any(s.id == space_id for s in c.spaces.list(organization_id=o.id).spaces):
            print(o.id); break
" 2>/dev/null)
[ -n "$ARIZE_ORG_ID" ] || { echo "couldn't resolve ARIZE_ORG_ID via the SDK — check API key permissions"; exit 1; }
echo "org_id: $ARIZE_ORG_ID"
```

### 2. Mint a session ID

```bash
SESSION_ID="${USER_ID:-demo-$(date -u +%Y%m%d-%H%M%S)-$(openssl rand -hex 2)}"
OUT_DIR="${OUTPUT_DIR:-./demo-screenshots/<framework>-$(date -u +%Y%m%d-%H%M%S)}"
mkdir -p "$OUT_DIR"
echo "session_id: $SESSION_ID"
echo "output_dir: $OUT_DIR"
```

### 3. Start the backend if needed

The backend listens on `:8001`. If it's already up, reuse it (faster). If not, start it via `npm run dev` (the canonical entry — also brings up ChromaDB).

```bash
if curl -sf http://127.0.0.1:8001/products/featured > /dev/null 2>&1; then
  echo "backend already running"
else
  cd "$PROJECT_DIR"
  npm run dev > /tmp/rosetta-demo-dev.log 2>&1 &
  DEV_PID=$!
  echo "started npm run dev (pid $DEV_PID)"
  until curl -sf http://127.0.0.1:8001/products/featured > /dev/null 2>&1; do
    if ! kill -0 $DEV_PID 2>/dev/null; then
      echo "dev script died — see /tmp/rosetta-demo-dev.log"
      tail -30 /tmp/rosetta-demo-dev.log
      exit 1
    fi
    sleep 2
  done
fi
```

### 4. Send the 3-turn canned conversation

All three turns share the same `x-user-id` header so they land in one session. The frontend convention is to send the full prior message history on each turn — the backend extracts only the last user message and relies on its own per-user history store. We follow that convention here.

The chat endpoint streams SSE. Parse `data: {"text":"..."}` lines to reconstruct the assistant's reply for the next turn's `messages` payload.

```bash
BACKEND="http://127.0.0.1:8001"

# Helper: send one turn, return assistant text
send_turn () {
  local body="$1"
  curl -sN -X POST "$BACKEND/chat" \
    -H "Content-Type: application/json" \
    -H "x-user-id: $SESSION_ID" \
    -d "$body" \
    --max-time 120 \
  | awk -F 'data: ' '
      /^data: \[DONE\]/ { exit }
      /^data: \{/ {
        line=$2
        # naive JSON extract of the "text" value — good enough for {"text":"..."}
        if (match(line, /"text":"/)) {
          rest = substr(line, RSTART+8)
          # strip trailing "}
          if (match(rest, /"\}$/)) rest = substr(rest, 1, RSTART-1)
          # unescape common sequences
          gsub(/\\n/, "\n", rest)
          gsub(/\\"/, "\"", rest)
          printf "%s", rest
        }
      }
    '
}

# Turn 1: search
TURN_1_USER="Show me dragon toys"
MSGS_1=$(jq -n --arg u "$TURN_1_USER" '{messages:[{role:"user",content:$u}]}')
echo "▶ turn 1: $TURN_1_USER"
RESP_1=$(send_turn "$MSGS_1")
echo "  ← assistant: ${RESP_1:0:120}…"

# Turn 2: buy
TURN_2_USER="I'd like to buy the plush one"
MSGS_2=$(jq -n \
  --arg u1 "$TURN_1_USER" --arg a1 "$RESP_1" --arg u2 "$TURN_2_USER" \
  '{messages:[
    {role:"user",content:$u1},
    {role:"assistant",content:$a1},
    {role:"user",content:$u2}
  ]}')
echo "▶ turn 2: $TURN_2_USER"
RESP_2=$(send_turn "$MSGS_2")
echo "  ← assistant: ${RESP_2:0:120}…"

# Turn 3: ship
TURN_3_USER="Ship it to John Smith, 123 Dragon Lane, Springfield, IL 62701, US"
MSGS_3=$(jq -n \
  --arg u1 "$TURN_1_USER" --arg a1 "$RESP_1" \
  --arg u2 "$TURN_2_USER" --arg a2 "$RESP_2" --arg u3 "$TURN_3_USER" \
  '{messages:[
    {role:"user",content:$u1},
    {role:"assistant",content:$a1},
    {role:"user",content:$u2},
    {role:"assistant",content:$a2},
    {role:"user",content:$u3}
  ]}')
echo "▶ turn 3: $TURN_3_USER"
RESP_3=$(send_turn "$MSGS_3")
echo "  ← assistant: ${RESP_3:0:120}…"

# Record the time window for AX URLs (epoch ms, ±5 min around the run)
START_MS=$(($(date +%s) * 1000 - 600000))   # 10 min before now
END_MS=$(($(date +%s) * 1000 + 60000))      # 1 min from now
```

### 5. Wait for trace ingestion

AX batches and sends asynchronously. 30s is usually enough; bump to 60s on slow connections.

```bash
echo "waiting 45s for AX ingestion…"
sleep 45
```

### 6. Resolve project ID and trace IDs

The base64 `project_id` is needed for the URL. Get it from the project list:

```bash
PROJECT_ID=$(ax projects list --space "$ARIZE_SPACE_ID" --limit 100 --output csv 2>/dev/null \
  | awk -F',' -v name="$ARIZE_PROJECT_NAME" '$2 == name {print $1; exit}')
[ -n "$PROJECT_ID" ] || { echo "couldn't resolve project '$ARIZE_PROJECT_NAME' to a base64 ID"; exit 1; }
echo "project_id: $PROJECT_ID"
```

Trace IDs in the session — fetch via the CLI, filtered by session.id (using a wide time window because session.id query isn't direct):

```bash
mkdir -p .arize-tmp-traces
ax traces list "$PROJECT_ID" \
  --space "$ARIZE_SPACE_ID" \
  --start-time "$(python3 -c "import datetime,sys; print((datetime.datetime.fromtimestamp($START_MS/1000, datetime.timezone.utc)).strftime('%Y-%m-%dT%H:%M:%SZ'))")" \
  --end-time   "$(python3 -c "import datetime,sys; print((datetime.datetime.fromtimestamp($END_MS/1000, datetime.timezone.utc)).strftime('%Y-%m-%dT%H:%M:%SZ'))")" \
  --limit 50 --output .arize-tmp-traces/demo-session.json > /dev/null 2>&1

TRACE_IDS=$(python3 -c "
import json
data = json.load(open('.arize-tmp-traces/demo-session.json'))
spans = data.get('spans', data) if isinstance(data, dict) else data
seen = []
for s in spans:
    if s.get('attributes', {}).get('session.id') != '$SESSION_ID':
        continue
    tid = s.get('context', {}).get('trace_id')
    if tid and tid not in seen:
        seen.append(tid)
print(' '.join(seen))
")
echo "trace IDs in session: $TRACE_IDS"
[ -n "$TRACE_IDS" ] || { echo "no traces found with session.id=$SESSION_ID — did the framework's agent.py wrap kickoff in using_session()?"; exit 1; }
```

### 7. Open Arize, expand the trace tree, screenshot the session

Build the session URL using the templates from the `arize-link` skill, then drive Safari. The trick: target the **Arize window specifically** by URL pattern — if the user has multiple Safari windows, the front one might be unrelated. Then raise that window via System Events, run JS to expand all collapsed trace nodes, and screencap by bounds.

```bash
SESSION_URL="https://app.arize.com/organizations/$ARIZE_ORG_ID/spaces/$ARIZE_SPACE_ID/projects/$PROJECT_ID?selectedSessionId=$SESSION_ID&queryFilterA=&selectedTab=llmTracing&timeZoneA=America%2FLos_Angeles&startA=$START_MS&endA=$END_MS&envA=tracing&modelType=generative_llm"

# Find an existing Arize Safari window, or open new. Then load the session URL,
# raise the window to the front, expand the tree, and capture.
osascript <<APPLESCRIPT
tell application "Safari"
  activate
  set arizeWin to missing value
  repeat with w in windows
    try
      if URL of (current tab of w) contains "app.arize.com" then
        set arizeWin to w
        exit repeat
      end if
    end try
  end repeat
  if arizeWin is missing value then
    set arizeWin to make new document
  end if
  set URL of current tab of arizeWin to "$SESSION_URL"
  set index of arizeWin to 1
end tell
delay 1
tell application "System Events"
  set frontmost of process "Safari" to true
end tell
APPLESCRIPT

echo "waiting for Arize SPA to render…"
sleep 8   # bump if the network is slow

# Expand all collapsed trace accordions in the right-hand "Session Conversation"
# popover via JS. Selector is `button.ac-accordion-trigger[aria-expanded="false"]`
# (the per-trace accordion toggles in the session panel — NOT the left "3 traces"
# tree, which has its own `button[data-testid="expand-trace-button"]`).
# These toggles have proper aria-expanded state so we can click only collapsed
# ones in a loop (re-rendering may reveal nested accordions later).
osascript <<'APPLESCRIPT' > /dev/null
tell application "Safari"
  set arizeWin to missing value
  repeat with w in windows
    try
      if URL of (current tab of w) contains "app.arize.com" then
        set arizeWin to w
        exit repeat
      end if
    end try
  end repeat
  set jsExpand to "var btns = Array.from(document.querySelectorAll('button.ac-accordion-trigger[aria-expanded=\"false\"]')); btns.forEach(function(b){b.click();}); String(btns.length);"
  repeat 5 times
    set nStr to (do JavaScript jsExpand in current tab of arizeWin) as text
    if (nStr as integer) is 0 then exit repeat
    delay 0.5
  end repeat
end tell
APPLESCRIPT
sleep 3   # let the expanded tree render

# Capture by window bounds (Safari's `id of front window` returns an
# AppleScript window number, not a CGWindowID, so `screencapture -l` fails.
# `-R x,y,w,h` from the bounds works.)
BOUNDS=$(osascript -e 'tell application "Safari" to get bounds of front window')
X=$(echo "$BOUNDS" | awk -F', ' '{print $1}')
Y=$(echo "$BOUNDS" | awk -F', ' '{print $2}')
X2=$(echo "$BOUNDS" | awk -F', ' '{print $3}')
Y2=$(echo "$BOUNDS" | awk -F', ' '{print $4}')
W=$((X2 - X))
H=$((Y2 - Y))
screencapture -o -R "$X,$Y,$W,$H" "$OUT_DIR/01-session-tree.png"
echo "saved: $OUT_DIR/01-session-tree.png"
```

### 8. Screenshot each trace

```bash
i=2
for tid in $TRACE_IDS; do
  TRACE_URL="https://app.arize.com/organizations/$ARIZE_ORG_ID/spaces/$ARIZE_SPACE_ID/projects/$PROJECT_ID?selectedTraceId=$tid&queryFilterA=&selectedTab=llmTracing&timeZoneA=America%2FLos_Angeles&startA=$START_MS&endA=$END_MS&envA=tracing&modelType=generative_llm"
  osascript <<APPLESCRIPT
tell application "Safari"
  activate
  set URL of current tab of front window to "$TRACE_URL"
end tell
APPLESCRIPT
  sleep 6
  WID=$(osascript -e 'tell application "Safari" to id of front window')
  screencapture -o -l "$WID" "$OUT_DIR/$(printf '%02d' $i)-trace-$tid.png"
  echo "saved: $OUT_DIR/$(printf '%02d' $i)-trace-$tid.png"
  i=$((i+1))
done
```

### 9. Summary

Print the captured paths and the Arize URLs (for easy re-opening) on completion:

```
Demo capture complete
  session.id: <SESSION_ID>
  output:     <OUT_DIR>
  session URL: <SESSION_URL>
  trace URLs:
    - <TRACE_URL_1>
    - <TRACE_URL_2>
    ...
```

## Edge cases & failure modes

| Symptom | Likely cause | Fix |
|---|---|---|
| "couldn't resolve ARIZE_ORG_ID" | API key lacks permission OR org list is empty | Verify the key in `ax api-keys list`; check `python3 -c "from arize import ArizeClient; print(ArizeClient().organizations.list())"` |
| Empty `TRACE_IDS` | Framework's `agent.py` doesn't tag spans with `session.id` | Fix the framework, not the skill. Add `using_session(user_id)` (or equivalent) wrap around the agent run. CrewAI shows the pattern. |
| Safari shows login page | User isn't logged into Arize | Have them log in manually first; rerun |
| Screenshot is the wrong window | Another app stole focus between `osascript activate` and `screencapture` | Don't touch the machine during capture |
| "couldn't resolve project" | Project name has special chars / doesn't match | Check `ARIZE_PROJECT_NAME` in `.env.local` vs `ax projects list --output csv` |
| Trace page shows "no recent data" | `startA`/`endA` window missed the trace | Widen `START_MS`/`END_MS`; the skill uses ±10 min by default |

## Cleanup

The skill leaves the backend running on `:8001` so the user can keep playing. If they want it shut down:

```bash
lsof -ti :3000 :8001 :8000 | xargs -r kill
```

Also `.arize-tmp-traces/demo-session.json` is left for inspection — safe to delete.

## Why Safari specifically?

AppleScript dialect targets `tell application "Safari"`. Chrome/Firefox have AppleScript dictionaries too, but Safari's `id of front window` returning a valid CGWindowID is the cleanest path to `screencapture -l` without Accessibility permissions. If the user insists on another browser, the skill needs a different window-finding strategy (`screencapture -x` whole-screen is the easy fallback).
