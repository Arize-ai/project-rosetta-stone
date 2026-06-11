"""Synthetic voice harness for the openai-voice tier.

Sends every MP3 in evals/voice-prompts/ through the running Python backend's
WebSocket voice endpoint, the same path a real browser microphone uses.
Each prompt becomes one voice session in Phoenix / Arize AX with the full
`session.lifecycle` → `input.audio` / `llm.tool` / `output.audio` trace tree.

Prerequisites:
    1. Start the app: npm run dev  (in phoenix/openai-voice or ax/openai-voice)
    2. MP3 prompts exist at evals/voice-prompts/*.mp3 (run
       generate-voice-prompts.py once to create them).

Usage (typically via the bash wrapper):
    EVAL_BASE_URL=http://localhost:3000 \\
    BACKEND_URL=http://localhost:8001 \\
    BACKEND_SECRET=... \\
    python evals/run-voice-requests.py

Env vars:
    BACKEND_URL          HTTP backend URL (default http://localhost:8001).
                         The WS URL is derived by swapping http→ws and
                         appending /voice.
    BACKEND_SECRET       Token passed as ?token=… on the WS upgrade.
    VOICE_PROMPT_DIR     Override the prompts directory (default
                         evals/voice-prompts relative to this file).
    EVAL_USER_ID         User ID used for the voice session
                         (default: voice-eval-user-001).
"""

from __future__ import annotations

import asyncio
import base64
import json
import os
import sys
import time
from pathlib import Path

import websockets
from pydub import AudioSegment

BACKEND_URL = os.environ.get("BACKEND_URL", "http://localhost:8001")
BACKEND_SECRET = os.environ.get("BACKEND_SECRET", "")
USER_ID = os.environ.get("EVAL_USER_ID", "voice-eval-user-001")

PROMPT_DIR = Path(
    os.environ.get(
        "VOICE_PROMPT_DIR",
        str(Path(__file__).parent / "voice-prompts"),
    )
)

# OpenAI Realtime expects 24kHz mono PCM16
SAMPLE_RATE = 24_000
CHUNK_MS = 50  # 50 ms per chunk → 1200 frames → 2400 bytes
BYTES_PER_CHUNK = int(SAMPLE_RATE * (CHUNK_MS / 1000) * 2)


def ws_url() -> str:
    base = BACKEND_URL.replace("http://", "ws://").replace("https://", "wss://")
    return (
        f"{base}/voice?token={BACKEND_SECRET}&user_id={USER_ID}"
    )


def load_pcm16(path: Path) -> bytes:
    """Decode an MP3 to little-endian PCM16, 24kHz, mono."""
    audio = (
        AudioSegment.from_mp3(path)
        .set_frame_rate(SAMPLE_RATE)
        .set_channels(1)
        .set_sample_width(2)
    )
    return audio.raw_data


async def replay_prompt(mp3: Path, index: int, total: int) -> dict:
    label = f"[{index:02d}/{total:02d}] {mp3.stem}"
    print(f"\n{'═' * 70}")
    print(label)
    print("─" * 70)

    pcm = load_pcm16(mp3)
    duration_s = len(pcm) / (SAMPLE_RATE * 2)
    print(f"  audio: {duration_s:.1f}s ({len(pcm):,} bytes PCM16)")

    result = {
        "prompt": mp3.stem,
        "user_transcript": "",
        "assistant_transcript": "",
        "tool_calls": [],
        "error": None,
        "elapsed_s": 0.0,
    }

    start = time.monotonic()
    try:
        async with websockets.connect(ws_url(), max_size=16 * 1024 * 1024) as ws:
            # Wait for session.ready (sometimes preceded by session.created
            # forwards from OpenAI, which we ignore).
            for _ in range(20):
                msg = json.loads(await asyncio.wait_for(ws.recv(), timeout=15))
                if msg.get("type") == "session.ready":
                    break
                if msg.get("type") == "error":
                    raise RuntimeError(msg.get("message", "unknown error"))

            # Stream the audio in 50ms chunks, paced to real time so the
            # server-side VAD behaves like it would for a real speaker.
            # We append trailing silence in _send_audio so VAD reliably
            # fires the end-of-turn and auto-creates the response — no
            # explicit audio.commit is needed (and sending one would race
            # with VAD's own commit).
            sender_task = asyncio.create_task(_send_audio(ws, pcm))
            receiver_task = asyncio.create_task(_collect_response(ws, result))

            await sender_task
            try:
                await asyncio.wait_for(receiver_task, timeout=120)
            except asyncio.TimeoutError:
                result["error"] = "timed out waiting for assistant response"
                receiver_task.cancel()
    except Exception as e:
        result["error"] = f"{type(e).__name__}: {e}"

    result["elapsed_s"] = round(time.monotonic() - start, 1)

    if result["error"]:
        print(f"  ERROR ({result['elapsed_s']}s): {result['error']}")
    else:
        if result["user_transcript"]:
            print(f"  user heard as: {result['user_transcript'][:140]}")
        for tc in result["tool_calls"]:
            print(f"  tool: {tc}")
        if result["assistant_transcript"]:
            print(
                f"  assistant ({result['elapsed_s']}s): "
                f"{result['assistant_transcript'][:160]}"
                f"{'…' if len(result['assistant_transcript']) > 160 else ''}"
            )

    return result


async def _send_audio(ws, pcm: bytes) -> None:
    """Stream PCM16 to the WS as base64 chunks, paced at real time.

    Appends ~800ms of silence so the server-side VAD reliably detects the
    end of the user turn — without it, VAD can fire mid-clip on a natural
    pause and commit a partial buffer.
    """
    interval = CHUNK_MS / 1000.0
    # Trailing silence — VAD's silence_duration_ms is 500ms; 800ms is safely above it.
    trailing_silence = b"\x00" * (int(SAMPLE_RATE * 0.8) * 2)
    full = pcm + trailing_silence
    for i in range(0, len(full), BYTES_PER_CHUNK):
        chunk = full[i : i + BYTES_PER_CHUNK]
        b64 = base64.b64encode(chunk).decode("ascii")
        await ws.send(json.dumps({"type": "audio.chunk", "data": b64}))
        await asyncio.sleep(interval)


async def _collect_response(ws, result: dict) -> None:
    """Read events until transcript.assistant.done."""
    while True:
        raw = await asyncio.wait_for(ws.recv(), timeout=60)
        msg = json.loads(raw)
        t = msg.get("type")
        if t == "audio.chunk":
            continue
        if t == "transcript.assistant.delta":
            continue
        if t == "transcript.user.done":
            result["user_transcript"] = msg.get("text", "")
        elif t == "tool.result":
            result["tool_calls"].append(msg.get("name", "<unknown>"))
        elif t == "transcript.assistant.done":
            result["assistant_transcript"] = msg.get("text", "")
            return
        elif t == "error":
            message = msg.get("message", "unknown error")
            # "buffer too small" means VAD beat our explicit commit to the
            # buffer; the response is still being generated, so we keep
            # listening rather than aborting the turn.
            if "buffer too small" in message:
                continue
            result["error"] = message
            return


_RETRYABLE = (
    "buffer too small",          # VAD raced our explicit commit (rare)
    "service restart",            # OpenAI 1012 close code
    "ConnectionClosed",
    "InvalidMessage",
    "did not receive a valid",
)


def _is_retryable(err: str | None) -> bool:
    if not err:
        return False
    return any(needle in err for needle in _RETRYABLE)


async def main() -> int:
    if not PROMPT_DIR.exists():
        print(f"ERROR: prompt directory not found: {PROMPT_DIR}", file=sys.stderr)
        print(
            "Run `python evals/generate-voice-prompts.py` first.",
            file=sys.stderr,
        )
        return 1

    mp3s = sorted(PROMPT_DIR.glob("*.mp3"))
    if not mp3s:
        print(f"ERROR: no MP3 prompts in {PROMPT_DIR}", file=sys.stderr)
        return 1

    print("Wonder Toys — Synthetic Voice Harness")
    print(f"Target: {ws_url().split('?')[0]}")
    print(f"User: {USER_ID}")
    print(f"Sending {len(mp3s)} voice prompt(s) sequentially")
    if os.environ.get("ARIZE_SPACE_ID"):
        print("Observability: Arize AX ACTIVE")
    elif os.environ.get("PHOENIX_COLLECTOR_ENDPOINT"):
        print("Observability: Phoenix ACTIVE")
    else:
        print("Observability: none")

    results = []
    for i, mp3 in enumerate(mp3s, start=1):
        result = await replay_prompt(mp3, i, len(mp3s))
        # One retry on transient errors (VAD race, OpenAI service restart,
        # closed WS). Each turn opens a fresh WS so a single retry is enough.
        if _is_retryable(result.get("error")):
            print(f"  …retrying after {result['error']}")
            await asyncio.sleep(2)
            result = await replay_prompt(mp3, i, len(mp3s))
        results.append(result)

    print(f"\n{'═' * 70}")
    print("Summary")
    print("─" * 70)
    ok = sum(1 for r in results if not r["error"])
    print(f"  {ok}/{len(results)} prompts completed without error")
    tools = sum(len(r["tool_calls"]) for r in results)
    print(f"  {tools} total tool calls dispatched")
    if any(r["error"] for r in results):
        for r in results:
            if r["error"]:
                print(f"  ✗ {r['prompt']}: {r['error']}")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
