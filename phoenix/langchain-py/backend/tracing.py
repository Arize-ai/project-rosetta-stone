"""Phoenix tracing initialization.

This module MUST be imported before any LangChain imports so that
the OpenInference instrumentor can patch LangChain's internals.

Expects these environment variables:
  PHOENIX_COLLECTOR_ENDPOINT — Phoenix Cloud endpoint
  PHOENIX_API_KEY            — Phoenix API key (read automatically by phoenix-otel)
  PHOENIX_PROJECT_NAME       — Project name in Phoenix
"""

import os

from phoenix.otel import register
from openinference.instrumentation.langchain import LangChainInstrumentor

_tracer_provider = register(
    project_name=os.environ.get("PHOENIX_PROJECT_NAME", "wonder-toys-langchain-py"),
)

LangChainInstrumentor().instrument(tracer_provider=_tracer_provider)
