"""Phoenix tracing initialization.

This module MUST be imported before any smolagents imports so that the
SmolagentsInstrumentor can patch smolagents' internals.

Expects these environment variables:
  PHOENIX_COLLECTOR_ENDPOINT — Phoenix base URL (e.g. https://app.phoenix.arize.com)
  PHOENIX_API_KEY            — Phoenix API key (read automatically by phoenix-otel)
  PHOENIX_PROJECT_NAME       — Project name in Phoenix
"""

import os

from phoenix.otel import register
from openinference.instrumentation.smolagents import SmolagentsInstrumentor

_tracer_provider = register(
    endpoint=os.environ.get("PHOENIX_COLLECTOR_ENDPOINT"),
    project_name=os.environ.get("PHOENIX_PROJECT_NAME", "wonder-toys-smolagents"),
)

SmolagentsInstrumentor().instrument(tracer_provider=_tracer_provider)
print("Phoenix tracing initialized for smolagents.")
