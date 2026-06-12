"""Voice-mode agent — bridges a browser WebSocket to OpenAI's Realtime API
via the OpenAI Agents SDK's `RealtimeRunner` / `RealtimeSession`.

The browser opens a WebSocket to FastAPI at `/voice`. This handler hands
audio chunks off to `session.send_audio(...)` and forwards model audio,
transcripts, and tool-render markdown back to the browser. The Agents SDK
owns the OpenAI Realtime WebSocket, the VAD/turn-detection wiring, and
tool dispatch — we only translate browser frames to/from SDK events.

Browser → us → SDK:
    {type: "audio.chunk", data: "<base64 pcm16>"}   → session.send_audio(bytes)
    {type: "interrupt"}                              → session.interrupt()

SDK → us → browser (same JSON channel as before so the React UI is unchanged):
    {type: "audio.chunk", data: "<base64 pcm16>"}    # assistant audio to play
    {type: "transcript.user.done", text}             # user audio transcribed
    {type: "transcript.assistant.delta", text}       # streaming transcript text
    {type: "transcript.assistant.done", text}        # final assistant transcript
    {type: "tool.result", name, markdown}            # product card markdown
    {type: "speech.started"} / {type: "speech.stopped"}  # mic-level indicator
    {type: "session.ready"}
    {type: "error", message}
"""

from __future__ import annotations

import asyncio
import base64
import json
import os
import secrets
from typing import Any

from agents.realtime import (
    RealtimeAgent,
    RealtimeAudio,
    RealtimeAudioInterrupted,
    RealtimeError,
    RealtimeRawModelEvent,
    RealtimeRunner,
)
from fastapi import WebSocket, WebSocketDisconnect

from backend.context import current_user_id, current_voice_callback
from backend.prompt import voice_system_prompt
from backend.tools import all_tools

REALTIME_MODEL = os.environ.get("OPENAI_REALTIME_MODEL", "gpt-realtime")
REALTIME_VOICE = os.environ.get("OPENAI_REALTIME_VOICE", "alloy")


def _build_run_config() -> dict[str, Any]:
    return {
        "model_settings": {
            "model_name": REALTIME_MODEL,
            "output_modalities": ["audio"],
            "voice": REALTIME_VOICE,
            "audio": {
                "input": {
                    "format": "pcm16",
                    "transcription": {"model": "whisper-1"},
                    "turn_detection": {
                        "type": "server_vad",
                        "threshold": 0.5,
                        "prefix_padding_ms": 300,
                        "silence_duration_ms": 500,
                    },
                },
                "output": {"format": "pcm16"},
            },
            "tool_choice": "auto",
        },
    }


async def run_voice_session(browser_ws: WebSocket, user_id: str) -> None:
    if not os.environ.get("OPENAI_API_KEY"):
        await browser_ws.send_text(
            json.dumps({"type": "error", "message": "OPENAI_API_KEY not configured"})
        )
        return

    session_id = "sess_" + secrets.token_hex(6)

    async def send_browser(payload: dict[str, Any]) -> None:
        try:
            await browser_ws.send_text(json.dumps(payload))
        except Exception:
            pass

    async def voice_callback(name: str, markdown: str) -> None:
        await send_browser({"type": "tool.result", "name": name, "markdown": markdown})

    agent = RealtimeAgent(
        name="WonderToys",
        instructions=voice_system_prompt(user_id),
        tools=all_tools,
    )
    runner = RealtimeRunner(agent, config=_build_run_config())

    user_token = current_user_id.set(user_id)
    voice_token = current_voice_callback.set(voice_callback)

    try:
        async with await runner.run() as session:
            await send_browser(
                {"type": "session.ready", "sessionId": session_id}
            )

            async def pump_browser() -> None:
                try:
                    while True:
                        raw = await browser_ws.receive_text()
                        msg = json.loads(raw)
                        t = msg.get("type")
                        if t == "audio.chunk":
                            b64 = msg.get("data", "")
                            if b64:
                                await session.send_audio(base64.b64decode(b64))
                        elif t == "interrupt":
                            await session.interrupt()
                        elif t == "text":
                            text = (msg.get("text") or "").strip()
                            if text:
                                await session.send_message(text)
                except WebSocketDisconnect:
                    return

            async def pump_session() -> None:
                async for event in session:
                    await _dispatch_event(event, send_browser)

            browser_task = asyncio.create_task(pump_browser())
            session_task = asyncio.create_task(pump_session())
            done, pending = await asyncio.wait(
                {browser_task, session_task},
                return_when=asyncio.FIRST_COMPLETED,
            )
            for t in pending:
                t.cancel()
            for t in done:
                exc = t.exception()
                if exc and not isinstance(
                    exc, (WebSocketDisconnect, asyncio.CancelledError)
                ):
                    await send_browser(
                        {
                            "type": "error",
                            "message": f"{type(exc).__name__}: {exc}",
                        }
                    )
    finally:
        current_voice_callback.reset(voice_token)
        current_user_id.reset(user_token)


async def _dispatch_event(event: Any, send_browser) -> None:
    """Map a single RealtimeSession event onto the browser JSON channel."""
    if isinstance(event, RealtimeAudio):
        pcm = getattr(event.audio, "data", None)
        if pcm:
            await send_browser(
                {
                    "type": "audio.chunk",
                    "data": base64.b64encode(pcm).decode("ascii"),
                }
            )
        return

    if isinstance(event, RealtimeAudioInterrupted):
        # Browser drops any queued audio.
        await send_browser({"type": "speech.stopped"})
        return

    if isinstance(event, RealtimeRawModelEvent):
        # The SDK normalizes a few events (RealtimeAudio, RealtimeHistory*) but
        # leaves transcript-final and speech-VAD signals as raw OpenAI server
        # events. We drive the browser transcript/indicator frames off those.
        data = event.data
        if getattr(data, "type", None) != "raw_server_event":
            return
        inner = getattr(data, "data", None)
        if not isinstance(inner, dict):
            return
        et = inner.get("type")
        if et == "input_audio_buffer.speech_started":
            await send_browser({"type": "speech.started"})
        elif et == "input_audio_buffer.speech_stopped":
            await send_browser({"type": "speech.stopped"})
        elif et == "conversation.item.input_audio_transcription.completed":
            transcript = inner.get("transcript") or ""
            if transcript:
                await send_browser(
                    {"type": "transcript.user.done", "text": transcript}
                )
        elif et in (
            "response.audio_transcript.delta",
            "response.output_audio_transcript.delta",
        ):
            delta = inner.get("delta") or ""
            if delta:
                await send_browser(
                    {"type": "transcript.assistant.delta", "text": delta}
                )
        elif et in (
            "response.audio_transcript.done",
            "response.output_audio_transcript.done",
        ):
            transcript = inner.get("transcript") or ""
            if transcript:
                await send_browser(
                    {"type": "transcript.assistant.done", "text": transcript}
                )
        return

    if isinstance(event, RealtimeError):
        err = event.error
        if isinstance(err, dict):
            msg = err.get("message", "Voice session error")
        else:
            msg = str(err)
        await send_browser({"type": "error", "message": msg})
        return
