"""Arize AX tracing initialization.

This module MUST be imported before any dspy imports so the
OpenInference instrumentor wires into DSPy's internal hooks.

DSPy is built on LiteLLM, so we also install the LiteLLM instrumentor
to capture the underlying LLM calls (per Arize's recommended pattern).

Expects these environment variables:
  ARIZE_SPACE_ID    — Arize space ID
  ARIZE_API_KEY     — Arize API key
  ARIZE_PROJECT_NAME — Project name in Arize AX
"""

import os

from arize.otel import register
from openinference.instrumentation.dspy import DSPyInstrumentor
from openinference.instrumentation.litellm import LiteLLMInstrumentor

tracer_provider = register(
    space_id=os.environ["ARIZE_SPACE_ID"],
    api_key=os.environ["ARIZE_API_KEY"],
    project_name=os.environ["ARIZE_PROJECT_NAME"],
)

DSPyInstrumentor().instrument(tracer_provider=tracer_provider)
LiteLLMInstrumentor().instrument(tracer_provider=tracer_provider)
print(f"Arize AX tracing initialized for DSPy. Project: {os.environ['ARIZE_PROJECT_NAME']}")
