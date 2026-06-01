"""Arize AX tracing initialization for AWS Strands.

This module MUST be imported before any `strands` imports so that the
OpenTelemetry tracer provider is set globally before Strands' singleton
tracer caches its reference to it.

Strands emits its own OpenTelemetry spans (via `trace.get_tracer(...)` and
`get_tracer_provider()`). The `StrandsAgentsToOpenInferenceProcessor`
mutates those spans in-place, reshaping them into OpenInference format
before they are exported to Arize AX.

Expects these environment variables:
  ARIZE_SPACE_ID    — Arize space ID
  ARIZE_API_KEY     — Arize API key
  ARIZE_PROJECT_NAME — Project name in Arize AX
"""

import os

from arize.otel import BatchSpanProcessor, PROJECT_NAME, Resource
from openinference.instrumentation.strands_agents import (
    StrandsAgentsToOpenInferenceProcessor,
)
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider

tracer_provider = TracerProvider(
    resource=Resource.create({PROJECT_NAME: os.environ["ARIZE_PROJECT_NAME"]})
)

# Processor ordering matters: the OpenInference processor mutates spans
# in-place, so it must run before the exporter sees them.
tracer_provider.add_span_processor(StrandsAgentsToOpenInferenceProcessor())
tracer_provider.add_span_processor(
    BatchSpanProcessor(
        space_id=os.environ["ARIZE_SPACE_ID"],
        api_key=os.environ["ARIZE_API_KEY"],
    )
)
trace.set_tracer_provider(tracer_provider)
