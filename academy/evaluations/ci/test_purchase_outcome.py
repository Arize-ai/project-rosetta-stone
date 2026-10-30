"""Record a real purchase outcome and its CI assertion in Phoenix."""
import json
from pathlib import Path
import subprocess
import sys

import pytest
from phoenix.client.pytest import log_evaluation, log_output


@pytest.mark.phoenix(dataset="wonder-toys-ci")
def test_confirmed_cart_is_saved(tmp_path):
    artifact = tmp_path / "purchase.json"
    completed = subprocess.run(
        [sys.executable, "-m", "academy.evaluations.check_orders", "--output", str(artifact)],
        cwd=Path(__file__).resolve().parents[3],
        capture_output=True, text=True, timeout=60,
    )
    assert completed.returncode == 0, completed.stderr
    actual = json.loads(artifact.read_text())[0]
    log_output(actual["output"])
    log_evaluation(
        name="ordered_items_match", score=actual["score"], label=actual["label"],
        explanation=actual["explanation"], annotator_kind="CODE",
    )
    assert actual["label"] == "pass", actual["explanation"]
