"""Arize AX tracing initialization for Haystack.

This module MUST be imported before any haystack imports so the
OpenInference HaystackInstrumentor is registered before any pipeline
components are constructed.

Expects these environment variables:
  ARIZE_SPACE_ID     — Arize space ID
  ARIZE_API_KEY      — Arize API key
  ARIZE_PROJECT_NAME — Project name in Arize AX
"""

import os

from arize.otel import register
from openinference.instrumentation.haystack import HaystackInstrumentor

_tracer_provider = register(
    space_id=os.environ["ARIZE_SPACE_ID"],
    api_key=os.environ["ARIZE_API_KEY"],
    project_name=os.environ.get("ARIZE_PROJECT_NAME", "wonder-toys-haystack"),
)

HaystackInstrumentor().instrument(tracer_provider=_tracer_provider)
print("Arize AX tracing initialized for Haystack.")
