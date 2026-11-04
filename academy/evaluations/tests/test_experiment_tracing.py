"""Exercise real model instrumentation without a collector or provider request."""
import json
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import os
from pathlib import Path
import subprocess
import sys
from threading import Thread

import pytest


ROOT = Path(__file__).resolve().parents[3]


@pytest.mark.parametrize("native_tracing", [None, "true"])
def test_experiment_records_each_model_call_once(native_tracing):
    # A process isolates the global tracer provider and LangChain instrumentation.
    env = {key: value for key, value in os.environ.items() if not key.startswith("ANTHROPIC_")}
    env["ANTHROPIC_API_KEY"] = "test-key-not-a-secret"
    env["LANGSMITH_TRACING"] = env["LANGCHAIN_TRACING_V2"] = "false"
    if native_tracing is not None:
        env["ANTHROPIC_OPEN_TELEMETRY"] = native_tracing
    requests = []

    class ModelResponse(BaseHTTPRequestHandler):
        def do_POST(self):
            requests.append(json.loads(self.rfile.read(int(self.headers["Content-Length"]))))
            body = json.dumps({
                "id": "msg_test", "type": "message", "role": "assistant",
                "model": "claude-sonnet-4-6", "stop_reason": "end_turn",
                "stop_sequence": None,
                "content": [{"type": "text", "text": "No matching toy was found."}],
                "usage": {"input_tokens": 100, "output_tokens": 20},
            }).encode()
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)

        def log_message(self, *_args):
            pass

    with ThreadingHTTPServer(("127.0.0.1", 0), ModelResponse) as server:
        thread = Thread(target=server.serve_forever, daemon=True)
        thread.start()
        env["ANTHROPIC_API_URL"] = env["ANTHROPIC_BASE_URL"] = (
            f"http://127.0.0.1:{server.server_port}"
        )
        env["NO_PROXY"] = env["no_proxy"] = "127.0.0.1"
        try:
            result = subprocess.run(
                [sys.executable, str(Path(__file__).resolve())], cwd=ROOT, env=env,
                capture_output=True, text=True, timeout=60,
            )
        finally:
            server.shutdown()
            thread.join()
    assert result.returncode == 0, result.stdout + result.stderr
    assert len(requests) == 1


def _run_with_local_services():
    from types import SimpleNamespace
    from unittest.mock import patch

    from opentelemetry import trace
    from opentelemetry.sdk.trace import TracerProvider
    from opentelemetry.sdk.trace.export import SimpleSpanProcessor
    from opentelemetry.sdk.trace.export.in_memory_span_exporter import InMemorySpanExporter

    sys.path.insert(0, str(ROOT))
    from academy.evaluations import run_experiment as runner

    exporter = InMemorySpanExporter()
    provider = TracerProvider()
    provider.add_span_processor(SimpleSpanProcessor(exporter))
    trace.set_tracer_provider(provider)
    dataset = SimpleNamespace(
        id="test-dataset", examples=[{"input": {"input": "Find a toy under $25"}}],
    )
    client = SimpleNamespace(datasets=SimpleNamespace(get_dataset=lambda **_: dataset))

    def run_experiment(*, task, **_kwargs):
        # Run the supplied task and real LangGraph/LangChain/Anthropic stack.
        assert task(dataset.examples[0]) == "No matching toy was found."
        return {
            "dataset_version_id": "test-version", "experiment_id": "test-experiment",
            "task_runs": [{}], "evaluation_runs": [],
        }

    with (
        patch("phoenix.otel.register", return_value=provider),
        patch.object(runner, "Client", return_value=client),
        patch.object(runner, "run_experiment", side_effect=run_experiment),
        patch.object(sys, "argv", ["run_experiment", "--variant", "baseline"]),
    ):
        # Import through the same tracing setup, but replace the Chroma preflight.
        sys.path.insert(0, str(ROOT / "phoenix/langchain-py"))
        with patch("backend.chroma_client.get_products_collection", return_value=object()):
            runner.main()

    spans = exporter.get_finished_spans()
    model_spans = [
        s for s in spans
        if s.attributes.get("openinference.span.kind") == "LLM"
        or s.attributes.get("gen_ai.operation.name")
    ]
    assert len(model_spans) == 1, [s.name for s in model_spans]
    assert model_spans[0].name == "ChatAnthropic"
    assert model_spans[0].attributes["llm.token_count.prompt"] == 100
    assert model_spans[0].attributes["llm.token_count.completion"] == 20


if __name__ == "__main__":
    _run_with_local_services()
