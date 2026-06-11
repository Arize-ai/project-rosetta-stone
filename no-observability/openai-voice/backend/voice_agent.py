"""Voice-mode agent — bridges a browser WebSocket to OpenAI's Realtime API.

The browser opens a WebSocket to FastAPI at /voice. This handler opens its
own WebSocket to OpenAI Realtime, then bidirectionally pumps frames:

  Browser → us:
    {type: "audio.chunk", data: "<base64 pcm16>"}
    {type: "audio.commit"}                  # flush input buffer + request response
    {type: "interrupt"}                     # cancel current response, stop playback
    {type: "text", text: "..."}             # user typed a message in voice mode

  Us → OpenAI:
    {type: "input_audio_buffer.append", audio: ...}
    {type: "input_audio_buffer.commit"} / {type: "response.create"}
    {type: "response.cancel"}
    {type: "conversation.item.create", item: {...}}

  OpenAI → us → browser (control frames over the same JSON channel):
    {type: "audio.chunk", data: "<base64 pcm16>"}   # PCM16 to play back
    {type: "transcript.user.delta", text: ...}      # user transcription delta
    {type: "transcript.user.done", text: ...}
    {type: "transcript.assistant.delta", text: ...} # assistant transcript delta
    {type: "transcript.assistant.done", text: ...}
    {type: "tool.result", name: ..., markdown: ...} # rendered product cards
    {type: "speech.started"} / {type: "speech.stopped"}
    {type: "session.ready"}
    {type: "error", message: ...}

The AX tier supplies a tracing module that wraps key handlers with OTel
spans; the no-observability tier uses inert no-op tracing primitives.
"""

from __future__ import annotations

import asyncio
import json
import os
import secrets
from typing import Any

import websockets
from fastapi import WebSocket, WebSocketDisconnect

from backend.audio import decode_pcm16, persist_wav
from backend.prompt import voice_system_prompt
from backend.tools import call_tool, realtime_tools

# Try to load tracing — only the ax tier provides it
try:
    from backend.tracing import voice_tracer  # type: ignore
except Exception:  # pragma: no cover
    voice_tracer = None  # type: ignore


REALTIME_MODEL = os.environ.get("OPENAI_REALTIME_MODEL", "gpt-realtime")
REALTIME_URL = (
    os.environ.get("OPENAI_REALTIME_URL")
    or f"wss://api.openai.com/v1/realtime?model={REALTIME_MODEL}"
)
REALTIME_VOICE = os.environ.get("OPENAI_REALTIME_VOICE", "alloy")


def _format_search_markdown(result: dict) -> str:
    """Render a search_products tool result as ProductCard markdown.

    Mirrors the Chat.tsx parser expectation: each card starts with a
    `![Name](/product-images/toy-XXX.png)` line followed by metadata lines,
    separated by a blank line.
    """
    results = result.get("results") or []
    if not results:
        return "_No matching products found._"
    lines = []
    for p in results:
        lines.append(f"![{p['name']}]({p['image']})")
        lines.append(f"**{p['name']}** — ${p['price']:.2f}")
        stars = p["rating"]["stars"]
        count = p["rating"]["numberOfRatings"]
        lines.append(
            f"⭐ {stars:.1f} ({count:,} ratings) · Ages {p['ageRange']} · by {p['manufacturer']}"
        )
        lines.append(p["description"])
        lines.append("")
    return "\n".join(lines).rstrip()


def _format_product_markdown(result: dict) -> str:
    if not result.get("found"):
        return "_That product could not be found._"
    p = result["product"]
    return (
        f"![{p['name']}]({p['image']})\n"
        f"## {p['name']}\n"
        f"**${p['price']:.2f}** · ⭐ {p['rating']['stars']:.1f} "
        f"({p['rating']['numberOfRatings']:,} ratings) · Best Seller #{p['bestSellersRank']}\n\n"
        f"**Ages:** {p['ageRange']} · **Category:** {p['category']} · "
        f"**By:** {p['manufacturer']}\n"
        f"**Dimensions:** "
        f"{p['dimensions']['lengthInches']}×{p['dimensions']['widthInches']}×"
        f"{p['dimensions']['heightInches']} in, {p['dimensions']['weightLbs']} lbs\n"
        f"**In Stock:** {p['inventory']} available\n\n"
        f"{p['description']}"
    )


def _format_tool_result_markdown(name: str, result: dict) -> str | None:
    if name == "search_products":
        return _format_search_markdown(result)
    if name == "get_product":
        return _format_product_markdown(result)
    return None


class VoiceBridge:
    """One instance per browser WebSocket connection."""

    def __init__(self, browser_ws: WebSocket, user_id: str) -> None:
        self.browser_ws = browser_ws
        self.user_id = user_id
        self.openai_ws: websockets.WebSocketClientProtocol | None = None
        self.session_id = "sess_" + secrets.token_hex(6)
        self.turn = 0
        self.assistant_pcm = bytearray()
        self.user_pcm = bytearray()
        # Buffer raw PCM the browser uploads since the last speech_started
        self._user_pcm_pending = bytearray()
        # Optional tracer context (ax tier only)
        self._tracer = voice_tracer(self.session_id) if voice_tracer else None

    # ---- helpers ----------------------------------------------------------

    async def send_browser(self, payload: dict[str, Any]) -> None:
        try:
            await self.browser_ws.send_text(json.dumps(payload))
        except Exception:
            pass

    async def send_openai(self, event: dict[str, Any]) -> None:
        if self.openai_ws is None:
            return
        await self.openai_ws.send(json.dumps(event))

    # ---- lifecycle --------------------------------------------------------

    async def run(self) -> None:
        api_key = os.environ.get("OPENAI_API_KEY")
        if not api_key:
            await self.send_browser(
                {"type": "error", "message": "OPENAI_API_KEY not configured on server"}
            )
            return

        headers = {
            "Authorization": f"Bearer {api_key}",
        }

        try:
            async with websockets.connect(
                REALTIME_URL,
                additional_headers=headers,
                max_size=16 * 1024 * 1024,
            ) as openai_ws:
                self.openai_ws = openai_ws
                await self._configure_session()
                await self.send_browser({"type": "session.ready"})

                browser_task = asyncio.create_task(self._pump_browser())
                openai_task = asyncio.create_task(self._pump_openai())

                done, pending = await asyncio.wait(
                    {browser_task, openai_task},
                    return_when=asyncio.FIRST_COMPLETED,
                )
                for t in pending:
                    t.cancel()
                for t in done:
                    exc = t.exception()
                    if exc and not isinstance(exc, WebSocketDisconnect):
                        await self.send_browser(
                            {"type": "error", "message": f"{type(exc).__name__}: {exc}"}
                        )
        finally:
            if self._tracer:
                self._tracer.close()

    async def _configure_session(self) -> None:
        # GA "realtime" session shape (post-2025-08 release). The legacy
        # beta shape with top-level `modalities` / `input_audio_format` no
        # longer works — beta endpoints return `beta_api_shape_disabled`.
        await self.send_openai(
            {
                "type": "session.update",
                "session": {
                    "type": "realtime",
                    "model": REALTIME_MODEL,
                    "output_modalities": ["audio"],
                    "audio": {
                        "input": {
                            "format": {"type": "audio/pcm", "rate": 24000},
                            "transcription": {"model": "whisper-1"},
                            "turn_detection": {
                                "type": "server_vad",
                                "threshold": 0.5,
                                "prefix_padding_ms": 300,
                                "silence_duration_ms": 500,
                            },
                        },
                        "output": {
                            "format": {"type": "audio/pcm", "rate": 24000},
                            "voice": REALTIME_VOICE,
                        },
                    },
                    "instructions": voice_system_prompt(self.user_id),
                    "tools": realtime_tools(),
                    "tool_choice": "auto",
                },
            }
        )
        if self._tracer:
            self._tracer.on_session_configured(realtime_tools(), voice_system_prompt(self.user_id))

    # ---- browser → us → OpenAI -------------------------------------------

    async def _pump_browser(self) -> None:
        try:
            while True:
                raw = await self.browser_ws.receive_text()
                msg = json.loads(raw)
                t = msg.get("type")

                if t == "audio.chunk":
                    b64 = msg.get("data", "")
                    if not b64:
                        continue
                    # Buffer locally for WAV persistence and forward to OpenAI
                    self._user_pcm_pending.extend(decode_pcm16(b64))
                    await self.send_openai(
                        {"type": "input_audio_buffer.append", "audio": b64}
                    )
                elif t == "audio.commit":
                    await self.send_openai({"type": "input_audio_buffer.commit"})
                    await self.send_openai({"type": "response.create"})
                elif t == "interrupt":
                    await self.send_openai({"type": "response.cancel"})
                    self.assistant_pcm.clear()
                elif t == "text":
                    await self.send_openai(
                        {
                            "type": "conversation.item.create",
                            "item": {
                                "type": "message",
                                "role": "user",
                                "content": [{"type": "input_text", "text": msg.get("text", "")}],
                            },
                        }
                    )
                    await self.send_openai({"type": "response.create"})
        except WebSocketDisconnect:
            return

    # ---- OpenAI → us → browser -------------------------------------------

    async def _pump_openai(self) -> None:
        assert self.openai_ws is not None
        async for raw in self.openai_ws:
            event = json.loads(raw)
            await self._handle_openai_event(event)

    async def _handle_openai_event(self, event: dict[str, Any]) -> None:
        etype = event.get("type", "")

        if etype == "session.created":
            sid = event.get("session", {}).get("id")
            if sid:
                self.session_id = sid
            if self._tracer:
                self._tracer.on_session_created(self.session_id)

        elif etype == "input_audio_buffer.speech_started":
            self._user_pcm_pending = bytearray()
            await self.send_browser({"type": "speech.started"})
            if self._tracer:
                self._tracer.on_input_speech_started()

        elif etype == "input_audio_buffer.speech_stopped":
            self.turn += 1
            url = persist_wav(
                bytes(self._user_pcm_pending),
                self.session_id,
                self.turn,
                "input",
            )
            await self.send_browser({"type": "speech.stopped"})
            if self._tracer:
                self._tracer.on_input_speech_stopped(url, bytes(self._user_pcm_pending))

        elif etype == "conversation.item.input_audio_transcription.completed":
            transcript = event.get("transcript", "")
            await self.send_browser(
                {"type": "transcript.user.done", "text": transcript}
            )
            if self._tracer:
                self._tracer.on_user_transcript_done(transcript)

        elif etype in ("response.audio.delta", "response.output_audio.delta"):
            b64 = event.get("delta", "")
            if b64:
                self.assistant_pcm.extend(decode_pcm16(b64))
                await self.send_browser({"type": "audio.chunk", "data": b64})

        elif etype in (
            "response.audio_transcript.delta",
            "response.output_audio_transcript.delta",
        ):
            delta = event.get("delta", "")
            if delta:
                await self.send_browser(
                    {"type": "transcript.assistant.delta", "text": delta}
                )

        elif etype in (
            "response.audio_transcript.done",
            "response.output_audio_transcript.done",
        ):
            transcript = event.get("transcript", "")
            self.turn += 1
            url = persist_wav(
                bytes(self.assistant_pcm),
                self.session_id,
                self.turn,
                "output",
            )
            await self.send_browser(
                {"type": "transcript.assistant.done", "text": transcript}
            )
            if self._tracer:
                self._tracer.on_assistant_transcript_done(
                    transcript, url, bytes(self.assistant_pcm)
                )
            self.assistant_pcm.clear()

        elif etype == "response.function_call_arguments.done":
            call_id = event.get("call_id")
            name = event.get("name", "")
            try:
                args = json.loads(event.get("arguments") or "{}")
            except json.JSONDecodeError:
                args = {}
            # Inject the authenticated userId — model is told to use it but we
            # backstop it here so a missing arg can't break purchases/orders.
            if name in {"purchase_product", "check_order_status", "cancel_order"}:
                args.setdefault("user_id", self.user_id)

            if self._tracer:
                tool_span = self._tracer.on_tool_call_start(name, args)
            else:
                tool_span = None

            result = call_tool(name, args)

            if tool_span and self._tracer:
                self._tracer.on_tool_call_end(tool_span, result)

            # Send result back to OpenAI so the model can continue
            await self.send_openai(
                {
                    "type": "conversation.item.create",
                    "item": {
                        "type": "function_call_output",
                        "call_id": call_id,
                        "output": json.dumps(result),
                    },
                }
            )
            await self.send_openai({"type": "response.create"})

            # Render product cards in the UI for relevant tools
            markdown = _format_tool_result_markdown(name, result)
            if markdown:
                await self.send_browser(
                    {"type": "tool.result", "name": name, "markdown": markdown}
                )

        elif etype == "response.done":
            usage = event.get("response", {}).get("usage") or {}
            if self._tracer:
                self._tracer.on_response_done(usage)

        elif etype == "error":
            err = event.get("error") or {}
            await self.send_browser(
                {"type": "error", "message": err.get("message", "Unknown error")}
            )
            if self._tracer:
                self._tracer.on_error(err)


async def run_voice_session(browser_ws: WebSocket, user_id: str) -> None:
    bridge = VoiceBridge(browser_ws, user_id)
    await bridge.run()
