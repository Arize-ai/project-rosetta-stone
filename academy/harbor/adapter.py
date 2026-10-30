"""Harbor adapter for the existing Wonder Toys application, not a new agent."""
import os
import shlex
from harbor.agents.installed.base import BaseInstalledAgent


class WonderToysAgent(BaseInstalledAgent):
    @staticmethod
    def name() -> str:
        return "wonder-toys"

    async def install(self, environment) -> None:
        result = await self.exec_as_agent(environment, "test -f /app/runner.py")
        if result.return_code:
            raise RuntimeError("Run academy.harbor.prepare before building the task")

    async def run(self, instruction, environment, context) -> None:
        key = os.environ.get("ANTHROPIC_API_KEY")
        if not key:
            raise ValueError("Set ANTHROPIC_API_KEY in the Harbor host environment")
        result = await self.exec_as_agent(
            environment, command=f"python /app/runner.py --instruction {shlex.quote(instruction)}",
            env={"ANTHROPIC_API_KEY": key, "OTEL_SDK_DISABLED": "true"},
            cwd="/app", timeout_sec=180,
        )
        if result.return_code:
            raise RuntimeError(f"Wonder Toys exited with status {result.return_code}: {result.stderr[-1500:]}")
