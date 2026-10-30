"""Phoenix tracing initialization.

This module MUST be imported before any LangChain imports so that
the OpenInference instrumentor can patch LangChain's internals.

Expects these environment variables:
  PHOENIX_COLLECTOR_ENDPOINT — local or Phoenix Cloud HTTP endpoint
  PHOENIX_API_KEY            — Phoenix API key (read automatically by phoenix-otel)
  PHOENIX_PROJECT_NAME       — Project name in Phoenix
"""

import os

from phoenix.otel import register
from openinference.instrumentation.langchain import LangChainInstrumentor

# Explicit HTTP endpoints also work with SDK versions that otherwise default to
# the local gRPC collector. Preserve a Cloud or reverse-proxy path prefix.
_collector_endpoint = os.environ.get(
    "PHOENIX_COLLECTOR_ENDPOINT", "http://localhost:6006"
).rstrip("/")
if not _collector_endpoint.endswith("/v1/traces"):
    _collector_endpoint += "/v1/traces"

_tracer_provider = register(
    project_name=os.environ.get("PHOENIX_PROJECT_NAME", "wonder-toys-langchain-py"),
    endpoint=_collector_endpoint,
    protocol="http/protobuf",
    batch=True,
)

LangChainInstrumentor().instrument(tracer_provider=_tracer_provider)
