"""PCM16 audio helpers (Arize AX tier).

The Arize AX trace-card audio player decodes `data:audio/wav;base64,...`
URIs inline — it doesn't fetch arbitrary HTTPS URLs. So the canonical
play-audio path is to embed the WAV bytes as a data URI on the
`input.audio.url` / `output.audio.url` span attribute. That's what the
upstream OpenInference Realtime instrumentor does too.

This module returns a data URI from `persist_wav`. As a side benefit
it also writes the WAV to disk under `public/voice-audio/` for human
inspection (and so contributors can replay recorded turns offline) —
but Arize never fetches those files; the audio it plays is inline in
the trace.
"""

from __future__ import annotations

import base64
import io
import wave
from pathlib import Path

SAMPLE_RATE = 24_000
CHANNELS = 1
SAMPLE_WIDTH_BYTES = 2  # 16-bit PCM

_AUDIO_DIR = Path(__file__).resolve().parent.parent / "public" / "voice-audio"
_AUDIO_DIR.mkdir(parents=True, exist_ok=True)


def decode_pcm16(b64: str) -> bytes:
    return base64.b64decode(b64)


def encode_pcm16(data: bytes) -> str:
    return base64.b64encode(data).decode("ascii")


def _pcm_to_wav_bytes(pcm: bytes) -> bytes:
    """Wrap raw PCM16 (mono, 24 kHz) in a WAV container."""
    buf = io.BytesIO()
    with wave.open(buf, "wb") as wf:
        wf.setnchannels(CHANNELS)
        wf.setsampwidth(SAMPLE_WIDTH_BYTES)
        wf.setframerate(SAMPLE_RATE)
        wf.writeframes(pcm)
    return buf.getvalue()


def persist_wav(
    pcm: bytes,
    session_id: str,
    turn: int,
    role: str,
) -> str | None:
    """Return a `data:audio/wav;base64,…` URI for the PCM bytes.

    The AX trace-card audio player needs a data URI to render its
    playback widget; an HTTPS URL doesn't work even if the audio is
    publicly reachable. Side-effect: also writes the WAV to disk under
    `public/voice-audio/` for human inspection (gitignored).
    """
    if not pcm:
        return None

    wav_bytes = _pcm_to_wav_bytes(pcm)

    # Side-effect: persist the WAV to disk so contributors can replay
    # recordings locally. Failures here are non-fatal — the data URI is
    # what matters for the trace.
    safe_session = "".join(c for c in session_id if c.isalnum() or c in "-_")
    safe_role = "".join(c for c in role if c.isalpha())
    filename = f"audio_{safe_session}_{turn:03d}_{safe_role}.wav"
    try:
        (_AUDIO_DIR / filename).write_bytes(wav_bytes)
    except OSError:
        pass

    b64 = base64.b64encode(wav_bytes).decode("ascii")
    return f"data:audio/wav;base64,{b64}"
