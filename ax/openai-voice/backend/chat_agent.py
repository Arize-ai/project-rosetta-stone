"""Text-mode chat agent — OpenAI Agents SDK `Agent` + `Runner`.

The same five `@function_tool` wrappers from `backend.tools` are reused
here, so a single change updates both voice and text modes. This is the
text fallback used by the chat UI when the user hasn't toggled into voice
mode; it streams SSE events shaped like the other Python tiers' agents.
"""

from __future__ import annotations

import json
import os
from collections.abc import AsyncIterator

from agents import Agent, Runner, SQLiteSession, flush_traces
from openai.types.responses import ResponseTextDeltaEvent

from backend.context import current_user_id
from backend.prompt import text_system_prompt
from backend.tools import all_tools

MODEL = os.environ.get("OPENAI_TEXT_MODEL", "gpt-5.4-mini")

_agent: Agent | None = None
_sessions: dict[str, SQLiteSession] = {}
_session_turns: dict[str, int] = {}


def _get_agent(user_id: str) -> Agent:
    global _agent
    if _agent is None:
        _agent = Agent(
            name="WonderToys",
            instructions=text_system_prompt(user_id),
            model=MODEL,
            tools=all_tools,
        )
    return _agent


def _get_session(user_id: str) -> SQLiteSession:
    session = _sessions.get(user_id)
    if session is None:
        session = SQLiteSession(f"wonder-toys-openai-voice-{user_id}")
        _sessions[user_id] = session
    return session


def _sse(text: str) -> str:
    return f"data: {json.dumps({'text': text})}\n\n"


async def stream_agent(messages: list[dict], user_id: str) -> AsyncIterator[str]:
    """Stream the assistant's response as SSE events."""
    agent = _get_agent(user_id)

    # Detect conversation reset (browser refresh): if the client sends a
    # message list with fewer assistant turns than we've recorded for this
    # user, drop the per-user SQLite session and start fresh.
    assistant_turns = len([m for m in messages if m.get("role") == "assistant"])
    existing_turns = _session_turns.get(user_id, 0)

    if user_id not in _sessions or assistant_turns < existing_turns:
        old = _sessions.pop(user_id, None)
        if old is not None:
            await old.clear_session()
        _session_turns[user_id] = 0

    session = _get_session(user_id)

    user_messages = [m for m in messages if m.get("role") == "user"]
    if not user_messages:
        yield "data: [DONE]\n\n"
        return

    last_message = user_messages[-1].get("content", "")

    had_text_before = False
    in_tool_call = False

    token = current_user_id.set(user_id)
    try:
        result = Runner.run_streamed(agent, last_message, session=session)
        async for event in result.stream_events():
            if event.type == "run_item_stream_event":
                if event.item.type == "tool_call_item":
                    in_tool_call = True
                continue
            if event.type == "raw_response_event" and isinstance(
                event.data, ResponseTextDeltaEvent
            ):
                delta = event.data.delta
                if not delta:
                    continue
                if in_tool_call and had_text_before:
                    yield _sse("\n\n")
                in_tool_call = False
                had_text_before = True
                yield _sse(delta)
    finally:
        current_user_id.reset(token)
        # Long-running servers don't auto-flush the Agents SDK trace processors;
        # call flush_traces() in the finally block so spans reach the OTel
        # BatchSpanProcessor (which then flushes to Arize AX).
        flush_traces()

    _session_turns[user_id] = assistant_turns + 1
    yield "data: [DONE]\n\n"
