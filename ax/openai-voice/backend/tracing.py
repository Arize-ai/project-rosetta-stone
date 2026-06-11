"""Arize AX tracing setup for the OpenAI Voice tier.

There is no OpenInference auto-instrumentor for the OpenAI Realtime API, so
we register a tracer provider here (via `arize-otel`) and hand-roll spans
in the voice agent following the Arize "Tracing & Evaluating Audio"
cookbook:

  https://arize.com/docs/ax/cookbooks/evaluation/tracing-and-evaluating-audio

For the text-mode fallback we hand-roll a single `chat_completion` span per
turn, since `openinference-instrumentation-openai` lives elsewhere in this
repo's stack and we keep this tier dependency-light.

Expected environment variables:
  ARIZE_SPACE_ID
  ARIZE_API_KEY
  ARIZE_PROJECT_NAME  (default: wonder-toys-openai-voice)
"""

from __future__ import annotations

import json
import os
import time
from typing import Any

from arize.otel import register
from opentelemetry import trace
from opentelemetry.trace import Span, Status, StatusCode

from backend.audio import persist_wav

_tracer_provider = register(
    space_id=os.environ.get("ARIZE_SPACE_ID", ""),
    api_key=os.environ.get("ARIZE_API_KEY", ""),
    project_name=os.environ.get("ARIZE_PROJECT_NAME", "wonder-toys-openai-voice"),
)

tracer = trace.get_tracer("wonder-toys.openai-voice")


def _set_tools_on_span(span: Span, tools: list[dict]) -> None:
    """Record the tool list on a span using the OpenInference convention."""
    for i, tool in enumerate(tools):
        span.set_attribute(f"llm.tools.{i}.tool.name", tool.get("name", f"tool_{i}"))
        span.set_attribute(f"llm.tools.{i}.tool.type", tool.get("type", "function"))
        span.set_attribute(
            f"llm.tools.{i}.tool.description", tool.get("description", "")
        )
        span.set_attribute(
            f"llm.tools.{i}.tool.json_schema",
            json.dumps(tool.get("parameters", {})),
        )


class VoiceTracer:
    """Per-session helper that owns the root `session.lifecycle` span and
    delegates per-turn spans to it.

    Lifecycle:
        1. `voice_tracer(session_id_hint)` instantiates and immediately
           opens the lifecycle root span.
        2. `on_session_created(id)` updates the span's `session.id` attr
           with the authoritative id OpenAI returns.
        3. `on_session_configured(tools, instructions)` records tools +
           system prompt on the root.
        4. `on_input_speech_started/stopped(...)` open/close an
           `input.audio` child per user turn.
        5. `on_user_transcript_done(text)` adds the transcript attr to the
           last input audio span (kept on `_last_input_span`).
        6. `on_tool_call_start/end(...)` open/close a `llm.tool` child.
        7. `on_assistant_transcript_done(...)` opens + closes an
           `output.audio` child (we don't span the streaming delta —
           assistant audio comes back in a tight burst, so a single
           bracketed span is cleaner than tracking start-of-first-chunk).
        8. `on_response_done(usage)` records token counts on the last
           output audio span.
        9. `close()` ends the lifecycle span.
    """

    def __init__(self, session_id: str) -> None:
        self._session_id = session_id
        self._root_ctx = tracer.start_as_current_span(
            "session.lifecycle",
            attributes={"openinference.span.kind": "AGENT", "session.id": session_id},
        )
        # __enter__ explicitly because we manage closing manually
        self._root_span: Span = self._root_ctx.__enter__()
        self._last_input_span: Span | None = None
        self._last_output_span: Span | None = None
        self._closed = False

    # --- lifecycle ---------------------------------------------------------

    def close(self) -> None:
        if self._closed:
            return
        self._closed = True
        try:
            if self._last_input_span:
                self._last_input_span.end()
            if self._last_output_span:
                self._last_output_span.end()
        finally:
            try:
                self._root_ctx.__exit__(None, None, None)
            except Exception:
                pass

    # --- session events ----------------------------------------------------

    def on_session_created(self, session_id: str) -> None:
        self._session_id = session_id
        self._root_span.set_attribute("session.id", session_id)

    def on_session_configured(self, tools: list[dict], instructions: str) -> None:
        _set_tools_on_span(self._root_span, tools)
        self._root_span.set_attribute(
            "llm.input_messages.0.message.role", "system"
        )
        self._root_span.set_attribute(
            "llm.input_messages.0.message.content", instructions
        )

    # --- input audio (user turn) ------------------------------------------

    def on_input_speech_started(self) -> None:
        # Close any prior input span that didn't get a transcript event
        if self._last_input_span:
            self._last_input_span.end()
        self._last_input_span = tracer.start_span(
            "input.audio",
            attributes={
                "openinference.span.kind": "LLM",
                "session.id": self._session_id,
            },
        )

    def on_input_speech_stopped(self, url: str | None, pcm: bytes) -> None:
        span = self._last_input_span
        if span is None:
            return
        if url:
            span.set_attribute("input.audio.url", url)
        span.set_attribute("input.audio.mime_type", "audio/wav")
        span.set_attribute("audio.bytes", len(pcm))

    def on_user_transcript_done(self, transcript: str) -> None:
        span = self._last_input_span
        if span is not None:
            span.set_attribute("input.audio.transcript", transcript)
            span.set_attribute("input.value", transcript)
            span.end()
            self._last_input_span = None

    # --- tool calls --------------------------------------------------------

    def on_tool_call_start(self, name: str, arguments: dict) -> Span:
        span = tracer.start_span(
            "llm.tool",
            attributes={
                "openinference.span.kind": "TOOL",
                "tool.name": name,
                "tool.parameters": json.dumps(arguments),
                "session.id": self._session_id,
            },
        )
        return span

    def on_tool_call_end(self, span: Span, result: dict) -> None:
        span.set_attribute("tool.output", json.dumps(result)[:10_000])
        if isinstance(result, dict) and result.get("error"):
            span.set_status(Status(StatusCode.ERROR, result["error"]))
        span.end()

    # --- output audio (assistant turn) ------------------------------------

    def on_assistant_transcript_done(
        self, transcript: str, url: str | None, pcm: bytes
    ) -> None:
        span = tracer.start_span(
            "output.audio",
            attributes={
                "openinference.span.kind": "LLM",
                "session.id": self._session_id,
                "output.audio.transcript": transcript,
                "output.audio.mime_type": "audio/wav",
                "output.value": transcript,
                "audio.bytes": len(pcm),
            },
        )
        if url:
            span.set_attribute("output.audio.url", url)
        # Keep the span open so on_response_done can stamp token counts
        if self._last_output_span:
            self._last_output_span.end()
        self._last_output_span = span

    def on_response_done(self, usage: dict[str, Any]) -> None:
        span = self._last_output_span
        if span is None:
            return
        # GA usage shape: {input_tokens, output_tokens, total_tokens, ...}
        prompt = usage.get("input_tokens") or usage.get("prompt_tokens")
        completion = usage.get("output_tokens") or usage.get("completion_tokens")
        if prompt is not None:
            span.set_attribute("llm.token_count.prompt", int(prompt))
        if completion is not None:
            span.set_attribute("llm.token_count.completion", int(completion))
        span.end()
        self._last_output_span = None

    # --- errors ------------------------------------------------------------

    def on_error(self, err: dict) -> None:
        msg = err.get("message", "unknown error")
        for span in (
            self._last_input_span,
            self._last_output_span,
            self._root_span,
        ):
            if span is None:
                continue
            span.set_status(Status(StatusCode.ERROR, msg))
            span.set_attribute("error.code", err.get("code", "unknown"))


def voice_tracer(session_id: str) -> VoiceTracer:
    """Factory matching the duck-type the voice_agent expects."""
    return VoiceTracer(session_id)


# --- text-mode tracing helpers ------------------------------------------


def start_chat_span(model: str, messages: list[dict]) -> Span:
    """Open a span around a Chat Completions call. The caller is
    responsible for setting `output.value` and calling `.end()`.
    """
    span = tracer.start_span(
        "chat_completion",
        attributes={
            "openinference.span.kind": "LLM",
            "llm.model_name": model,
            "llm.system": "openai",
            "input.value": json.dumps(messages)[:10_000],
        },
    )
    return span


_ = time  # keep import for future timing instrumentation
