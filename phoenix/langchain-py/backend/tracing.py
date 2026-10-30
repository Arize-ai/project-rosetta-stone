"""Phoenix tracing initialization.

This module MUST be imported before any LangChain imports so that
the OpenInference instrumentor can patch LangChain's internals.

Expects these environment variables:
  PHOENIX_COLLECTOR_ENDPOINT — local or Phoenix Cloud HTTP endpoint
  PHOENIX_API_KEY            — Phoenix API key (read automatically by phoenix-otel)
  PHOENIX_PROJECT_NAME       — Project name in Phoenix
"""

import os
from urllib.parse import urlparse

from phoenix.otel import register
from openinference.instrumentation.langchain import LangChainInstrumentor

# Honor Phoenix or standard OTLP endpoints without forcing HTTP on gRPC users.
# HTTP base URLs need their traces suffix; without either setting, leave endpoint
# selection and the default local gRPC collector to the SDK.
_endpoint_options = {}
_collector_endpoint = os.environ.get("PHOENIX_COLLECTOR_ENDPOINT") or os.environ.get(
    "OTEL_EXPORTER_OTLP_ENDPOINT"
)
if _collector_endpoint:
    parsed = urlparse(_collector_endpoint)
    grpc_port = int(os.environ.get("PHOENIX_GRPC_PORT", "4317"))
    is_grpc = parsed.port == grpc_port and not parsed.path.rstrip("/")
    if parsed.scheme in {"http", "https"} and not is_grpc:
        endpoint = _collector_endpoint.rstrip("/")
        if not endpoint.endswith("/v1/traces"):
            endpoint += "/v1/traces"
        _endpoint_options = {"endpoint": endpoint, "protocol": "http/protobuf"}

_tracer_provider = register(
    project_name=os.environ.get("PHOENIX_PROJECT_NAME", "wonder-toys-langchain-py"),
    **_endpoint_options,
)

LangChainInstrumentor().instrument(tracer_provider=_tracer_provider)
