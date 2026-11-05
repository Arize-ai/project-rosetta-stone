"""Arize AX tracing initialization.

This module MUST be imported before any crewai imports so that the
CrewAI instrumentor can patch CrewAI's internals.

Expects these environment variables:
  ARIZE_SPACE_ID    — Arize space ID
  ARIZE_API_KEY     — Arize API key
  ARIZE_PROJECT_NAME — Project name in Arize AX
"""

import os

from arize.otel import register
from openinference.instrumentation.crewai import CrewAIInstrumentor
from openinference.instrumentation.anthropic import AnthropicInstrumentor

# Framework instrumentation already records each Anthropic model call.
# Disable native SDK spans before any clients are constructed.
os.environ["ANTHROPIC_OPEN_TELEMETRY"] = "false"

_tracer_provider = register(
    space_id=os.environ["ARIZE_SPACE_ID"],
    api_key=os.environ["ARIZE_API_KEY"],
    project_name=os.environ.get("ARIZE_PROJECT_NAME", "wonder-toys-crewai-py"),
)

CrewAIInstrumentor().instrument(tracer_provider=_tracer_provider)
AnthropicInstrumentor().instrument(tracer_provider=_tracer_provider)

print("Arize AX tracing initialized for CrewAI.")
