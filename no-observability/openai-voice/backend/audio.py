"""PCM16 audio helpers.

OpenAI Realtime sends/receives 24kHz, 16-bit, mono PCM as base64 strings.
This module provides:
- Decode helpers (base64 ↔ bytes)
- A no-op `persist_wav` for the no-observability tier (AX tier overrides this
  module entirely with a version that writes to public/voice-audio/)
"""

from __future__ import annotations

import base64

SAMPLE_RATE = 24_000
CHANNELS = 1
SAMPLE_WIDTH_BYTES = 2  # 16-bit PCM


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
    """No-op in the no-observability tier — no WAV files are written.

    The ax tier overrides this function in its copy of audio.py to write
    a WAV file under public/voice-audio/ and return the public URL.
    """
    _ = (pcm, session_id, turn, role)
    return None
