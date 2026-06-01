"""Phoenix tracing initialization.

This module MUST be imported before any beeai_framework imports so that the
BeeAI instrumentor can subscribe to the framework's root emitter.

Expects these environment variables:
  PHOENIX_COLLECTOR_ENDPOINT — Phoenix base URL
  PHOENIX_API_KEY            — Phoenix API key (read automatically by phoenix-otel)
  PHOENIX_PROJECT_NAME       — Project name in Phoenix
"""

import os

from phoenix.otel import register
from openinference.instrumentation.beeai import BeeAIInstrumentor

_tracer_provider = register(
    endpoint=os.environ.get("PHOENIX_COLLECTOR_ENDPOINT"),
    project_name=os.environ.get("PHOENIX_PROJECT_NAME", "wonder-toys-beeai-py"),
)

BeeAIInstrumentor().instrument(tracer_provider=_tracer_provider)
