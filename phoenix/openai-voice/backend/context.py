"""Per-request context variables shared between the agent and tools.

`current_user_id` is set by both voice and text-mode entry points so tool
functions can look up which authenticated user is making the call without
having to thread it through every signature.

`current_voice_callback` is set ONLY in voice mode. When tools that produce
visual results (search_products, get_product) run, they call the callback
with rendered markdown so the FastAPI WebSocket handler can forward it to
the browser as a `tool.result` frame. In text mode the model emits the
markdown directly in its streamed response, so the callback stays None.
"""

import contextvars
from typing import Awaitable, Callable, Optional

current_user_id: contextvars.ContextVar[str] = contextvars.ContextVar(
    "current_user_id", default="anonymous"
)

VoiceMarkdownCallback = Callable[[str, str], Awaitable[None]]

current_voice_callback: contextvars.ContextVar[Optional[VoiceMarkdownCallback]] = (
    contextvars.ContextVar("current_voice_callback", default=None)
)
