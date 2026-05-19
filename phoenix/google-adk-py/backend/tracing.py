"""Phoenix tracing initialization.

This module MUST be imported before any google.adk imports so that the
ADK instrumentor can patch ADK's internals.

Expects these environment variables:
  PHOENIX_COLLECTOR_ENDPOINT — Phoenix base URL
  PHOENIX_API_KEY            — Phoenix API key (read automatically by phoenix-otel)
  PHOENIX_PROJECT_NAME       — Project name in Phoenix
"""

import os

from phoenix.otel import register
from openinference.instrumentation.google_adk import GoogleADKInstrumentor

_tracer_provider = register(
    endpoint=os.environ.get("PHOENIX_COLLECTOR_ENDPOINT"),
    project_name=os.environ.get("PHOENIX_PROJECT_NAME", "wonder-toys-google-adk-py"),
)

GoogleADKInstrumentor().instrument(tracer_provider=_tracer_provider)
