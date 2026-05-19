"""Arize AX tracing initialization for Semantic Kernel.

This module MUST be imported before any `semantic_kernel` imports so that
the OpenLIT auto-instrumentation hooks into the SK and Anthropic SDK call
sites at import time.

Tracing pipeline:
  Semantic Kernel + Anthropic SDK
    -> OpenLIT auto-instrumentation (emits raw OTel spans)
    -> OpenInferenceSpanProcessor (reshapes into OpenInference semconv)
    -> arize.otel.BatchSpanProcessor (exports to Arize AX)

Expects these environment variables:
  ARIZE_SPACE_ID    — Arize space ID
  ARIZE_API_KEY     — Arize API key
  ARIZE_PROJECT_NAME — Project name in Arize AX
"""

import os

import openlit
from arize.otel import BatchSpanProcessor, PROJECT_NAME, Resource
from openinference.instrumentation.openlit import OpenInferenceSpanProcessor
from opentelemetry import trace as otel_trace
from opentelemetry.sdk.trace import TracerProvider

resource = Resource.create({PROJECT_NAME: os.environ["ARIZE_PROJECT_NAME"]})
tracer_provider = TracerProvider(resource=resource)

# Reshape raw OpenLIT spans into the OpenInference format Arize AX expects.
tracer_provider.add_span_processor(OpenInferenceSpanProcessor())
tracer_provider.add_span_processor(
    BatchSpanProcessor(
        space_id=os.environ["ARIZE_SPACE_ID"],
        api_key=os.environ["ARIZE_API_KEY"],
    )
)

otel_trace.set_tracer_provider(tracer_provider)

# openlit.init() auto-detects the global TracerProvider set above and patches
# the Semantic Kernel + Anthropic SDK call sites.
openlit.init()
print("Arize AX tracing initialized for Semantic Kernel.")
