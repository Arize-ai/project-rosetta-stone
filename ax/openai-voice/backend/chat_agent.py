"""Text-mode chat agent — OpenAI Chat Completions with tool calling.

This is the SSE-streaming text fallback used by the existing chat UI when
the user has not switched into voice mode. It mirrors the behavior of the
other Python tiers' agent.py: builds chat history, calls the LLM, iterates
events, yields SSE chunks, dispatches tool calls in a loop until the model
emits a final text response.
"""

from __future__ import annotations

import json
import os
from collections.abc import AsyncIterator

from openai import AsyncOpenAI

from backend.prompt import text_system_prompt
from backend.tools import call_tool, chat_tools
from backend.tracing import start_chat_span, tracer

MODEL = os.environ.get("OPENAI_TEXT_MODEL", "gpt-4o")

_client: AsyncOpenAI | None = None


def _get_client() -> AsyncOpenAI:
    global _client
    if _client is None:
        _client = AsyncOpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
    return _client


def _sse(text: str) -> str:
    return f"data: {json.dumps({'text': text})}\n\n"


async def stream_agent(messages: list[dict], user_id: str) -> AsyncIterator[str]:
    """Stream the assistant's response as SSE events.

    Yields strings shaped like 'data: {"text":"..."}\n\n' and finishes
    with 'data: [DONE]\n\n'. Handles tool-call cycles internally.
    """
    client = _get_client()

    chat_history: list[dict] = [
        {"role": "system", "content": text_system_prompt(user_id)},
    ]
    for msg in messages:
        role = msg.get("role", "user")
        content = msg.get("content", "")
        if role in ("user", "assistant", "system") and content:
            chat_history.append({"role": role, "content": content})

    if not any(m["role"] == "user" for m in chat_history):
        yield _sse("No message provided.")
        yield "data: [DONE]\n\n"
        return

    had_text_before = False
    in_tool_call = False
    last_user_msg = next(
        (m["content"] for m in reversed(chat_history) if m["role"] == "user"), ""
    )

    with tracer.start_as_current_span(
        "chat_turn",
        attributes={
            "openinference.span.kind": "AGENT",
            "input.value": last_user_msg[:10_000],
            "user.id": user_id,
        },
    ) as turn_span:
        full_response_parts: list[str] = []

        # Loop: stream → handle tool calls → re-stream → ... until finish_reason=stop
        for _ in range(8):  # bounded to prevent runaway tool loops
            llm_span = start_chat_span(MODEL, chat_history)
            stream = await client.chat.completions.create(
                model=MODEL,
                messages=chat_history,
                tools=chat_tools(),
                tool_choice="auto",
                stream=True,
            )

            assistant_text = ""
            tool_calls: dict[int, dict] = {}
            finish_reason: str | None = None

            try:
                async for chunk in stream:
                    if not chunk.choices:
                        continue
                    choice = chunk.choices[0]
                    delta = choice.delta

                    if delta.content:
                        if in_tool_call and had_text_before:
                            yield _sse("\n\n")
                        in_tool_call = False
                        had_text_before = True
                        assistant_text += delta.content
                        yield _sse(delta.content)

                    if delta.tool_calls:
                        for tc in delta.tool_calls:
                            idx = tc.index
                            entry = tool_calls.setdefault(
                                idx,
                                {"id": None, "name": "", "arguments": ""},
                            )
                            if tc.id:
                                entry["id"] = tc.id
                            if tc.function and tc.function.name:
                                entry["name"] = tc.function.name
                            if tc.function and tc.function.arguments:
                                entry["arguments"] += tc.function.arguments

                    if choice.finish_reason:
                        finish_reason = choice.finish_reason
            finally:
                llm_span.set_attribute("output.value", assistant_text[:10_000])
                if tool_calls:
                    llm_span.set_attribute(
                        "llm.tool_calls",
                        json.dumps([{"name": t["name"]} for t in tool_calls.values()]),
                    )
                llm_span.end()

            full_response_parts.append(assistant_text)

            if not tool_calls:
                break

            chat_history.append(
                {
                    "role": "assistant",
                    "content": assistant_text or None,
                    "tool_calls": [
                        {
                            "id": tc["id"],
                            "type": "function",
                            "function": {
                                "name": tc["name"],
                                "arguments": tc["arguments"],
                            },
                        }
                        for tc in tool_calls.values()
                    ],
                }
            )

            in_tool_call = True

            for tc in tool_calls.values():
                try:
                    args = json.loads(tc["arguments"] or "{}")
                except json.JSONDecodeError:
                    args = {}
                with tracer.start_as_current_span(
                    "llm.tool",
                    attributes={
                        "openinference.span.kind": "TOOL",
                        "tool.name": tc["name"],
                        "tool.parameters": json.dumps(args)[:5_000],
                    },
                ) as tool_span:
                    result = call_tool(tc["name"], args)
                    tool_span.set_attribute("tool.output", json.dumps(result)[:10_000])
                chat_history.append(
                    {
                        "role": "tool",
                        "tool_call_id": tc["id"],
                        "content": json.dumps(result),
                    }
                )

            if finish_reason != "tool_calls":
                break

        turn_span.set_attribute("output.value", "".join(full_response_parts)[:10_000])

    yield "data: [DONE]\n\n"
