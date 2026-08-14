"""Wonder Toys implemented with Ollama's native async client."""

import json
import os
from collections.abc import AsyncIterator
from contextlib import nullcontext

from ollama import AsyncClient

from backend.context import current_user_id
from backend.tools import (
    cancel_order_tool,
    check_order_status,
    get_product_detail,
    purchase_product,
    search_products,
)
try:
    from openinference.instrumentation import using_session, using_user
except ImportError:
    def using_session(_: str): return nullcontext()
    def using_user(_: str): return nullcontext()

SYSTEM_PROMPT = """You are the friendly Wonder Toys shopping assistant. Use the
available tools to find products, show details, purchase confirmed orders, check
orders, and cancel eligible orders. Preserve the exact local image URL returned
by a tool (for example /product-images/toy-001.png) when showing products."""

_TOOLS = [search_products, get_product_detail, purchase_product, check_order_status, cancel_order_tool]
_FUNCTIONS = {tool.__name__: tool for tool in _TOOLS}
_histories: dict[str, list[dict]] = {}
_assistant_turns: dict[str, int] = {}


def _run_tool(name: str, arguments: dict) -> dict:
    tool = _FUNCTIONS.get(name)
    if tool is None:
        return {"error": f"Unknown tool: {name}"}
    try:
        return tool(**arguments)
    except Exception as error:
        return {"error": str(error)}


async def stream_agent(messages: list[dict], user_id: str) -> AsyncIterator[str]:
    """Run the native Ollama tool loop and forward text as the shared SSE format."""
    completed_turns = sum(message.get("role") == "assistant" for message in messages)
    if user_id not in _histories or completed_turns < _assistant_turns.get(user_id, 0):
        _histories[user_id] = [{"role": "system", "content": SYSTEM_PROMPT}]

    user_messages = [message for message in messages if message.get("role") == "user"]
    if not user_messages:
        yield "data: [DONE]\\n\\n"
        return

    history = _histories[user_id]
    history.append({"role": "user", "content": user_messages[-1].get("content", "")})
    host = os.environ.get("OLLAMA_HOST")
    client = AsyncClient(host=host) if host else AsyncClient()
    token = current_user_id.set(user_id)
    session_context = using_session(user_id)
    user_context = using_user(user_id)
    session_context.__enter__()
    user_context.__enter__()
    try:
        while True:
            stream = await client.chat(
                model="llama3.2:1b", messages=history, tools=_TOOLS, stream=True
            )
            response_text = ""
            tool_calls = []
            async for chunk in stream:
                content = chunk.message.content or ""
                if content:
                    response_text += content
                    yield f"data: {json.dumps({'text': content})}\\n\\n"
                tool_calls.extend(chunk.message.tool_calls or [])

            if not tool_calls:
                history.append({"role": "assistant", "content": response_text})
                break

            history.append({
                "role": "assistant",
                "content": response_text,
                "tool_calls": [call.model_dump() for call in tool_calls],
            })
            for call in tool_calls:
                arguments = call.function.arguments
                if not isinstance(arguments, dict):
                    arguments = json.loads(arguments or "{}")
                result = _run_tool(call.function.name, arguments)
                history.append({
                    "role": "tool",
                    "tool_name": call.function.name,
                    "content": json.dumps(result),
                })
    finally:
        user_context.__exit__(None, None, None)
        session_context.__exit__(None, None, None)
        current_user_id.reset(token)

    _assistant_turns[user_id] = completed_turns + 1
    yield "data: [DONE]\\n\\n"
