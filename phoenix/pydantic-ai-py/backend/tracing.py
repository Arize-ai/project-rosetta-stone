"""Phoenix tracing initialization.

This module MUST be imported before any pydantic_ai imports so that
the OpenInference span processor is registered before the agent is built.

Pydantic AI emits OpenTelemetry spans via its built-in instrumentation.
OpenInferenceSpanProcessor reshapes those spans into OpenInference format
before they are exported to Phoenix.

Expects these environment variables:
  PHOENIX_COLLECTOR_ENDPOINT — Phoenix Cloud base URL (e.g. https://app.phoenix.arize.com)
  PHOENIX_API_KEY            — Phoenix API key (read automatically by phoenix-otel)
  PHOENIX_PROJECT_NAME       — Project name in Phoenix
"""

import os

from opentelemetry import trace
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider

from phoenix.otel import BatchSpanProcessor, PROJECT_NAME

from pydantic_ai import Agent, InstrumentationSettings

from openinference.instrumentation.pydantic_ai import OpenInferenceSpanProcessor

tracer_provider = TracerProvider(
    resource=Resource.create(
        {PROJECT_NAME: os.getenv("PHOENIX_PROJECT_NAME", "pydantic-ai")}
    )
)

# Reshape Pydantic AI spans into OpenInference format before exporting.
tracer_provider.add_span_processor(OpenInferenceSpanProcessor())
tracer_provider.add_span_processor(
    BatchSpanProcessor(endpoint=os.environ.get("PHOENIX_COLLECTOR_ENDPOINT"))
)
trace.set_tracer_provider(tracer_provider)

# Enable Pydantic AI's built-in OTel instrumentation on every Agent instance.
Agent.instrument_all(InstrumentationSettings(tracer_provider=tracer_provider))
