"""Wonder Toys implemented with Together AI's native async client."""

import json
import os
from collections.abc import AsyncIterator
from contextlib import nullcontext

from together import AsyncTogether

from backend.context import current_user_id
from backend.tools import cancel_order_tool, check_order_status, get_product_detail, purchase_product, search_products
try:
    from openinference.instrumentation import using_session, using_user
except ImportError:
    def using_session(_: str): return nullcontext()
    def using_user(_: str): return nullcontext()

SYSTEM_PROMPT = "You are the friendly Wonder Toys shopping assistant. Use tools to find products, show details, purchase confirmed orders, check orders, and cancel eligible orders. Preserve exact local /product-images URLs returned by tools."

_FUNCTIONS = {tool.__name__: tool for tool in (search_products, get_product_detail, purchase_product, check_order_status, cancel_order_tool)}
_TOOLS = [
    {"type": "function", "function": {"name": "search_products", "description": "Search the toy inventory.", "parameters": {"type": "object", "properties": {"query": {"type": "string"}, "keywords": {"type": "array", "items": {"type": "string"}}, "min_age": {"type": "integer"}, "max_age": {"type": "integer"}, "category": {"type": "string"}}}}},
    {"type": "function", "function": {"name": "get_product_detail", "description": "Get a product by ID.", "parameters": {"type": "object", "properties": {"product_id": {"type": "string"}}, "required": ["product_id"]}}},
    {"type": "function", "function": {"name": "purchase_product", "description": "Purchase confirmed items using shipping details.", "parameters": {"type": "object", "properties": {"items": {"type": "array", "items": {"type": "object"}}, "shipping_name": {"type": "string"}, "shipping_street": {"type": "string"}, "shipping_city": {"type": "string"}, "shipping_state": {"type": "string"}, "shipping_zip": {"type": "string"}, "shipping_country": {"type": "string"}}, "required": ["items", "shipping_name", "shipping_street", "shipping_city", "shipping_state", "shipping_zip", "shipping_country"]}}},
    {"type": "function", "function": {"name": "check_order_status", "description": "Check an order status.", "parameters": {"type": "object", "properties": {"order_id": {"type": "string"}, "product_query": {"type": "string"}}}}},
    {"type": "function", "function": {"name": "cancel_order_tool", "description": "Cancel an undelivered order.", "parameters": {"type": "object", "properties": {"order_id": {"type": "string"}}, "required": ["order_id"]}}},
]
_histories: dict[str, list[dict]] = {}
_assistant_turns: dict[str, int] = {}


def _run_tool(name: str, arguments: dict) -> dict:
    try:
        return _FUNCTIONS[name](**arguments)
    except (KeyError, TypeError, ValueError) as error:
        return {"error": str(error)}


async def stream_agent(messages: list[dict], user_id: str) -> AsyncIterator[str]:
    completed_turns = sum(message.get("role") == "assistant" for message in messages)
    if user_id not in _histories or completed_turns < _assistant_turns.get(user_id, 0):
        _histories[user_id] = [{"role": "system", "content": SYSTEM_PROMPT}]
    user_messages = [message for message in messages if message.get("role") == "user"]
    if not user_messages:
        yield "data: [DONE]\\n\\n"
        return

    history = _histories[user_id]
    history.append({"role": "user", "content": user_messages[-1].get("content", "")})
    token = current_user_id.set(user_id)
    session_context = using_session(user_id)
    user_context = using_user(user_id)
    session_context.__enter__()
    user_context.__enter__()
    try:
        client = AsyncTogether(api_key=os.environ["TOGETHER_API_KEY"])
        while True:
            stream = await client.chat.completions.create(model="meta-llama/Llama-3.3-70B-Instruct-Turbo", messages=history, tools=_TOOLS, stream=True)
            response_text = ""
            calls_by_index: dict[int, dict] = {}
            async for chunk in stream:
                if not chunk.choices:
                    continue
                delta = chunk.choices[0].delta
                if delta.content:
                    response_text += delta.content
                    yield f"data: {json.dumps({'text': delta.content})}\\n\\n"
                for call in delta.tool_calls or []:
                    assembled = calls_by_index.setdefault(call.index, {"id": call.id, "type": "function", "function": {"name": "", "arguments": ""}})
                    if call.id:
                        assembled["id"] = call.id
                    if call.function.name:
                        assembled["function"]["name"] += call.function.name
                    if call.function.arguments:
                        assembled["function"]["arguments"] += call.function.arguments

            calls = list(calls_by_index.values())
            if not calls:
                history.append({"role": "assistant", "content": response_text})
                break
            history.append({"role": "assistant", "content": response_text, "tool_calls": calls})
            for call in calls:
                result = _run_tool(call["function"]["name"], json.loads(call["function"]["arguments"] or "{}"))
                history.append({"role": "tool", "tool_call_id": call["id"], "content": json.dumps(result)})
    finally:
        user_context.__exit__(None, None, None)
        session_context.__exit__(None, None, None)
        current_user_id.reset(token)
    _assistant_turns[user_id] = completed_turns + 1
    yield "data: [DONE]\\n\\n"
