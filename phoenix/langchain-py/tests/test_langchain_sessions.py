"""Conversation tracing regressions. No model calls or running services required.

Run from phoenix/langchain-py:
    python -m unittest discover -s tests -p 'test_langchain_sessions.py'
"""
import asyncio
import os
import unittest
from contextlib import nullcontext
from types import SimpleNamespace
from unittest.mock import patch

from fastapi.testclient import TestClient
from openinference.instrumentation import get_attributes_from_context
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import SimpleSpanProcessor
from opentelemetry.sdk.trace.export.in_memory_span_exporter import InMemorySpanExporter
from opentelemetry.trace import StatusCode

from backend import agent, main


class ConversationSessionTests(unittest.TestCase):
    def setUp(self):
        self.observed = []
        observed = self.observed

        class FakeAgent:
            async def astream_events(self, inputs, **kwargs):
                observed.append(dict(get_attributes_from_context()))
                yield {
                    "event": "on_chat_model_stream",
                    "data": {"chunk": SimpleNamespace(content="Example reply")},
                }

        self.agent_patch = patch.object(agent, "get_agent", return_value=FakeAgent())
        self.secret_patch = patch.object(main, "BACKEND_SECRET", "test-secret")
        self.root_spans = []
        self.outer_span_contexts = []
        spans = self.root_spans
        outer_span_contexts = self.outer_span_contexts

        class RecordingSpan:
            def __init__(self, attributes):
                self.attributes = dict(attributes)
                spans.append(self)

            def set_attribute(self, name, value):
                self.attributes[name] = value

            def set_status(self, status):
                self.status = status

        class FakeTracer:
            def start_as_current_span(self, name, attributes):
                outer_span_contexts.append(trace.get_current_span().get_span_context())
                return nullcontext(RecordingSpan(attributes))

        self.tracer_patch = patch.object(agent, "_tracer", FakeTracer())
        self.tracer_patch.start()
        self.addCleanup(self.tracer_patch.stop)
        self.agent_patch.start()
        self.secret_patch.start()
        self.addCleanup(self.agent_patch.stop)
        self.addCleanup(self.secret_patch.stop)
        self.client = TestClient(main.app)

    def send(self, session_id=None):
        headers = {"x-api-key": "test-secret", "x-user-id": "same-shopper"}
        if session_id:
            headers["x-session-id"] = session_id
        response = self.client.post(
            "/chat", headers=headers,
            json={"messages": [{"role": "user", "content": "Hello"}]},
        )
        self.assertEqual(response.status_code, 200)
        self.assertIn("[DONE]", response.text)

    def test_agent_factory_keeps_the_existing_defaults(self):
        with (
            patch.dict(os.environ, {"ANTHROPIC_API_KEY": "test-key"}),
            patch.object(agent, "ChatAnthropic") as model,
            patch.object(agent, "create_react_agent") as build,
        ):
            agent._build_agent()
        model.assert_called_once_with(model="claude-sonnet-4-6", api_key="test-key")
        build.assert_called_once_with(
            model.return_value, agent.all_tools, prompt=agent.SYSTEM_PROMPT,
        )

    def test_experiment_overrides_do_not_replace_application_defaults(self):
        original_tools = list(agent.all_tools)
        original_prompt = agent.SYSTEM_PROMPT
        with (
            patch.dict(os.environ, {"ANTHROPIC_API_KEY": "test-key"}),
            patch.object(agent, "ChatAnthropic"),
            patch.object(agent, "create_react_agent") as build,
        ):
            agent._build_agent(system_prompt="Candidate instruction", tools_override=[])
            self.assertEqual(build.call_args.args[1], [])
            self.assertEqual(build.call_args.kwargs["prompt"], "Candidate instruction")
            build.reset_mock()
            agent._build_agent()
        self.assertEqual(agent.all_tools, original_tools)
        self.assertEqual(agent.SYSTEM_PROMPT, original_prompt)
        self.assertIs(build.call_args.args[1], agent.all_tools)
        self.assertEqual(build.call_args.kwargs["prompt"], original_prompt)

    def test_turns_group_by_conversation_not_shopper(self):
        self.send("conversation-a")
        self.send("conversation-a")
        self.send("conversation-b")
        self.assertEqual(
            [attrs["session.id"] for attrs in self.observed],
            ["conversation-a", "conversation-a", "conversation-b"],
        )
        self.assertEqual(
            [attrs["user.id"] for attrs in self.observed],
            ["same-shopper"] * 3,
        )

    def test_requests_without_a_conversation_id_do_not_merge(self):
        self.send()
        self.send()
        sessions = [attrs["session.id"] for attrs in self.observed]
        self.assertTrue(all(sessions))
        self.assertNotEqual(sessions[0], sessions[1])
        self.assertNotIn("same-shopper", sessions)

    def test_root_displays_current_message_and_reply(self):
        self.send("conversation-a")
        root = self.root_spans[0].attributes
        self.assertEqual(root["input.value"], "Hello")
        self.assertEqual(root["output.value"], "Example reply")
        self.assertEqual(root["openinference.span.kind"], "AGENT")

    def test_invalid_backend_secret_is_rejected(self):
        response = self.client.post(
            "/chat", headers={"x-api-key": "wrong"}, json={"messages": []}
        )
        self.assertEqual(response.status_code, 403)
        self.assertEqual(self.observed, [])

    def test_agent_is_not_wrapped_in_an_http_span(self):
        self.send("conversation-a")
        self.assertEqual(len(self.outer_span_contexts), 1)
        self.assertFalse(self.outer_span_contexts[0].is_valid)

    def recording_tracer(self):
        exporter = InMemorySpanExporter()
        provider = TracerProvider()
        provider.add_span_processor(SimpleSpanProcessor(exporter))
        self.addCleanup(provider.shutdown)
        return provider.get_tracer("test-agent-status"), exporter

    async def collect_response(self):
        return [
            event
            async for event in agent.stream_agent(
                [{"role": "user", "content": "Hello"}],
                user_id="same-shopper",
                session_id="conversation-a",
            )
        ]

    def test_completed_run_exports_ok_status(self):
        tracer, exporter = self.recording_tracer()
        with patch.object(agent, "_tracer", tracer):
            events = asyncio.run(self.collect_response())
        root, = exporter.get_finished_spans()
        self.assertEqual(root.status.status_code, StatusCode.OK)
        self.assertEqual(root.attributes["output.value"], "Example reply")
        self.assertIn("data: [DONE]\n\n", events)

    def test_failed_stream_exports_error_status(self):
        class FailingAgent:
            async def astream_events(self, inputs, **kwargs):
                yield {
                    "event": "on_chat_model_stream",
                    "data": {"chunk": SimpleNamespace(content="Partial reply")},
                }
                raise RuntimeError("Search unavailable")

        tracer, exporter = self.recording_tracer()
        with (
            patch.object(agent, "_tracer", tracer),
            patch.object(agent, "get_agent", return_value=FailingAgent()),
            self.assertRaisesRegex(RuntimeError, "Search unavailable"),
        ):
            asyncio.run(self.collect_response())
        root, = exporter.get_finished_spans()
        self.assertEqual(root.status.status_code, StatusCode.ERROR)
        self.assertTrue(any(event.name == "exception" for event in root.events))
