from copy import deepcopy

import pytest

from academy.evaluations.order_checks import ordered_items_match

EXPECTED = {"items": [{"productId": "toy-051", "quantity": 1}]}


@pytest.mark.parametrize("items,label", [
    ([{"productId": "toy-051", "quantity": 1}], "pass"),
    ([{"productId": "toy-051", "quantity": 2}], "fail"),
    ([{"productId": "toy-014", "quantity": 1}], "fail"),
    ([{"productId": "toy-051", "quantity": 1}, {"productId": "toy-014", "quantity": 1}], "fail"),
    ([], "fail"),
    ([{"productId": "toy-051", "quantity": True}], "fail"),
    ([{"productId": "toy-051", "quantity": 0}], "fail"),
    ([{"productId": "toy-051"}], "fail"),
])
def test_order_contents(items, label):
    score = ordered_items_match.evaluate({"output": {"order": {"items": items}}, "expected": EXPECTED})[0]
    assert score.label == label
    assert score.score == int(label == "pass")
    assert score.explanation


def test_missing_order_does_not_pass():
    score = ordered_items_match.evaluate({"output": {"success": True}, "expected": EXPECTED})[0]
    assert score.label == "fail"


def test_line_order_and_repeated_product_ids_do_not_change_the_cart():
    expected = {"items": [{"productId": "toy-051", "quantity": 2}, {"productId": "toy-014", "quantity": 1}]}
    stored = {"items": [{"productId": "toy-014", "quantity": 1}, {"productId": "toy-051", "quantity": 1}, {"productId": "toy-051", "quantity": 1}]}
    original = deepcopy(stored)
    assert ordered_items_match.evaluate({"output": {"order": stored}, "expected": expected})[0].label == "pass"
    assert stored == original


def test_invalid_reference_is_not_reported_as_an_agent_failure():
    with pytest.raises(ValueError):
        ordered_items_match({"order": None}, {"items": []})
