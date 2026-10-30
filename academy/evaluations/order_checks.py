"""Check a stored order against the cart the shopper confirmed."""
from collections import Counter

from phoenix.evals import Score, create_evaluator


def item_quantities(items: object) -> Counter:
    """Normalize line order and repeated product IDs without accepting an empty cart."""
    if not isinstance(items, list) or not items:
        raise ValueError("Expected a non-empty list of order items")
    quantities: Counter = Counter()
    for item in items:
        if not isinstance(item, dict):
            raise ValueError("An order item must be an object")
        product_id, quantity = item.get("productId"), item.get("quantity")
        if not isinstance(product_id, str) or not product_id:
            raise ValueError("Each order item needs a product ID")
        if type(quantity) is not int or quantity < 1:
            raise ValueError("Each quantity must be a positive integer")
        quantities[product_id] += quantity
    return quantities


@create_evaluator(name="ordered_items_match", kind="code", direction="maximize")
def ordered_items_match(output: dict, expected: dict) -> Score:
    # A broken reference is an evaluation error, not a failed application run.
    wanted = item_quantities(expected["items"])
    order = output.get("order")
    if not isinstance(order, dict):
        passed, explanation = False, "No stored order was found."
    else:
        try:
            actual = item_quantities(order.get("items"))
            passed = actual == wanted
            explanation = (
                "The stored product IDs and quantities match the confirmed cart."
                if passed else f"Expected {dict(wanted)}; stored {dict(actual)}."
            )
        except ValueError as error:
            passed, explanation = False, f"Invalid stored order: {error}."
    return Score(
        name="ordered_items_match", label="pass" if passed else "fail",
        score=int(passed), explanation=explanation, kind="code", direction="maximize",
    )
