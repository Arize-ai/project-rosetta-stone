"""Arize AX tracing initialization.

This module MUST be imported before any LlamaIndex imports so that
the OpenInference instrumentor can patch LlamaIndex's internals.

Expects these environment variables:
  ARIZE_SPACE_ID    — Arize space ID
  ARIZE_API_KEY     — Arize API key
  ARIZE_PROJECT_NAME — Project name in Arize AX
"""

import os

from arize.otel import register
from openinference.instrumentation.llama_index import LlamaIndexInstrumentor

_tracer_provider = register(
    space_id=os.environ.get("ARIZE_SPACE_ID", ""),
    api_key=os.environ.get("ARIZE_API_KEY", ""),
    project_name=os.environ.get("ARIZE_PROJECT_NAME", "wonder-toys-llamaindex-py"),
)

LlamaIndexInstrumentor().instrument(tracer_provider=_tracer_provider)
