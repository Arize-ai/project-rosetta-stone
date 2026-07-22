"""Phoenix tracing initialization.

This module MUST be imported before any crewai imports so that the
CrewAI instrumentor can patch CrewAI's internals.

Expects these environment variables:
  PHOENIX_COLLECTOR_ENDPOINT — Phoenix base URL
  PHOENIX_API_KEY            — Phoenix API key (read automatically by phoenix-otel)
  PHOENIX_PROJECT_NAME       — Project name in Phoenix
"""

import os

from phoenix.otel import register
from openinference.instrumentation.anthropic import AnthropicInstrumentor
from openinference.instrumentation.crewai import CrewAIInstrumentor

_tracer_provider = register(
    endpoint=os.environ.get("PHOENIX_COLLECTOR_ENDPOINT"),
    project_name=os.environ.get("PHOENIX_PROJECT_NAME", "wonder-toys-crewai-py"),
)

# CrewAIInstrumentor emits the crew/agent/task and tool spans. It does NOT emit
# LLM spans: crewai 1.x routes the "anthropic/..." model through the native
# Anthropic SDK, so the model calls are captured by AnthropicInstrumentor.
CrewAIInstrumentor().instrument(tracer_provider=_tracer_provider)
AnthropicInstrumentor().instrument(tracer_provider=_tracer_provider)
