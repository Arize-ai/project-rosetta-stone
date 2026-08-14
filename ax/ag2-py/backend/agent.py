"""Wonder Toys implemented with AG2 0.14's legacy ``autogen`` API."""

import asyncio
import json
import os
from collections.abc import AsyncIterator
from contextlib import nullcontext

from autogen import ConversableAgent

from backend.context import current_user_id
from backend.tools import cancel_order_tool, check_order_status, get_product_detail, purchase_product, search_products
try:
    from openinference.instrumentation import using_session, using_user
except ImportError:
    def using_session(_: str): return nullcontext()
    def using_user(_: str): return nullcontext()

SYSTEM_PROMPT = "You are the friendly Wonder Toys shopping assistant. Use your tools to find products, show details, purchase confirmed orders, check orders, and cancel eligible orders. Preserve exact local /product-images URLs returned by tools."
_TOOLS = [search_products, get_product_detail, purchase_product, check_order_status, cancel_order_tool]
_agents: dict[str, ConversableAgent] = {}
_turns: dict[str, int] = {}


def _build_agent() -> ConversableAgent:
    agent = ConversableAgent(
        name="wonder_toys",
        system_message=SYSTEM_PROMPT,
        llm_config={"config_list": [{"model": "gpt-5.4-mini", "api_key": os.environ["OPENAI_API_KEY"]}]},
        human_input_mode="NEVER",
    )
    for tool in _TOOLS:
        agent.register_for_llm(description=tool.__doc__ or tool.__name__)(tool)
        agent.register_for_execution()(tool)
    return agent


async def stream_agent(messages: list[dict], user_id: str) -> AsyncIterator[str]:
    """Run AG2's native tool loop and adapt its completed turn to the SSE contract."""
    completed_turns = sum(message.get("role") == "assistant" for message in messages)
    if user_id not in _agents or completed_turns < _turns.get(user_id, 0):
        _agents[user_id] = _build_agent()
    user_messages = [message for message in messages if message.get("role") == "user"]
    if not user_messages:
        yield "data: [DONE]\\n\\n"
        return
    token = current_user_id.set(user_id)
    session_context = using_session(user_id)
    user_context = using_user(user_id)
    session_context.__enter__()
    user_context.__enter__()
    try:
        agent = _agents[user_id]
        reply = await asyncio.to_thread(
            agent.generate_reply,
            messages=[{"role": "user", "content": user_messages[-1].get("content", "")}],
        )
        text = reply if isinstance(reply, str) else reply.get("content", "")
        if text:
            yield f"data: {json.dumps({'text': text})}\\n\\n"
    finally:
        user_context.__exit__(None, None, None)
        session_context.__exit__(None, None, None)
        current_user_id.reset(token)
    _turns[user_id] = completed_turns + 1
    yield "data: [DONE]\\n\\n"
