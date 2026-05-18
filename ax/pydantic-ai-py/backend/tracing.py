"""Arize AX tracing initialization.

This module MUST be imported before any pydantic_ai imports so that
the OpenInference span processor is registered before the agent is built.

Pydantic AI emits OpenTelemetry spans via its built-in instrumentation
(Agent.instrument_all). OpenInferenceSpanProcessor reshapes those spans
into OpenInference format before they are exported to Arize AX.

Expects these environment variables:
  ARIZE_SPACE_ID    — Arize space ID
  ARIZE_API_KEY     — Arize API key
  ARIZE_PROJECT_NAME — Project name in Arize AX
"""

import os

from arize.otel import BatchSpanProcessor, PROJECT_NAME, Resource
from openinference.instrumentation.pydantic_ai import OpenInferenceSpanProcessor
from opentelemetry import trace as otel_trace
from opentelemetry.sdk.trace import TracerProvider
from pydantic_ai import Agent, InstrumentationSettings

resource = Resource.create({
    PROJECT_NAME: os.environ["ARIZE_PROJECT_NAME"],
})
tracer_provider = TracerProvider(resource=resource)

tracer_provider.add_span_processor(OpenInferenceSpanProcessor())
tracer_provider.add_span_processor(
    BatchSpanProcessor(
        space_id=os.environ["ARIZE_SPACE_ID"],
        api_key=os.environ["ARIZE_API_KEY"],
    )
)

otel_trace.set_tracer_provider(tracer_provider)

# Enable Pydantic AI's built-in OTel instrumentation on every Agent instance.
Agent.instrument_all(InstrumentationSettings(tracer_provider=tracer_provider))
print("Arize AX tracing initialized for Pydantic AI.")
