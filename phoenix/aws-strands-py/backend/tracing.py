"""Phoenix tracing initialization for AWS Strands.

This module MUST be imported before any `strands` imports so that the
OpenTelemetry tracer provider is set globally before Strands' singleton
tracer caches its reference to it.

Strands emits its own OpenTelemetry spans (via `trace.get_tracer(...)` and
`get_tracer_provider()`). The `StrandsAgentsToOpenInferenceProcessor`
mutates those spans in-place, reshaping them into OpenInference format
before they are exported to Phoenix.

Expects these environment variables:
  PHOENIX_COLLECTOR_ENDPOINT — Phoenix Cloud base URL (e.g. https://app.phoenix.arize.com)
                               or full OTLP traces endpoint
  PHOENIX_API_KEY            — Phoenix API key (read automatically by phoenix-otel)
  PHOENIX_PROJECT_NAME       — Project name in Phoenix
"""

import os

from opentelemetry import trace
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider

from phoenix.otel import BatchSpanProcessor, PROJECT_NAME

from openinference.instrumentation.strands_agents import (
    StrandsAgentsToOpenInferenceProcessor,
)

tracer_provider = TracerProvider(
    resource=Resource.create(
        {PROJECT_NAME: os.getenv("PHOENIX_PROJECT_NAME", "wonder-toys-aws-strands")}
    )
)

# Processor ordering matters: the OpenInference processor mutates spans
# in-place, so it must run before the exporter sees them.
tracer_provider.add_span_processor(StrandsAgentsToOpenInferenceProcessor())
tracer_provider.add_span_processor(
    BatchSpanProcessor(endpoint=os.environ.get("PHOENIX_COLLECTOR_ENDPOINT"))
)
trace.set_tracer_provider(tracer_provider)
