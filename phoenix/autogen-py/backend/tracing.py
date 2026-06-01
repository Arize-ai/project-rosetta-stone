"""Phoenix tracing initialization for AutoGen AgentChat.

This module MUST be imported before any `autogen_agentchat` imports so the
AutogenAgentChatInstrumentor wraps the AssistantAgent class before any
instance is created.

We use the AgentChat-layer instrumentation (`openinference-instrumentation-
autogen-agentchat`) rather than the lower-level `openinference-instrumentation-
autogen` package because we build the agent with the high-level AgentChat
:class:`AssistantAgent` pattern.

Expects these environment variables:
  PHOENIX_COLLECTOR_ENDPOINT - Phoenix Cloud OTLP HTTP endpoint
                                (e.g. https://app.phoenix.arize.com/v1/traces
                                or http://localhost:6006/v1/traces)
  PHOENIX_API_KEY            - Phoenix API key (Phoenix Cloud only - picked
                                up automatically by phoenix-otel)
  PHOENIX_PROJECT_NAME       - Project name in Phoenix
"""

import os

from openinference.instrumentation.autogen_agentchat import (
    AutogenAgentChatInstrumentor,
)
from phoenix.otel import register

_tracer_provider = register(
    endpoint=os.environ.get("PHOENIX_COLLECTOR_ENDPOINT"),
    project_name=os.environ.get("PHOENIX_PROJECT_NAME", "wonder-toys-autogen"),
    auto_instrument=False,
)

AutogenAgentChatInstrumentor().instrument(tracer_provider=_tracer_provider)
print("Phoenix tracing initialized for AutoGen AgentChat.")
