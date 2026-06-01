"""Arize AX tracing initialization.

This module MUST be imported before any beeai_framework imports so that the
BeeAI instrumentor can subscribe to the framework's root emitter.

Expects these environment variables:
  ARIZE_SPACE_ID     — Arize space ID
  ARIZE_API_KEY      — Arize API key
  ARIZE_PROJECT_NAME — Project name in Arize AX
"""

import os

from arize.otel import register
from openinference.instrumentation.beeai import BeeAIInstrumentor

_tracer_provider = register(
    space_id=os.environ["ARIZE_SPACE_ID"],
    api_key=os.environ["ARIZE_API_KEY"],
    project_name=os.environ.get("ARIZE_PROJECT_NAME", "wonder-toys-beeai-py"),
)

BeeAIInstrumentor().instrument(tracer_provider=_tracer_provider)
print("Arize AX tracing initialized for BeeAI.")
