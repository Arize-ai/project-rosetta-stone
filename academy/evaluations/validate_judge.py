"""Compare the budget judge with reviewed answers and record a Phoenix experiment."""
import argparse
from dataclasses import asdict, is_dataclass
import json
from pathlib import Path

import httpx
import pandas as pd
from phoenix.client import Client
from phoenix.client.experiments import run_experiment

from academy.evaluations.budget_judge import (
    DEFAULT_MODEL, evaluate_budget, load_model_key, make_budget_judge, result_dict, rubric_version,
)


def read_cases(path: Path, allow_practice: bool = False) -> list[dict]:
    cases = json.loads(path.read_text())
    if not isinstance(cases, list) or not cases:
        raise ValueError("The review file must contain a non-empty list of cases")
    seen = set()
    for case in cases:
        if not case.get("id") or case["id"] in seen:
            raise ValueError("Every case needs a unique id")
        seen.add(case["id"])
        if not case.get("request") or not case.get("response"):
            raise ValueError(f"{case['id']}: request and response are required")
        if case.get("review_label") not in {"pass", "fail", "needs_review"}:
            raise ValueError(f"{case['id']}: review the answer and set review_label first")
        allowed_sources = {"human", "assistant_review"} if allow_practice else {"human"}
        if case.get("review_source") not in allowed_sources:
            raise ValueError(f"{case['id']}: independent human review is required; set review_source after reviewing")
        if case.get("split") not in {"dev", "test"}:
            raise ValueError(f"{case['id']}: choose dev or test")
    return cases


def review_dataset(client: Client, name: str, cases: list[dict]):
    records = [{"case_id": c["id"], "review_partition": c["split"], **{key: c[key] for key in (
        "request", "response", "review_label", "review_source", "source", "split"
    )}} for c in cases]
    try:
        dataset = client.datasets.get_dataset(dataset=name)
    except (ValueError, httpx.HTTPStatusError) as error:
        missing = (isinstance(error, ValueError) and str(error) == f"Dataset not found: {name}") or (
            isinstance(error, httpx.HTTPStatusError) and error.response.status_code == 404
        )
        if not missing:
            raise
        return client.datasets.create_dataset(
            name=name, dataframe=pd.DataFrame(records), input_keys=["request", "response"],
            output_keys=["review_label"], metadata_keys=["case_id", "review_source", "source", "review_partition"],
            split_key="split", dataset_description="Budget-judge review cases. See review_source for label provenance.",
        )
    existing = {e["metadata"]["case_id"]: e for e in dataset.examples}
    if set(existing) != {c["id"] for c in cases}:
        raise ValueError("Dataset cases differ. Use a new --dataset-name for the revised review set.")
    for case in cases:
        example = existing[case["id"]]
        if (example["input"] != {"request": case["request"], "response": case["response"]}
            or example["output"] != {"review_label": case["review_label"]}
            or example["metadata"].get("review_source") != case["review_source"]
            or example["metadata"].get("review_partition") != case["split"]):
            raise ValueError("A reviewed case changed. Use a new --dataset-name for the revised review set.")
    return dataset


def agrees_with_review(output: dict, expected: dict) -> dict:
    same = output["label"] == expected["review_label"]
    return {"score": int(same), "label": "agree" if same else "disagree",
            "explanation": f"Review: {expected['review_label']}; judge: {output['label']}."}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--cases", type=Path, required=True)
    parser.add_argument("--env-file", type=Path)
    parser.add_argument("--phoenix-url", default="http://localhost:6006")
    parser.add_argument("--dataset-name", default="budget-judge-review")
    parser.add_argument("--split", choices=["dev", "test"], required=True)
    parser.add_argument("--experiment-name", default=None)
    parser.add_argument("--model", default=DEFAULT_MODEL)
    parser.add_argument("--allow-practice-reviews", action="store_true",
                        help="Technical smoke test only; preserve assistant_review provenance")
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    cases = read_cases(args.cases, args.allow_practice_reviews)
    load_model_key(args.env_file)
    client = Client(base_url=args.phoenix_url)
    dataset = review_dataset(client, args.dataset_name, cases)
    selected = client.datasets.get_dataset(dataset=dataset.id, splits=[args.split])
    if not selected.examples:
        raise ValueError(f"No examples in the {args.split} split")
    judge = make_budget_judge(args.model)

    def task(example: dict) -> dict:
        data = example["input"]
        return result_dict(evaluate_budget(judge, data["request"], data["response"]))

    print(f"Evaluating {len(selected.examples)} {args.split} cases. Normal model API charges apply.")
    experiment = run_experiment(
        dataset=selected, task=task, evaluators=[agrees_with_review], client=client,
        experiment_name=args.experiment_name or f"budget-judge-{args.split}-{rubric_version()}",
        experiment_metadata={"rubric_version": rubric_version(), "model": args.model,
                             "review_sources": sorted({c["review_source"] for c in cases}),
                             "split": args.split},
        print_summary=False, retries=0,
    )
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(json.dumps(experiment, indent=2, default=lambda obj: asdict(obj) if is_dataclass(obj) else str(obj)) + "\n")
    print(f"Dataset: {args.phoenix_url.rstrip('/')}/datasets/{dataset.id}/experiments")
    print(f"Experiment: {experiment['experiment_id']}")
    if args.allow_practice_reviews:
        print("Practice reference labels are assistant reviews, not human validation.")
    for run in experiment["task_runs"]:
        if run.get("error"):
            raise RuntimeError(f"Judge task failed: {run['error']}")
        print(json.dumps({"example_id": run["dataset_example_id"], "output": run["output"]}))
    if any(getattr(run, "error", None) for run in experiment["evaluation_runs"]):
        raise RuntimeError("An agreement evaluation failed; inspect its error in Phoenix")


if __name__ == "__main__":
    main()
