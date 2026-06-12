"""Arize AX tracing initialization for the OpenAI Voice tier.

This module MUST be imported before any `agents` imports so that the
OpenInference instrumentor patches the OpenAI Agents SDK — including
`agents.realtime.RealtimeSession` — before the agent is built.

The `OpenAIAgentsInstrumentor` produces the canonical OpenInference voice
span tree for each turn automatically:

    AUDIO  "conversation.turn"   ← aggregated transcripts, llm.model_name
    ├─ USER  "user"              ← input.audio.url (WAV data URI), transcript
    ├─ LLM   "assistant"         ← output.audio.url, transcript, token counts,
    │                              time_to_first_token_ms
    │  └─ TOOL "<tool_name>"     ← one per function call within the turn
    └─ …                          ← additional USER / LLM siblings for split
                                    input or tool round-trips

It also patches the regular `Agent` + `Runner` flow used by the text
fallback, so both modes are traced through a single instrumentor.

Expected environment variables:
  ARIZE_SPACE_ID
  ARIZE_API_KEY
  ARIZE_PROJECT_NAME  (default: wonder-toys-openai-voice)
"""

import os

# Capture up to ~30 s of 24 kHz mono PCM16 per audio attribute. The
# instrumentor truncates the base64 payload of `input.audio.url` /
# `output.audio.url` data URIs at OPENINFERENCE_BASE64_AUDIO_MAX_LENGTH
# (default 32 000 chars ≈ 0.5 s of audio — too short for real turns). The
# OTel SDK's own attribute-value length limit also has to clear the WAV
# size or it would truncate first. Both env vars are set with
# `setdefault` so users can still override from the shell.
#
#   30 s × 24 000 samples × 2 bytes  = 1 440 000 raw PCM bytes
#   + 44-byte WAV header             = 1 440 044 bytes
#   × 4/3 base64 expansion           ≈ 1 920 060 chars
#
# 2 000 000 leaves headroom; 10 MB on the OTel limit covers anything
# reasonable a single turn could produce.
os.environ.setdefault("OPENINFERENCE_BASE64_AUDIO_MAX_LENGTH", "2000000")
os.environ.setdefault("OTEL_ATTRIBUTE_VALUE_LENGTH_LIMIT", "10485760")

from arize.otel import register  # noqa: E402
from openinference.instrumentation.openai_agents import (  # noqa: E402
    OpenAIAgentsInstrumentor,
)

_tracer_provider = register(
    space_id=os.environ.get("ARIZE_SPACE_ID", ""),
    api_key=os.environ.get("ARIZE_API_KEY", ""),
    project_name=os.environ.get("ARIZE_PROJECT_NAME", "wonder-toys-openai-voice"),
)

OpenAIAgentsInstrumentor().instrument(tracer_provider=_tracer_provider)
