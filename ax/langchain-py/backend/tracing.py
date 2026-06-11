"""Arize AX tracing initialization.

This module MUST be imported before any LangChain imports so that
the OpenInference instrumentor can patch LangChain's internals.

Expects these environment variables:
  ARIZE_SPACE_ID    — Arize space ID
  ARIZE_API_KEY     — Arize API key
  ARIZE_PROJECT_NAME — Project name in Arize AX

Note on span export:
    ``arize.otel.register()`` defaults to ``batch=True`` (a BatchSpanProcessor
    with a 5-second flush interval and a fixed in-memory queue). Under bursty
    traffic — e.g. a parallel demo seeder driving dozens of sessions in a
    minute — spans queue faster than they export and either arrive late or
    get dropped on backend exit.

    Passing ``batch=False`` switches to SimpleSpanProcessor, which exports
    every span synchronously the moment it ends. Same default the Phoenix
    tier uses. The latency cost (~50-100ms per span over gRPC) is fine for
    this demo and gets us guaranteed delivery.
"""

import os

from arize.otel import register
from openinference.instrumentation.langchain import LangChainInstrumentor

_tracer_provider = register(
    space_id=os.environ.get("ARIZE_SPACE_ID", ""),
    api_key=os.environ.get("ARIZE_API_KEY", ""),
    project_name=os.environ.get("ARIZE_PROJECT_NAME", "wonder-toys-langchain-py"),
    batch=False,
)

LangChainInstrumentor().instrument(tracer_provider=_tracer_provider)


def force_flush(timeout_millis: int = 30_000) -> bool:
    """Force any pending spans to flush to the AX collector.

    A no-op when using SimpleSpanProcessor (every span is already exported
    synchronously), but kept available so callers don't have to know which
    processor is active. Returns True when the flush completed in time.
    """
    if _tracer_provider is None:
        return True
    return _tracer_provider.force_flush(timeout_millis=timeout_millis)
