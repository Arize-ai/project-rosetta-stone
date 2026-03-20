"""Phoenix tracing initialization.

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

from arize.otel import register
from openinference.instrumentation.agent_framework import AgentFrameworkToOpenInferenceProcessor
from agent_framework.observability import enable_instrumentation

_tracer_provider = register(
    api_key=os.environ.get("ARIZE_API_KEY"),
    space_id=os.environ.get("ARIZE_SPACE_ID"),
    project_name=os.environ.get("ARIZE_PROJECT_NAME", "wonder-toys-microsoft-agent-py"),
    batch=True,
    verbose=True,
    log_to_console=True,
)

_tracer_provider.add_span_processor(
    AgentFrameworkToOpenInferenceProcessor()
)

# Enable agent-framework's built-in OTel instrumentation so it emits spans
enable_instrumentation(enable_sensitive_data=True)
