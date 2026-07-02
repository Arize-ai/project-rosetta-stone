"""Arize AX tracing initialization.

This module MUST be imported before any `claude_agent_sdk` imports so that the
OpenInference instrumentor patches the Claude Agent SDK before the agent client
is built.

Expects these environment variables:
  ARIZE_SPACE_ID     — Arize space ID
  ARIZE_API_KEY      — Arize API key
  ARIZE_PROJECT_NAME — Project name in Arize AX
"""

import os

from arize.otel import register
from openinference.instrumentation.claude_agent_sdk import ClaudeAgentSDKInstrumentor

_tracer_provider = register(
    space_id=os.environ.get("ARIZE_SPACE_ID", ""),
    api_key=os.environ.get("ARIZE_API_KEY", ""),
    project_name=os.environ.get("ARIZE_PROJECT_NAME", "wonder-toys-claude-agent-sdk-py"),
)

ClaudeAgentSDKInstrumentor().instrument(tracer_provider=_tracer_provider)
