import json
from pathlib import Path
from types import SimpleNamespace

import pytest

from academy.evaluations.budget_judge import evaluate_budget, result_dict
from academy.evaluations.validate_judge import read_cases


def test_uncertain_judge_is_unscored_and_only_receives_evidence():
    class Judge:
        def evaluate(self, data):
            assert data == {"request": "Under $25", "response": "Try this toy"}
            return [SimpleNamespace(label="needs_review", explanation="Missing price")]
    result = result_dict(evaluate_budget(Judge(), "Under $25", "Try this toy"))
    assert result["label"] == "needs_review"
    assert "score" not in result


def test_template_requires_review():
    fixture = Path(__file__).parents[1] / "fixtures/budget_review.json"
    with pytest.raises(ValueError, match="review the answer"):
        read_cases(fixture)


def test_assistant_labels_cannot_masquerade_as_human_validation(tmp_path):
    case = {"id": "case-1", "request": "Under $25", "response": "None available",
            "review_label": "pass", "review_source": "assistant_review", "split": "dev"}
    path = tmp_path / "cases.json"
    path.write_text(json.dumps([case]))
    with pytest.raises(ValueError, match="independent human review"):
        read_cases(path)
    assert read_cases(path, allow_practice=True)[0]["review_source"] == "assistant_review"


def test_production_scoring_rejects_error_or_wrong_span_level():
    from academy.evaluations.score_runs import root_evidence
    with pytest.raises(ValueError, match='root span'):
        root_evidence([{'parent_id': 'model-parent'}])
    with pytest.raises(ValueError, match='execution status'):
        root_evidence([{'parent_id': None, 'status_code': 'ERROR'}])
    with pytest.raises(ValueError, match='plain-text'):
        root_evidence([{'parent_id': None, 'status_code': 'OK', 'attributes': {
            'input.value': '{"messages":[]}', 'output.value': 'answer', 'input.mime_type': 'application/json'}}])
