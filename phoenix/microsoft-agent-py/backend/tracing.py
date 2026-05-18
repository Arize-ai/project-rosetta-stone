"""Phoenix tracing initialization.

This module MUST be imported before any agent_framework imports so that
the OpenInference span processor is registered before the agent is built.

The Microsoft Agent Framework emits telemetry using GenAI semantic conventions.
AgentFrameworkToOpenInferenceProcessor transforms those spans to OpenInference
format before they are exported to Phoenix.

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

from agent_framework.observability import enable_instrumentation

from openinference.instrumentation.agent_framework import (
    AgentFrameworkToOpenInferenceProcessor,
)

tracer_provider = TracerProvider(
    resource=Resource.create(
        {PROJECT_NAME: os.getenv("PHOENIX_PROJECT_NAME", "agent-framework")}
    )
)

# Process spans before exporting them to Phoenix.
tracer_provider.add_span_processor(AgentFrameworkToOpenInferenceProcessor())
tracer_provider.add_span_processor(
    BatchSpanProcessor(endpoint=os.environ.get("PHOENIX_COLLECTOR_ENDPOINT"))
)
trace.set_tracer_provider(tracer_provider)

enable_instrumentation(enable_sensitive_data=True)
