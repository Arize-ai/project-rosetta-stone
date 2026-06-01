"""Arize AX tracing initialization for Agno.

This module MUST be imported before any `agno` imports so the
AgnoInstrumentor wraps the Agent class before it's instantiated.

Expects these environment variables:
  ARIZE_SPACE_ID     — Arize space ID
  ARIZE_API_KEY      — Arize API key
  ARIZE_PROJECT_NAME — Project name in Arize AX
"""

import os

from arize.otel import register
from openinference.instrumentation.agno import AgnoInstrumentor

_tracer_provider = register(
    space_id=os.environ["ARIZE_SPACE_ID"],
    api_key=os.environ["ARIZE_API_KEY"],
    project_name=os.environ.get("ARIZE_PROJECT_NAME", "wonder-toys-agno"),
)

AgnoInstrumentor().instrument(tracer_provider=_tracer_provider)
print("Arize AX tracing initialized for Agno.")
