"""Phoenix tracing initialization.

This module MUST be imported before any `claude_agent_sdk` imports so that the
OpenInference instrumentor patches the Claude Agent SDK before the agent client
is built.

Expects these environment variables:
  PHOENIX_COLLECTOR_ENDPOINT — Phoenix Cloud base URL (e.g. https://app.phoenix.arize.com)
                               or local Phoenix endpoint (http://localhost:6006)
  PHOENIX_API_KEY            — Phoenix API key (read automatically by phoenix-otel)
  PHOENIX_PROJECT_NAME       — Project name in Phoenix
"""

import os

from phoenix.otel import register
from openinference.instrumentation.claude_agent_sdk import ClaudeAgentSDKInstrumentor

_tracer_provider = register(
    project_name=os.environ.get("PHOENIX_PROJECT_NAME", "wonder-toys-claude-agent-sdk-py"),
    protocol="http/protobuf",
    batch=True,
)

ClaudeAgentSDKInstrumentor().instrument(tracer_provider=_tracer_provider)
