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

from phoenix.otel import register
from openinference.instrumentation.agent_framework import AgentFrameworkToOpenInferenceProcessor
from agent_framework.observability import enable_instrumentation

_tracer_provider = register(
    project_name=os.environ.get("PHOENIX_PROJECT_NAME", "wonder-toys-microsoft-agent-py"),
    batch=True,
)

# Add the OpenInference processor alongside register()'s BatchSpanProcessor.
# replace_default_processor=False keeps Phoenix's BatchSpanProcessor in place.
# Execution order per span:
#   1. BatchSpanProcessor.on_end() — queues span reference
#   2. AgentFrameworkToOpenInferenceProcessor.on_end() — transforms span._attributes in-place
#   3. Background thread — exports the (now-transformed) span from the queue
_tracer_provider.add_span_processor(
    AgentFrameworkToOpenInferenceProcessor(),
    replace_default_processor=False,
)

# Enable agent-framework's built-in OTel instrumentation so it emits spans
enable_instrumentation(enable_sensitive_data=True)
