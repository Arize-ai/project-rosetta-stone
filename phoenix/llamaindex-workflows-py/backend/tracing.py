"""Phoenix tracing initialization for the LlamaIndex Workflows tier.

This module MUST be imported before any LlamaIndex imports so that
the OpenInference instrumentor can patch LlamaIndex's internals
(including the Workflow / @step decorator machinery).

Expects these environment variables:
  PHOENIX_COLLECTOR_ENDPOINT — Phoenix Cloud endpoint
  PHOENIX_API_KEY            — Phoenix API key (read automatically by phoenix-otel)
  PHOENIX_PROJECT_NAME       — Project name in Phoenix
"""

import os

from openinference.instrumentation.llama_index import LlamaIndexInstrumentor
from phoenix.otel import register

_tracer_provider = register(
    project_name=os.environ.get(
        "PHOENIX_PROJECT_NAME", "wonder-toys-llamaindex-workflows"
    ),
    batch=True,
)

LlamaIndexInstrumentor().instrument(tracer_provider=_tracer_provider)
