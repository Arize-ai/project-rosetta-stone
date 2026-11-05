"""Record real framework/SDK spans for one deterministic local HTTP response.

Run once per demo with ROSETTA_TEST_DEMO set to a name in DEMOS. Install that
demo's backend requirements and pytest first. Use an Anthropic SDK with native
tracing (>=1.14); the native-only control prevents older SDKs hiding regressions.
ROSETTA_TEST_COLLECTOR optionally exports the same spans to a local Phoenix.
"""

import asyncio
from contextlib import ExitStack
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
import os
from pathlib import Path
import runpy
import subprocess
import sys
from threading import Thread
from unittest.mock import patch

import pytest


ROOT = Path(__file__).resolve().parents[1]
DEMOS = ("langchain-py", "agno-py", "haystack-py", "pydantic-ai-py", "crewai-py")
DEMO = os.environ.get("ROSETTA_TEST_DEMO", "langchain-py")
MODEL = "claude-sonnet-4-6"
ANSWER = "A toy."
USAGE = {"input_tokens": 7, "output_tokens": 3,
         "cache_creation_input_tokens": 0, "cache_read_input_tokens": 0}
MESSAGE = {
    "id": "msg_local_mock", "type": "message", "role": "assistant", "model": MODEL,
    "content": [{"type": "text", "text": ANSWER}], "stop_reason": "end_turn",
    "stop_sequence": None, "usage": USAGE,
}


def _stream_body():
    events = [
        ("message_start", {"message": {**MESSAGE, "content": [], "stop_reason": None,
                                      "usage": {**USAGE, "output_tokens": 0}}}),
        ("content_block_start", {"index": 0, "content_block": {"type": "text", "text": ""}}),
        ("content_block_delta", {"index": 0, "delta": {"type": "text_delta", "text": ANSWER}}),
        ("content_block_stop", {"index": 0}),
        ("message_delta", {"delta": {"stop_reason": "end_turn", "stop_sequence": None},
                           "usage": USAGE}),
        ("message_stop", {}),
    ]
    return "".join(
        f"event: {name}\ndata: {json.dumps({'type': name, **data})}\n\n"
        for name, data in events
    ).encode()


def _probe(variant, mode, native):
    assert DEMO in DEMOS, f"ROSETTA_TEST_DEMO must be one of {DEMOS}"
    requests = []

    class ModelResponse(BaseHTTPRequestHandler):
        def do_POST(self):
            request = json.loads(self.rfile.read(int(self.headers["Content-Length"])))
            requests.append(request)
            streaming = request.get("stream", False)
            body = _stream_body() if streaming else json.dumps(MESSAGE).encode()
            self.send_response(200)
            self.send_header("Content-Type", "text/event-stream" if streaming else "application/json")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)

        def log_message(self, *_args):
            pass

    # Each child owns a fresh global provider and fresh instrumentor singletons.
    env = {key: value for key, value in os.environ.items()
           if not key.startswith(("ANTHROPIC_", "PHOENIX_", "ARIZE_", "OTEL_"))}
    env.update(ANTHROPIC_API_KEY="test-key-not-a-secret", LANGSMITH_TRACING="false",
               LANGCHAIN_TRACING_V2="false", AGNO_TELEMETRY="false",
               HAYSTACK_TELEMETRY_ENABLED="false", CREWAI_TELEMETRY_DISABLED="true",
               NO_PROXY="127.0.0.1,localhost", no_proxy="127.0.0.1,localhost")
    if native is not None:
        env["ANTHROPIC_OPEN_TELEMETRY"] = native
    with ThreadingHTTPServer(("127.0.0.1", 0), ModelResponse) as server:
        thread = Thread(target=server.serve_forever, daemon=True)
        thread.start()
        env["ANTHROPIC_BASE_URL"] = env["ANTHROPIC_API_URL"] = f"http://127.0.0.1:{server.server_port}"
        try:
            result = subprocess.run(
                [sys.executable, str(Path(__file__).resolve()), variant, mode, native or "default"],
                cwd=ROOT, env=env, capture_output=True, text=True, timeout=90,
            )
        finally:
            server.shutdown()
            thread.join()
    assert result.returncode == 0, result.stdout + result.stderr
    assert len(requests) == 1
    # Current Pydantic AI consumes a streaming HTTP response even for Agent.run.
    expected_stream = mode == "stream" or (DEMO == "pydantic-ai-py" and variant in ("phoenix", "ax"))
    assert requests[0].get("stream", False) == expected_stream
    return json.loads(next(line.removeprefix("RESULT ") for line in result.stdout.splitlines()
                           if line.startswith("RESULT ")))


@pytest.mark.parametrize("variant", ["phoenix", "ax"])
@pytest.mark.parametrize("mode", ["sync", "stream"])
@pytest.mark.parametrize("native", [None, "true"])
def test_model_call_is_recorded_once(variant, mode, native):
    result = _probe(variant, mode, native)
    assert len(result["models"]) == 1, result
    model = result["models"][0]
    assert model["scope"] != "com.anthropic.sdk.python", result
    assert (model["input"], model["output"]) == (7, 3), result


@pytest.mark.parametrize("mode", ["sync", "stream"])
def test_native_only_control_records_the_sdk_span(mode):
    result = _probe("native-only", mode, None)
    assert len(result["models"]) == 1, "Install anthropic>=1.14 to exercise native telemetry"
    model = result["models"][0]
    assert model["scope"] == "com.anthropic.sdk.python", result
    assert (model["input"], model["output"]) == (7, 3), result


def test_without_global_provider_records_no_spans():
    assert _probe("no-provider", "sync", None)["models"] == []


def _call_model(stream):
    if DEMO == "langchain-py":
        from langchain_anthropic import ChatAnthropic
        model = ChatAnthropic(model=MODEL, max_tokens=32)
        if stream:
            assert "".join(str(chunk.content) for chunk in model.stream("Find a toy")) == ANSWER
        else:
            assert model.invoke("Find a toy").content == ANSWER
    elif DEMO == "agno-py":
        from agno.agent import Agent
        from agno.models.anthropic import Claude
        agent = Agent(model=Claude(id=MODEL, max_tokens=32), telemetry=False)
        result = agent.run("Find a toy", stream=stream)
        if stream:
            assert "".join(chunk.content or "" for chunk in result) == ANSWER
        else:
            assert result.content == ANSWER
    elif DEMO == "haystack-py":
        from haystack import Pipeline
        from haystack.dataclasses import ChatMessage
        from haystack_integrations.components.generators.anthropic import AnthropicChatGenerator
        model = AnthropicChatGenerator(
            model=MODEL, streaming_callback=(lambda chunk: None) if stream else None,
        )
        pipeline = Pipeline()
        pipeline.add_component("model", model)
        result = pipeline.run({"model": {"messages": [ChatMessage.from_user("Find a toy")]}})
        assert result["model"]["replies"][0].text == ANSWER
    elif DEMO == "pydantic-ai-py":
        from pydantic_ai import Agent
        agent = Agent(f"anthropic:{MODEL}")

        async def call():
            if stream:
                async with agent.run_stream("Find a toy") as result:
                    chunks = [chunk async for chunk in result.stream_text()]
                    assert chunks[-1] == ANSWER
            else:
                assert (await agent.run("Find a toy")).output == ANSWER

        asyncio.run(call())
    elif DEMO == "crewai-py":
        from crewai import LLM
        model = LLM(model=f"anthropic/{MODEL}", max_tokens=32, stream=stream)
        assert model.call(messages=[{"role": "user", "content": "Find a toy"}]) == ANSWER


def _run_child(variant, mode, native):
    from opentelemetry import trace
    from opentelemetry.sdk.resources import Resource
    from opentelemetry.sdk.trace import TracerProvider
    from opentelemetry.sdk.trace.export import SimpleSpanProcessor
    from opentelemetry.sdk.trace.export.in_memory_span_exporter import InMemorySpanExporter

    run = os.environ.get("ROSETTA_TEST_RUN", "regression")
    project = f"demo-{DEMO}-{variant}-{run}-{mode}-{native}"
    os.environ.update(PHOENIX_PROJECT_NAME=project, ARIZE_PROJECT_NAME=project,
                      ARIZE_API_KEY="unused-local-test", ARIZE_SPACE_ID="unused-local-test")
    exporter = InMemorySpanExporter()

    def local_register(**_kwargs):
        provider = TracerProvider(resource=Resource.create({"openinference.project.name": project}))
        trace.set_tracer_provider(provider)
        return provider

    # Only divert registration/export: instrumentors, framework clients, native
    # SDK tracing, and framework span processors execute their real code.
    with ExitStack() as stack:
        for module in ("phoenix.otel", "arize.otel") if variant == "ax" else ("phoenix.otel",):
            stack.enter_context(patch(f"{module}.register", side_effect=local_register))
            stack.enter_context(patch(f"{module}.BatchSpanProcessor",
                                      side_effect=lambda **_: SimpleSpanProcessor(exporter)))
        if variant in ("native-only", "no-provider"):
            provider = TracerProvider(resource=Resource.create({"openinference.project.name": project}))
            if variant == "native-only":
                trace.set_tracer_provider(provider)
        else:
            runpy.run_path(str(ROOT / variant / DEMO / "backend/tracing.py"))
            provider = trace.get_tracer_provider()
    # Framework-native providers already have the diverted processor above.
    if DEMO != "pydantic-ai-py" or variant in ("native-only", "no-provider"):
        provider.add_span_processor(SimpleSpanProcessor(exporter))
    if endpoint := os.environ.get("ROSETTA_TEST_COLLECTOR"):
        from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
        provider.add_span_processor(SimpleSpanProcessor(OTLPSpanExporter(endpoint=endpoint)))
    if variant in ("native-only", "no-provider"):
        from anthropic import Anthropic
        client = Anthropic()
        result = client.messages.create(
            model=MODEL, max_tokens=32, messages=[{"role": "user", "content": "Find a toy"}],
            stream=mode == "stream",
        )
        if mode == "stream":
            list(result)
        else:
            assert result.content[0].text == ANSWER
        client.close()
    else:
        _call_model(mode == "stream")
    provider.force_flush()
    spans = exporter.get_finished_spans()
    models = [span for span in spans if span.attributes.get("openinference.span.kind") == "LLM"
              or span.attributes.get("gen_ai.operation.name") == "chat"]
    print("RESULT " + json.dumps({"project": project, "models": [
        {"name": span.name, "scope": span.instrumentation_scope.name,
         "input": span.attributes.get("llm.token_count.prompt", span.attributes.get("gen_ai.usage.input_tokens")),
         "output": span.attributes.get("llm.token_count.completion", span.attributes.get("gen_ai.usage.output_tokens"))}
        for span in models
    ]}))
    provider.shutdown()


if __name__ == "__main__":
    _run_child(*sys.argv[1:])
