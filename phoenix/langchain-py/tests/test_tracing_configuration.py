"""Ensure Academy tracing does not replace existing collector configurations."""
import os
from pathlib import Path
import runpy
import unittest
from unittest.mock import patch

TRACING = Path(__file__).parents[1] / "backend/tracing.py"


class TracingConfigurationTests(unittest.TestCase):
    def options(self, env):
        with (
            patch.dict(os.environ, env, clear=True),
            patch("phoenix.otel.register") as configure,
            patch("openinference.instrumentation.langchain.LangChainInstrumentor"),
        ):
            runpy.run_path(str(TRACING))
        return configure.call_args.kwargs

    def test_unconfigured_collector_keeps_sdk_defaults(self):
        self.assertEqual(self.options({}), {"project_name": "wonder-toys-langchain-py"})

    def test_standard_otel_grpc_endpoint_is_not_overridden(self):
        options = self.options({"OTEL_EXPORTER_OTLP_ENDPOINT": "http://collector:4317"})
        self.assertNotIn("endpoint", options)
        self.assertNotIn("protocol", options)
        self.assertNotIn("batch", options)

    def test_standard_otel_http_endpoint_keeps_its_destination(self):
        options = self.options({"OTEL_EXPORTER_OTLP_ENDPOINT": "http://collector:4318"})
        self.assertEqual(options["endpoint"], "http://collector:4318/v1/traces")
        self.assertEqual(options["protocol"], "http/protobuf")

    def test_phoenix_endpoint_keeps_precedence_over_standard_otel_endpoint(self):
        options = self.options({"PHOENIX_COLLECTOR_ENDPOINT": "http://phoenix:6006",
                                "OTEL_EXPORTER_OTLP_ENDPOINT": "http://other:4318"})
        self.assertEqual(options["endpoint"], "http://phoenix:6006/v1/traces")

    def test_grpc_endpoint_keeps_sdk_transport_selection(self):
        for endpoint, port in [("http://collector:4317", "4317"),
                               ("http://collector:50051/", "50051")]:
            with self.subTest(endpoint=endpoint):
                options = self.options({"PHOENIX_COLLECTOR_ENDPOINT": endpoint,
                                        "PHOENIX_GRPC_PORT": port})
                self.assertNotIn("endpoint", options)
                self.assertNotIn("protocol", options)

    def test_http_endpoints_keep_their_prefix_and_single_traces_suffix(self):
        cases = {
            "http://localhost:6006": "http://localhost:6006/v1/traces",
            "http://localhost:6020/": "http://localhost:6020/v1/traces",
            "http://localhost:6006/v1/traces/": "http://localhost:6006/v1/traces",
            "https://app.phoenix.arize.com/s/example": "https://app.phoenix.arize.com/s/example/v1/traces",
            "https://proxy.example/phoenix": "https://proxy.example/phoenix/v1/traces",
        }
        for endpoint, expected in cases.items():
            with self.subTest(endpoint=endpoint):
                options = self.options({"PHOENIX_COLLECTOR_ENDPOINT": endpoint,
                                        "PHOENIX_PROJECT_NAME": "existing-project"})
                self.assertEqual(options["endpoint"], expected)
                self.assertEqual(options["protocol"], "http/protobuf")
                self.assertEqual(options["project_name"], "existing-project")
                self.assertNotIn("batch", options)
