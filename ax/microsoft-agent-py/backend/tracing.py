"""Arize AX tracing initialization.

This module MUST be imported before any agent_framework imports so that
the OpenInference span processor is registered before the agent is built.

The Microsoft Agent Framework emits telemetry using GenAI semantic conventions.
AgentFrameworkToOpenInferenceProcessor transforms those spans to OpenInference
format before they are exported to Arize AX.

Expects these environment variables:
  ARIZE_SPACE_ID    — Arize space ID
  ARIZE_API_KEY     — Arize API key
  ARIZE_PROJECT_NAME — Project name in Arize AX
"""

import os

from agent_framework.observability import enable_instrumentation
from arize.otel import BatchSpanProcessor, PROJECT_NAME, Resource
from openinference.instrumentation.agent_framework import (
    AgentFrameworkToOpenInferenceProcessor,
)
from opentelemetry import trace as otel_trace
from opentelemetry.sdk.trace import TracerProvider

resource = Resource.create({
    PROJECT_NAME: os.environ["ARIZE_PROJECT_NAME"],
})
tracer_provider = TracerProvider(resource=resource)

tracer_provider.add_span_processor(AgentFrameworkToOpenInferenceProcessor())
tracer_provider.add_span_processor(
    BatchSpanProcessor(
        space_id=os.environ["ARIZE_SPACE_ID"],
        api_key=os.environ["ARIZE_API_KEY"],
    )
)

otel_trace.set_tracer_provider(tracer_provider)

enable_instrumentation(enable_sensitive_data=True)
print("Arize AX tracing initialized for Microsoft Agent Framework.")
