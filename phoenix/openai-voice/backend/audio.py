"""PCM16 audio helpers (Arize AX tier).

In addition to the base64 ↔ bytes decoders shared with the no-observability
tier, this version writes a WAV file per turn under `public/voice-audio/`
and returns the public URL so the Arize-AX traces can include
`input.audio.url` / `output.audio.url` attributes that point at a playable
file.

Cleanup of old WAVs is the operator's responsibility — for a long-running
demo, prune `public/voice-audio/` periodically.
"""

from __future__ import annotations

import base64
import os
import wave
from pathlib import Path

SAMPLE_RATE = 24_000
CHANNELS = 1
SAMPLE_WIDTH_BYTES = 2  # 16-bit PCM

_AUDIO_DIR = Path(__file__).resolve().parent.parent / "public" / "voice-audio"
_AUDIO_DIR.mkdir(parents=True, exist_ok=True)

# Public URL host — what the Arize UI fetches. Override via env when behind
# a tunnel (e.g. ngrok) so traces can be replayed from outside localhost.
_PUBLIC_BASE = os.environ.get("VOICE_AUDIO_PUBLIC_BASE", "http://localhost:3000")


def decode_pcm16(b64: str) -> bytes:
    return base64.b64decode(b64)


def encode_pcm16(data: bytes) -> str:
    return base64.b64encode(data).decode("ascii")


def persist_wav(
    pcm: bytes,
    session_id: str,
    turn: int,
    role: str,
) -> str | None:
    """Write `pcm` (raw little-endian PCM16, mono, 24kHz) as a WAV file
    and return a URL pointing at it.
    """
    if not pcm:
        return None

    safe_session = "".join(c for c in session_id if c.isalnum() or c in "-_")
    safe_role = "".join(c for c in role if c.isalpha())
    filename = f"audio_{safe_session}_{turn:03d}_{safe_role}.wav"
    path = _AUDIO_DIR / filename

    try:
        with wave.open(str(path), "wb") as wf:
            wf.setnchannels(CHANNELS)
            wf.setsampwidth(SAMPLE_WIDTH_BYTES)
            wf.setframerate(SAMPLE_RATE)
            wf.writeframes(pcm)
    except OSError:
        return None

    return f"{_PUBLIC_BASE}/voice-audio/{filename}"
