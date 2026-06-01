"""Phoenix Cloud tracing for Semantic Kernel.

This module MUST be imported before any `semantic_kernel` imports so that the
OpenInference Anthropic instrumentation patches the `anthropic.AsyncAnthropic`
call site before SK builds its client.

Tracing pipeline:
  Semantic Kernel (emits its own gen_ai OTel spans for agent / function-loop / tool)
    + Anthropic SDK (LLM spans emitted by openinference-instrumentation-anthropic)
    -> phoenix.otel.register-managed TracerProvider
    -> Phoenix Cloud over OTLP/HTTP

Why this shape and not OpenLIT + OpenInferenceSpanProcessor (the original):
  1. OpenLIT has no `semantic_kernel` instrumentor.
  2. OpenLIT's `openai` and `anthropic` instrumentors wrap streaming responses
     in a custom class that's not a subclass of the SDK's `AsyncStream`. SK's
     `open_ai_handler.store_usage()` (and the Anthropic equivalent) do an
     isinstance check on the stream type and fall through to `response.usage`
     when it fails — crashing with `AttributeError: 'AsyncStream' object has
     no attribute 'usage'`.
  Directly using the OpenInference provider-specific instrumentor sidesteps
  both issues: it patches the SDK methods in place without wrapping the
  return type, so SK's introspection still works.

What lands in Phoenix:
  - AGENT / CHAIN spans emitted by SK's own OTel diagnostics
    (`agent`, `AutoFunctionInvocationLoop`, `execute_tool ...`)
  - LLM spans from openinference-instrumentation-anthropic
    (`messages.stream`, full input/output messages, token counts, tool schemas)

Expects:
  PHOENIX_COLLECTOR_ENDPOINT  — full OTLP URL (e.g. https://app.phoenix.arize.com/s/<space>/v1/traces)
  PHOENIX_API_KEY             — bearer token (read automatically by phoenix-otel)
  PHOENIX_PROJECT_NAME        — project name in Phoenix
"""

import os

from openinference.instrumentation.anthropic import AnthropicInstrumentor
from phoenix.otel import register

# `register` configures the global TracerProvider + sets up the OTLP exporter
# to Phoenix Cloud. The project name routes traces to the right Phoenix project.
tracer_provider = register(
    project_name=os.getenv("PHOENIX_PROJECT_NAME", "wonder-toys-semantic-kernel"),
    endpoint=os.environ["PHOENIX_COLLECTOR_ENDPOINT"],
    set_global_tracer_provider=True,
    auto_instrument=False,
)

# Patch `anthropic.AsyncAnthropic.messages.*` so SK's calls into the Anthropic
# SDK emit OpenInference LLM spans.
AnthropicInstrumentor().instrument(tracer_provider=tracer_provider)

print("Phoenix tracing initialized for Semantic Kernel.")
