"""Compare the existing Wonder Toys agent on a fixed Phoenix shopping dataset."""
import argparse
from dataclasses import asdict, is_dataclass
import hashlib
from importlib.metadata import version
import json
import os
from pathlib import Path
import sys

from phoenix.client import Client
from phoenix.client.experiments import run_experiment
from phoenix.evals import create_evaluator

from academy.evaluations.budget_judge import (
    evaluate_budget, load_model_key, make_budget_judge, rubric_version, DEFAULT_MODEL,
)

ROOT = Path(__file__).resolve().parents[2]
RULE = Path(__file__).with_name("prompts") / "budget-rule.txt"


def answer_text(content) -> str:
    if isinstance(content, str):
        return content
    return "".join(block.get("text", "") for block in content if isinstance(block, dict) and block.get("type") == "text")


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--variant", choices=["baseline", "budget-rule"], required=True)
    p.add_argument("--phoenix-url", default="http://localhost:6006")
    p.add_argument("--chroma-url", default="http://localhost:8000")
    p.add_argument("--env-file", type=Path)
    p.add_argument("--dataset", default="wonder-toys-shopping")
    p.add_argument("--dataset-version")
    p.add_argument("--repetitions", type=int, default=2)
    p.add_argument("--output", type=Path)
    args = p.parse_args()
    if args.repetitions < 1:
        p.error("repetitions must be positive")
    load_model_key(args.env_file)
    os.environ["PHOENIX_COLLECTOR_ENDPOINT"] = args.phoenix_url
    os.environ["PHOENIX_PROJECT_NAME"] = "wonder-toys"
    os.environ["CHROMA_URL"] = args.chroma_url
    sys.path.insert(0, str(ROOT / "phoenix/langchain-py"))
    from backend import tracing  # Instrument before importing the agent.
    from backend.agent import SYSTEM_PROMPT, _build_agent, _lc_messages
    from backend.chroma_client import get_products_collection
    from langchain_core.messages import AIMessage

    if get_products_collection() is None:
        raise RuntimeError("Start and seed the demo Chroma service before comparing agents")
    prompt = SYSTEM_PROMPT
    if args.variant == "budget-rule":
        prompt += "\n\n" + RULE.read_text().strip()
    agent = _build_agent(system_prompt=prompt)
    client = Client(base_url=args.phoenix_url)
    dataset = client.datasets.get_dataset(dataset=args.dataset, version_id=args.dataset_version)
    if not dataset.examples or any(not isinstance(e["input"].get("input"), str) for e in dataset.examples):
        raise ValueError("Use shopping examples with an input string")
    judge = make_budget_judge()

    def task(example: dict) -> str:
        messages = _lc_messages([{"role": "user", "content": example["input"]["input"]}], "academy-shopper")
        result = agent.invoke({"messages": messages}, config={"recursion_limit": 25})
        final = result["messages"][-1]
        if not isinstance(final, AIMessage) or final.tool_calls:
            raise RuntimeError("Agent stopped without a final answer")
        answer = answer_text(final.content)
        if not answer:
            raise RuntimeError("Agent returned an empty answer")
        return answer

    @create_evaluator(name="budget_compliance_judge", kind="llm", direction="maximize")
    def budget_compliance_judge(input: dict, output: str):
        return evaluate_budget(judge, input["input"], output)

    print(f"Running {len(dataset.examples)} shopping cases × {args.repetitions} repetitions. Model API charges apply.")
    experiment = run_experiment(
        dataset=dataset, task=task, evaluators=[budget_compliance_judge], client=client,
        experiment_name=f"wonder-toys-{args.variant}", repetitions=args.repetitions, retries=0, timeout=180,
        experiment_metadata={"variant": args.variant, "prompt_sha256": hashlib.sha256(prompt.encode()).hexdigest(),
                             "model": DEFAULT_MODEL, "rubric_version": rubric_version(),
                             "scope": "shopping recommendations; no purchase cases", "chroma_url": args.chroma_url,
                             "packages": {name: version(name) for name in ["langchain", "langgraph", "langchain-anthropic", "anthropic", "chromadb", "arize-phoenix-client", "arize-phoenix-evals"]}},
        print_summary=False,
    )
    tracing._tracer_provider.force_flush()
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(json.dumps(experiment, indent=2, default=lambda x: asdict(x) if is_dataclass(x) else str(x)) + "\n")
    print(f"Dataset version: {experiment['dataset_version_id']}")
    print(f"Experiment: {args.phoenix_url.rstrip('/')}/datasets/{dataset.id}/compare?experimentId={experiment['experiment_id']}")
    errors = sum(bool(r.get("error")) for r in experiment["task_runs"])
    eval_errors = sum(bool(r.error) for r in experiment["evaluation_runs"])
    print(f"Task errors: {errors}; evaluation errors: {eval_errors}")
    if errors or eval_errors:
        raise RuntimeError("Inspect failed runs in Phoenix before comparing scores")


if __name__ == "__main__":
    main()
