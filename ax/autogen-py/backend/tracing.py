"""Arize AX tracing initialization for AutoGen AgentChat.

This module MUST be imported before any `autogen_agentchat` imports so the
AutogenAgentChatInstrumentor wraps the AssistantAgent class before any
instance is created.

We use the AgentChat-layer instrumentation (`openinference-instrumentation-
autogen-agentchat`) rather than the lower-level `openinference-instrumentation-
autogen` package because we build the agent with the high-level AgentChat
:class:`AssistantAgent` pattern.

Expects these environment variables:
  ARIZE_SPACE_ID    - Arize space ID
  ARIZE_API_KEY     - Arize API key
  ARIZE_PROJECT_NAME - Project name in Arize AX
"""

import os

from arize.otel import register
from openinference.instrumentation.autogen_agentchat import (
    AutogenAgentChatInstrumentor,
)

_tracer_provider = register(
    space_id=os.environ["ARIZE_SPACE_ID"],
    api_key=os.environ["ARIZE_API_KEY"],
    project_name=os.environ.get("ARIZE_PROJECT_NAME", "wonder-toys-autogen"),
)

AutogenAgentChatInstrumentor().instrument(tracer_provider=_tracer_provider)
print("Arize AX tracing initialized for AutoGen AgentChat.")
