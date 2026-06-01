"""Arize AX tracing initialization for Semantic Kernel.

This module MUST be imported before any `semantic_kernel` imports so that the
OpenInference Anthropic instrumentation patches the `anthropic.AsyncAnthropic`
call site before SK builds its client.

Tracing pipeline:
  Semantic Kernel (emits its own gen_ai OTel spans for agent / function-loop / tool)
    + Anthropic SDK (LLM spans emitted by openinference-instrumentation-anthropic)
    -> arize.otel.register-managed TracerProvider
    -> Arize AX over OTLP/gRPC

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

What lands in AX:
  - AGENT / CHAIN spans emitted by SK's own OTel diagnostics
    (`agent`, `AutoFunctionInvocationLoop`, `execute_tool ...`)
  - LLM spans from openinference-instrumentation-anthropic
    (`messages.stream`, full input/output messages, token counts, tool schemas)

Expects:
  ARIZE_SPACE_ID     — Arize space ID
  ARIZE_API_KEY      — Arize API key
  ARIZE_PROJECT_NAME — Project name in Arize AX
"""

import os

from arize.otel import register
from openinference.instrumentation.anthropic import AnthropicInstrumentor

# `register` configures the global TracerProvider + sets up the gRPC OTLP
# exporter pointed at otlp.arize.com:443. The project name routes traces to
# the right AX project.
tracer_provider = register(
    space_id=os.environ["ARIZE_SPACE_ID"],
    api_key=os.environ["ARIZE_API_KEY"],
    project_name=os.environ["ARIZE_PROJECT_NAME"],
    set_global_tracer_provider=True,
)

# Patch `anthropic.AsyncAnthropic.messages.*` so SK's calls into the Anthropic
# SDK emit OpenInference LLM spans.
AnthropicInstrumentor().instrument(tracer_provider=tracer_provider)

print("Arize AX tracing initialized for Semantic Kernel.")
