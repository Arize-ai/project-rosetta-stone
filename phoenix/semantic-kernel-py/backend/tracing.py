"""Phoenix Cloud tracing initialization for Semantic Kernel.

This module MUST be imported before any `semantic_kernel` imports so that
the OpenLIT auto-instrumentation hooks into the SK and Anthropic SDK call
sites at import time.

Tracing pipeline:
  Semantic Kernel + Anthropic SDK
    -> OpenLIT auto-instrumentation (emits raw OTel spans)
    -> OpenInferenceSpanProcessor (reshapes into OpenInference semconv)
    -> BatchSpanProcessor (exports to Phoenix Cloud over OTLP/HTTP)

Expects these environment variables:
  PHOENIX_COLLECTOR_ENDPOINT — Phoenix Cloud OTLP base URL (e.g. https://app.phoenix.arize.com/v1/traces)
  PHOENIX_API_KEY            — Phoenix API key (read automatically by phoenix-otel)
  PHOENIX_PROJECT_NAME       — Project name in Phoenix
"""

import os

import openlit
from opentelemetry import trace as otel_trace
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider

from openinference.instrumentation.openlit import OpenInferenceSpanProcessor
from phoenix.otel import BatchSpanProcessor, PROJECT_NAME

resource = Resource.create(
    {PROJECT_NAME: os.getenv("PHOENIX_PROJECT_NAME", "wonder-toys-semantic-kernel")}
)
tracer_provider = TracerProvider(resource=resource)

# Reshape raw OpenLIT spans into the OpenInference format Phoenix expects.
tracer_provider.add_span_processor(OpenInferenceSpanProcessor())
tracer_provider.add_span_processor(
    BatchSpanProcessor(endpoint=os.environ.get("PHOENIX_COLLECTOR_ENDPOINT"))
)

otel_trace.set_tracer_provider(tracer_provider)

# openlit.init() auto-detects the global TracerProvider set above and patches
# the Semantic Kernel + Anthropic SDK call sites.
openlit.init()
print("Phoenix tracing initialized for Semantic Kernel.")
