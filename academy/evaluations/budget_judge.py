"""A budget-only judge shared by the Academy validation and experiment exercises."""
from dataclasses import asdict
import hashlib
import os
from pathlib import Path

from phoenix.evals import ClassificationEvaluator, LLM, Score

RUBRIC_PATH = Path(__file__).with_name("budget_rubric.txt")
DEFAULT_MODEL = "claude-sonnet-4-6"


def load_model_key(env_file: Path | None = None) -> None:
    """Read only the model credential; never replace Phoenix connection settings."""
    if not os.environ.get("ANTHROPIC_API_KEY") and env_file:
        from dotenv import dotenv_values
        key = dotenv_values(env_file).get("ANTHROPIC_API_KEY")
        if key:
            os.environ["ANTHROPIC_API_KEY"] = key
    if not os.environ.get("ANTHROPIC_API_KEY"):
        raise ValueError("Set ANTHROPIC_API_KEY or pass --env-file with your local app configuration")


def rubric_version() -> str:
    return hashlib.sha256(RUBRIC_PATH.read_bytes()).hexdigest()[:12]


def make_budget_judge(model: str = DEFAULT_MODEL) -> ClassificationEvaluator:
    return ClassificationEvaluator(
        name="budget_compliance_judge", llm=LLM(provider="anthropic", model=model),
        prompt_template=RUBRIC_PATH.read_text(), choices=["pass", "fail", "needs_review"],
        include_explanation=True,
    )


def evaluate_budget(judge: ClassificationEvaluator, request: str, response: str) -> Score:
    verdict = judge.evaluate({"request": request, "response": response})[0]
    if verdict.label not in {"pass", "fail", "needs_review"}:
        raise ValueError(f"Unexpected judge label: {verdict.label}")
    # An undecidable case must not silently become a success or a failure.
    return Score(
        name="budget_compliance_judge", label=verdict.label,
        score={"pass": 1, "fail": 0}.get(verdict.label), explanation=verdict.explanation,
        metadata={"rubric_version": rubric_version()}, kind="llm", direction="maximize",
    )


def result_dict(score: Score) -> dict:
    return {key: value for key, value in asdict(score).items() if value is not None}
