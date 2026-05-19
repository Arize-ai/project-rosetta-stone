"""Async context variables shared between the agent and tools."""

import contextvars

# Set before each agent.run_stream() call so tools can look up the current user
current_user_id: contextvars.ContextVar[str] = contextvars.ContextVar(
    "current_user_id", default="anonymous"
)
