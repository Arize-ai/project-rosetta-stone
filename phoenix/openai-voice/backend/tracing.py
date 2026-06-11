"""Phoenix tracing setup for the OpenAI Voice tier.

There is no OpenInference auto-instrumentor for the OpenAI Realtime API, so
we register a tracer provider here (via `arize-otel`) and hand-roll spans
in the voice agent following the spirit of the Arize "Tracing & Evaluating
Audio" cookbook:

  https://arize.com/docs/ax/cookbooks/evaluation/tracing-and-evaluating-audio

Departure from the cookbook: instead of one long-lived `session.lifecycle`
root span for the whole WebSocket session, we emit ONE TRACE PER TURN.
A voice session can stay open for minutes; with a single long-lived
parent the children land in AX while the parent is still in flight, which
the AX UI surfaces as orphaned spans. Per-turn root spans avoid that —
each turn is a complete trace the moment it ends, and session grouping
in the UI happens via the `session.id` attribute (already supported
natively by AX and Phoenix).

For the text-mode fallback we hand-roll a single `chat_completion` span
per turn, keeping this tier dependency-light.

Expected environment variables:
  PHOENIX_COLLECTOR_ENDPOINT — Phoenix Cloud or self-hosted endpoint
  PHOENIX_API_KEY            — Phoenix API key (read by phoenix-otel)
  PHOENIX_PROJECT_NAME       — Project name (default: wonder-toys-openai-voice)
"""

from __future__ import annotations

import json
import os
from typing import Any

from phoenix.otel import register
from opentelemetry import context as otel_context, trace
from opentelemetry.trace import Span, Status, StatusCode

from backend.audio import persist_wav

_tracer_provider = register(
    project_name=os.environ.get("PHOENIX_PROJECT_NAME", "wonder-toys-openai-voice"),
    batch=True,
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
    """Per-session helper. Holds session-level metadata (id, tool catalog,
    system prompt) and opens a fresh per-turn root span on each user turn.

    Per-turn root spans (rather than one long-lived session span) avoid
    the "children land in AX before parent ends" orphan-display problem.

    Method lifecycle:
        1. `voice_tracer(session_id_hint)` — instantiate; nothing emitted yet.
        2. `on_session_created(id)` — capture the authoritative session id.
        3. `on_session_configured(tools, instructions)` — capture tools +
           system prompt for later inclusion on each turn's root span.
        4. `on_input_speech_started()` — open a new `voice.turn` root span
           AND its child `input.audio` span. Closes the previous turn if
           the user is interrupting.
        5. `on_input_speech_stopped(url, pcm)` — set audio URL + mime on
           the input span.
        6. `on_user_transcript_done(text)` — set transcript, end input span.
        7. `on_tool_call_start/end(...)` — open/close `llm.tool` children
           of the current turn.
        8. `on_assistant_transcript_done(...)` — open `output.audio` child
           and close it once the transcript + audio are persisted.
        9. `on_response_done(usage)` — record token counts on the most
           recent output.audio span and END the turn root span.
       10. `close()` — close any open spans (turn aborted by WS close).
    """

    def __init__(self, session_id: str) -> None:
        self._session_id = session_id
        self._tools: list[dict] = []
        self._instructions: str = ""
        # The currently-open turn span (or None between turns)
        self._turn_span: Span | None = None
        self._turn_token: object | None = None  # OTel context detach token
        # Pending children on the current turn
        self._last_input_span: Span | None = None
        self._last_output_span: Span | None = None
        self._closed = False

    # --- lifecycle ---------------------------------------------------------

    def close(self) -> None:
        if self._closed:
            return
        self._closed = True
        self._close_turn()

    # --- session events ----------------------------------------------------

    def on_session_created(self, session_id: str) -> None:
        self._session_id = session_id

    def on_session_configured(self, tools: list[dict], instructions: str) -> None:
        self._tools = tools
        self._instructions = instructions

    # --- turn lifecycle ---------------------------------------------------

    def _start_turn(self) -> None:
        """Open a new root `voice.turn` AGENT span and make it the current
        OTel context so children attach to it as parent.
        """
        if self._turn_span is not None:
            # Defensive: caller missed an end-turn signal. Close cleanly.
            self._close_turn()
        span = tracer.start_span(
            "voice.turn",
            attributes={
                "openinference.span.kind": "AGENT",
                "session.id": self._session_id,
            },
        )
        if self._tools:
            _set_tools_on_span(span, self._tools)
        if self._instructions:
            span.set_attribute("llm.input_messages.0.message.role", "system")
            span.set_attribute(
                "llm.input_messages.0.message.content", self._instructions
            )
        # Attach span as current context so subsequent `tracer.start_span(...)`
        # calls inherit it as parent without us having to thread it manually.
        ctx = trace.set_span_in_context(span)
        self._turn_token = otel_context.attach(ctx)
        self._turn_span = span

    def _close_turn(self) -> None:
        """End any open child spans and the turn root span."""
        try:
            if self._last_input_span:
                self._last_input_span.end()
            if self._last_output_span:
                self._last_output_span.end()
        finally:
            self._last_input_span = None
            self._last_output_span = None
            if self._turn_span is not None:
                self._turn_span.end()
                self._turn_span = None
            if self._turn_token is not None:
                try:
                    otel_context.detach(self._turn_token)
                except Exception:
                    pass
                self._turn_token = None

    # --- input audio (user turn) ------------------------------------------

    def on_input_speech_started(self) -> None:
        # New user turn → new trace
        self._start_turn()
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
        # Also stamp the turn root's input.value so AX UI shows it in trace card
        if self._turn_span is not None:
            self._turn_span.set_attribute("input.value", transcript)

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
        if self._last_output_span:
            self._last_output_span.end()
        self._last_output_span = span
        # Stamp output.value on the turn root too
        if self._turn_span is not None:
            self._turn_span.set_attribute("output.value", transcript)

    def on_response_done(self, usage: dict[str, Any]) -> None:
        span = self._last_output_span
        if span is not None:
            prompt = usage.get("input_tokens") or usage.get("prompt_tokens")
            completion = usage.get("output_tokens") or usage.get("completion_tokens")
            if prompt is not None:
                span.set_attribute("llm.token_count.prompt", int(prompt))
            if completion is not None:
                span.set_attribute("llm.token_count.completion", int(completion))
            span.end()
            self._last_output_span = None
        # Turn complete — close the root span so AX shows the full trace.
        self._close_turn()

    # --- errors ------------------------------------------------------------

    def on_error(self, err: dict) -> None:
        msg = err.get("message", "unknown error")
        for span in (
            self._last_input_span,
            self._last_output_span,
            self._turn_span,
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
