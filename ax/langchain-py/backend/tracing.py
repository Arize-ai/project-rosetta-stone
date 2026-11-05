"""Arize AX tracing initialization.

This module MUST be imported before any LangChain imports so that
the OpenInference instrumentor can patch LangChain's internals.

Expects these environment variables:
  ARIZE_SPACE_ID    — Arize space ID
  ARIZE_API_KEY     — Arize API key
  ARIZE_PROJECT_NAME — Project name in Arize AX
"""

import os

from arize.otel import register
from openinference.instrumentation.langchain import LangChainInstrumentor

# Framework instrumentation already records each Anthropic model call.
# Disable native SDK spans before any clients are constructed.
os.environ["ANTHROPIC_OPEN_TELEMETRY"] = "false"

_tracer_provider = register(
    space_id=os.environ.get("ARIZE_SPACE_ID", ""),
    api_key=os.environ.get("ARIZE_API_KEY", ""),
    project_name=os.environ.get("ARIZE_PROJECT_NAME", "wonder-toys-langchain-py"),
)

LangChainInstrumentor().instrument(tracer_provider=_tracer_provider)
