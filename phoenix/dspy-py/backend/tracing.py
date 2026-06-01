"""Phoenix tracing initialization.

This module MUST be imported before any dspy imports so the
OpenInference instrumentor wires into DSPy's internal hooks.

DSPy is built on LiteLLM, so we also install the LiteLLM instrumentor
to capture the underlying LLM calls (per Arize's recommended pattern).

Expects these environment variables:
  PHOENIX_COLLECTOR_ENDPOINT — Phoenix Cloud base URL (e.g. https://app.phoenix.arize.com)
  PHOENIX_API_KEY            — Phoenix API key (read automatically by phoenix-otel)
  PHOENIX_PROJECT_NAME       — Project name in Phoenix
"""

import os

from phoenix.otel import register
from openinference.instrumentation.dspy import DSPyInstrumentor
from openinference.instrumentation.litellm import LiteLLMInstrumentor

tracer_provider = register(
    endpoint=os.environ.get("PHOENIX_COLLECTOR_ENDPOINT"),
    project_name=os.environ.get("PHOENIX_PROJECT_NAME", "wonder-toys-dspy"),
)

DSPyInstrumentor().instrument(tracer_provider=tracer_provider)
LiteLLMInstrumentor().instrument(tracer_provider=tracer_provider)
