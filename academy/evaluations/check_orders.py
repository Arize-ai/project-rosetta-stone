"""Run the existing purchase tool in a fresh process and check its stored result.

No model calls, API keys, or running application are required. The imported
application's in-memory order and inventory state belong only to this process.
"""
import argparse
from copy import deepcopy
from contextlib import nullcontext
from openinference.instrumentation import suppress_tracing
import json
from pathlib import Path
import sys

from academy.evaluations.order_checks import ordered_items_match

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "phoenix/langchain-py"))
from backend.orders import get_order_by_id  # noqa: E402
from backend.tools import purchase_product  # noqa: E402

CONFIRMED_ITEMS = [{"productId": "toy-051", "quantity": 1}]


def exercise(tracer=None) -> list[dict]:
    arguments = {
        "user_id": "academy-code-check",
        "items": CONFIRMED_ITEMS,
        "shipping_address": {
            "name": "Demo Shopper", "street": "123 Example Street",
            "city": "Example City", "state": "CA", "zip": "00000", "country": "US",
        },
    }
    context = tracer.start_as_current_span("purchase-product") if tracer else nullcontext()
    with context as span:
        if span:
            span.set_attribute("openinference.span.kind", "TOOL")
            span.set_attribute("tool.name", "purchase-product")
            span.set_attribute("input.value", json.dumps(arguments))
            span.set_attribute("input.mime_type", "application/json")
        result = purchase_product.invoke(arguments)
        if span:
            from opentelemetry.trace import StatusCode
            span.set_attribute("output.value", json.dumps(result))
            span.set_attribute("output.mime_type", "application/json")
            span.set_status(StatusCode.OK)
    if result.get("success") is not True:
        raise RuntimeError(f"The purchase tool did not succeed: {result}")
    order = deepcopy(get_order_by_id(result["orderId"]))
    if order is None:
        raise RuntimeError("The purchase tool returned an ID with no stored order")
    wrong_quantity = deepcopy(order)
    wrong_quantity["items"][0]["quantity"] = 2
    cases = [
        ("actual_order", order, "pass", "Recorded result of the existing purchase tool"),
        ("changed_quantity", wrong_quantity, "fail", "Deliberately altered copy to test the checker"),
        ("missing_order", None, "fail", "Deliberately missing order to test the checker"),
    ]
    rows = []
    for name, stored, expected_label, source in cases:
        with suppress_tracing():
            score = ordered_items_match.evaluate({
                "output": {"order": stored}, "expected": {"items": CONFIRMED_ITEMS},
            })[0]
        rows.append({"case": name, "source": source, "output": {"order": stored},
                     "expected": {"items": CONFIRMED_ITEMS}, "label": score.label,
                     "score": score.score, "explanation": score.explanation})
        if score.label != expected_label:
            raise AssertionError(f"{name}: expected {expected_label}, got {score.label}")
    return rows


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path)
    parser.add_argument("--phoenix-url", help="Optionally record the actual tool check in Phoenix")
    parser.add_argument("--project", default="wonder-toys")
    args = parser.parse_args()
    if args.phoenix_url:
        from phoenix.client import Client
        from phoenix.otel import register
        from opentelemetry.trace import StatusCode
        provider = register(
            project_name=args.project,
            endpoint=args.phoenix_url.rstrip("/") + "/v1/traces",
            protocol="http/protobuf", batch=True,
        )
        tracer = provider.get_tracer(__name__)
        with tracer.start_as_current_span("Purchase check") as span:
            span.set_attribute("openinference.span.kind", "CHAIN")
            span.set_attribute("input.value", json.dumps({"items": CONFIRMED_ITEMS}))
            span.set_attribute("input.mime_type", "application/json")
            rows = exercise(tracer)
            span.set_attribute("output.value", json.dumps(rows[0]["output"]))
            span.set_attribute("output.mime_type", "application/json")
            span.set_status(StatusCode.OK)
            span_id = format(span.get_span_context().span_id, "016x")
            trace_id = format(span.get_span_context().trace_id, "032x")
        if not provider.force_flush():
            raise RuntimeError("Phoenix trace export did not finish")
        client = Client(base_url=args.phoenix_url)
        import time
        import httpx
        row = rows[0]
        for attempt in range(30):
            try:
                client.spans.add_span_annotation(
                    span_id=span_id, annotation_name="ordered_items_match", annotator_kind="CODE",
                    label=row["label"], score=row["score"], explanation=row["explanation"],
                    identifier="academy-order-check", sync=True,
                )
                break
            except httpx.HTTPStatusError as error:
                if error.response.status_code != 404 or attempt == 29:
                    raise
                time.sleep(0.2)
        rows[0]["span_id"], rows[0]["trace_id"] = span_id, trace_id
        print(f"Phoenix trace: {trace_id}")
        provider.shutdown()
    else:
        rows = exercise()
    for row in rows:
        print(f"{row['case']}: {row['label']} — {row['explanation']}")
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(json.dumps(rows, indent=2) + "\n")


if __name__ == "__main__":
    main()
