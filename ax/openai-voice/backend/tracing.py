"""Arize AX tracing setup for the OpenAI Voice tier.

There is no OpenInference auto-instrumentor for raw OpenAI Realtime API
WebSocket use, so we register a tracer provider here (via `arize-otel`)
and hand-roll spans following the OpenInference voice convention used by
the official OpenAI Agents SDK instrumentor:

  https://arize.com/docs/ax/cookbooks/evaluation/tracing-and-evaluating-audio
  https://github.com/Arize-ai/openinference/tree/main/python/instrumentation/openinference-instrumentation-openai-agents

The shape that the AX (and Phoenix) trace UIs key off of for audio
playback is:

    AUDIO   "conversation.turn"    (root)
    ├── USER  "user"               input.audio.url / input.audio.transcript
    └── LLM   "assistant"          output.audio.url / output.audio.transcript
        └── TOOL "<tool_name>"     nested under the LLM, not the turn

The audio player widget on the trace card is gated by the span KIND
(`USER` for input, `LLM` with `output.audio.*` for output), not by the
span name. Tools nest under the LLM span so the UI's "what did the
model do" view is accurate.

Per-turn (not per-session) traces — each user-assistant exchange is one
trace, grouped into a session via the `session.id` attribute (which AX
and Phoenix both group on natively).

For the text-mode fallback we hand-roll a single `chat_completion` span
per turn, keeping this tier dependency-light.

Expected environment variables:
  ARIZE_SPACE_ID
  ARIZE_API_KEY
  ARIZE_PROJECT_NAME  (default: wonder-toys-openai-voice)
"""

from __future__ import annotations

import json
import os
from typing import Any

from arize.otel import register
from opentelemetry import context as otel_context, trace
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
    """Per-session helper. Emits one trace per user-assistant turn shaped
    like:

        AUDIO  conversation.turn   (root)
        ├── USER user
        └── LLM  assistant
            └── TOOL <tool_name>...

    State machine:
        on_input_speech_started()      → open turn + user span
        on_input_speech_stopped(url)   → stamp audio URL on user span
        on_user_transcript_done(text)  → stamp transcript, close user span;
                                          open assistant span as next sibling
        on_tool_call_start/end(...)    → child of assistant span
        on_assistant_transcript_done() → stamp audio URL + transcript on
                                          assistant span (don't close yet)
        on_response_done(usage)        → if this response had audio,
                                          stamp tokens, close assistant +
                                          turn; otherwise (tool-only
                                          response) leave open so the
                                          subsequent audio response lands
                                          in the same trace
        close()                        → close any open spans (WS dropped)
    """

    def __init__(self, session_id: str) -> None:
        self._session_id = session_id
        self._tools: list[dict] = []
        self._instructions: str = ""
        # Per-turn span tracking
        self._turn_span: Span | None = None
        self._turn_token: object | None = None
        self._user_span: Span | None = None
        self._assistant_span: Span | None = None
        self._assistant_token: object | None = None
        self._got_audio_this_turn: bool = False
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

    # --- turn / assistant lifecycle ---------------------------------------

    def _open_turn(self) -> None:
        if self._turn_span is not None:
            # Defensive: previous turn never ended, close cleanly.
            self._close_turn()
        span = tracer.start_span(
            "conversation.turn",
            attributes={
                "openinference.span.kind": "AUDIO",
                "session.id": self._session_id,
            },
        )
        ctx = trace.set_span_in_context(span)
        self._turn_token = otel_context.attach(ctx)
        self._turn_span = span
        self._got_audio_this_turn = False

    def _ensure_assistant(self) -> None:
        """Open the assistant LLM span the first time a response-side event
        fires for this turn. Subsequent events on the same turn reuse it.
        """
        if self._assistant_span is not None:
            return
        if self._turn_span is None:
            # No turn open — start one. Can happen if the very first event
            # we see is response-related (e.g., we missed speech_started).
            self._open_turn()
        span = tracer.start_span(
            "assistant",
            attributes={
                "openinference.span.kind": "LLM",
                "session.id": self._session_id,
                "llm.system": "openai",
                "llm.model_name": os.environ.get(
                    "OPENAI_REALTIME_MODEL", "gpt-realtime"
                ),
            },
        )
        if self._tools:
            _set_tools_on_span(span, self._tools)
        if self._instructions:
            span.set_attribute("llm.input_messages.0.message.role", "system")
            span.set_attribute(
                "llm.input_messages.0.message.content", self._instructions
            )
        ctx = trace.set_span_in_context(span)
        self._assistant_token = otel_context.attach(ctx)
        self._assistant_span = span

    def _close_assistant(self) -> None:
        if self._assistant_span is not None:
            self._assistant_span.end()
            self._assistant_span = None
        if self._assistant_token is not None:
            try:
                otel_context.detach(self._assistant_token)
            except Exception:
                pass
            self._assistant_token = None

    def _close_turn(self) -> None:
        """End any open user / assistant / turn span."""
        try:
            if self._user_span is not None:
                self._user_span.end()
                self._user_span = None
            self._close_assistant()
        finally:
            if self._turn_span is not None:
                self._turn_span.end()
                self._turn_span = None
            if self._turn_token is not None:
                try:
                    otel_context.detach(self._turn_token)
                except Exception:
                    pass
                self._turn_token = None
            self._got_audio_this_turn = False

    # --- user audio (input) -----------------------------------------------

    def on_input_speech_started(self) -> None:
        self._open_turn()
        self._user_span = tracer.start_span(
            "user",
            attributes={
                "openinference.span.kind": "USER",
                "session.id": self._session_id,
            },
        )

    def on_input_speech_stopped(self, url: str | None, pcm: bytes) -> None:
        span = self._user_span
        if span is None:
            return
        if url:
            span.set_attribute("input.audio.url", url)
        span.set_attribute("input.audio.mime_type", "audio/wav")
        span.set_attribute("audio.bytes", len(pcm))

    def on_user_transcript_done(self, transcript: str) -> None:
        if self._user_span is not None:
            self._user_span.set_attribute("input.audio.transcript", transcript)
            self._user_span.set_attribute("input.value", transcript)
            self._user_span.end()
            self._user_span = None
        if self._turn_span is not None:
            self._turn_span.set_attribute("input.value", transcript)

    # --- tool calls (children of assistant) -------------------------------

    def on_tool_call_start(self, name: str, arguments: dict) -> Span:
        self._ensure_assistant()
        # The current OTel context has the assistant span attached, so this
        # call automatically nests under it.
        span = tracer.start_span(
            name,
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

    # --- assistant audio (output) -----------------------------------------

    def on_assistant_transcript_done(
        self, transcript: str, url: str | None, pcm: bytes
    ) -> None:
        self._ensure_assistant()
        span = self._assistant_span
        if span is None:
            return
        if url:
            span.set_attribute("output.audio.url", url)
        span.set_attribute("output.audio.mime_type", "audio/wav")
        span.set_attribute("output.audio.transcript", transcript)
        span.set_attribute("output.value", transcript)
        span.set_attribute("audio.bytes", len(pcm))
        if self._turn_span is not None:
            self._turn_span.set_attribute("output.value", transcript)
        self._got_audio_this_turn = True

    def on_response_done(self, usage: dict[str, Any]) -> None:
        # OpenAI Realtime emits multiple response.done events per logical
        # user turn when tool calls are involved. Only close the turn when
        # this response had user-facing audio (signalled by
        # on_assistant_transcript_done having set _got_audio_this_turn).
        if not self._got_audio_this_turn:
            return  # tool-only response — keep turn + assistant open

        span = self._assistant_span
        if span is not None:
            prompt = usage.get("input_tokens") or usage.get("prompt_tokens")
            completion = usage.get("output_tokens") or usage.get("completion_tokens")
            if prompt is not None:
                span.set_attribute("llm.token_count.prompt", int(prompt))
            if completion is not None:
                span.set_attribute("llm.token_count.completion", int(completion))
        self._close_turn()

    # --- errors ------------------------------------------------------------

    def on_error(self, err: dict) -> None:
        msg = err.get("message", "unknown error")
        for span in (
            self._user_span,
            self._assistant_span,
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
