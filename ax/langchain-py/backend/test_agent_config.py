"""Tests for agent.py startup configuration.

Regression test for: Wonder Toys agent crashes with missing ANTHROPIC_API_KEY.
When ANTHROPIC_API_KEY is absent, _build_agent() used to pass api_key=None to
ChatAnthropic, bypassing the library's env-var discovery and producing a cryptic
TypeError at inference time instead of a clear error at startup.
"""

import os
import sys
import types
import unittest
from unittest.mock import MagicMock, patch


def _build_stubs():
    """Return lightweight module stubs for heavy optional deps."""
    stubs: dict[str, types.ModuleType] = {}

    chroma = types.ModuleType("chromadb")
    chroma.HttpClient = MagicMock()
    stubs["chromadb"] = chroma

    tools_mod = types.ModuleType("backend.tools")
    tools_mod.all_tools = []
    stubs["backend.tools"] = tools_mod

    lc_ant = types.ModuleType("langchain_anthropic")
    lc_ant.ChatAnthropic = MagicMock(return_value=MagicMock())
    stubs["langchain_anthropic"] = lc_ant

    lg = types.ModuleType("langgraph")
    lg_pre = types.ModuleType("langgraph.prebuilt")
    lg_pre.create_react_agent = MagicMock(return_value=MagicMock())
    stubs["langgraph"] = lg
    stubs["langgraph.prebuilt"] = lg_pre

    oi = types.ModuleType("openinference")
    oi_inst = types.ModuleType("openinference.instrumentation")
    oi_inst.using_session = MagicMock()
    oi_inst.using_user = MagicMock()
    stubs["openinference"] = oi
    stubs["openinference.instrumentation"] = oi_inst

    return stubs


class TestBuildAgentMissingKey(unittest.TestCase):
    def setUp(self):
        # Remove cached module so each test re-imports cleanly.
        sys.modules.pop("backend.agent", None)

    def _import_agent(self, stubs):
        with patch.dict(sys.modules, stubs):
            import backend.agent as mod  # noqa: PLC0415
            return mod

    def test_raises_environment_error_when_key_absent(self):
        """_build_agent() must raise EnvironmentError when ANTHROPIC_API_KEY is missing."""
        stubs = _build_stubs()
        agent_mod = self._import_agent(stubs)
        env_without_key = {k: v for k, v in os.environ.items() if k != "ANTHROPIC_API_KEY"}
        with patch.dict(os.environ, env_without_key, clear=True):
            with self.assertRaises(EnvironmentError) as ctx:
                agent_mod._build_agent()
        self.assertIn("ANTHROPIC_API_KEY", str(ctx.exception))

    def test_does_not_call_chat_anthropic_when_key_absent(self):
        """ChatAnthropic must not be called when the key is missing."""
        stubs = _build_stubs()
        agent_mod = self._import_agent(stubs)
        env_without_key = {k: v for k, v in os.environ.items() if k != "ANTHROPIC_API_KEY"}
        with patch.dict(os.environ, env_without_key, clear=True):
            try:
                agent_mod._build_agent()
            except EnvironmentError:
                pass

        chat_cls = stubs["langchain_anthropic"].ChatAnthropic
        self.assertEqual(
            chat_cls.call_count,
            0,
            "ChatAnthropic was called despite missing ANTHROPIC_API_KEY",
        )

    def test_succeeds_when_key_present(self):
        """_build_agent() must succeed when ANTHROPIC_API_KEY is set."""
        stubs = _build_stubs()
        agent_mod = self._import_agent(stubs)
        with patch.dict(os.environ, {"ANTHROPIC_API_KEY": "sk-ant-test-key"}):
            agent = agent_mod._build_agent()
        self.assertIsNotNone(agent)


if __name__ == "__main__":
    unittest.main()
