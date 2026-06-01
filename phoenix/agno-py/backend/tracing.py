"""Phoenix tracing initialization for Agno.

This module MUST be imported before any `agno` imports so the
AgnoInstrumentor wraps the Agent class before it's instantiated.

Expects these environment variables:
  PHOENIX_COLLECTOR_ENDPOINT — Phoenix Cloud OTLP HTTP endpoint
                                (e.g. https://app.phoenix.arize.com/v1/traces
                                or http://localhost:6006/v1/traces)
  PHOENIX_API_KEY            — Phoenix API key (Phoenix Cloud only — picked
                                up automatically by phoenix-otel)
  PHOENIX_PROJECT_NAME       — Project name in Phoenix
"""

import os

from openinference.instrumentation.agno import AgnoInstrumentor
from phoenix.otel import register

_tracer_provider = register(
    endpoint=os.environ.get("PHOENIX_COLLECTOR_ENDPOINT"),
    project_name=os.environ.get("PHOENIX_PROJECT_NAME", "wonder-toys-agno"),
    auto_instrument=False,
)

AgnoInstrumentor().instrument(tracer_provider=_tracer_provider)
print("Phoenix tracing initialized for Agno.")
