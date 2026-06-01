"""Phoenix tracing initialization for Haystack.

This module MUST be imported before any haystack imports so the
OpenInference HaystackInstrumentor is registered before any pipeline
components are constructed.

Expects these environment variables:
  PHOENIX_COLLECTOR_ENDPOINT — Phoenix Cloud base URL (e.g. https://app.phoenix.arize.com)
  PHOENIX_API_KEY            — Phoenix API key (read automatically by phoenix-otel)
  PHOENIX_PROJECT_NAME       — Project name in Phoenix
"""

import os

from phoenix.otel import register
from openinference.instrumentation.haystack import HaystackInstrumentor

_tracer_provider = register(
    endpoint=os.environ.get("PHOENIX_COLLECTOR_ENDPOINT"),
    project_name=os.environ.get("PHOENIX_PROJECT_NAME", "wonder-toys-haystack"),
    auto_instrument=False,
)

HaystackInstrumentor().instrument(tracer_provider=_tracer_provider)
print("Phoenix tracing initialized for Haystack.")
