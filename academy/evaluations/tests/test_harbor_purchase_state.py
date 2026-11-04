"""Check the real Harbor snapshot and verifier without a model or container."""
import builtins
import importlib
import json
from pathlib import Path
import sys
from types import ModuleType, SimpleNamespace

import pytest

ROOT = Path(__file__).resolve().parents[3]
ADDRESS = {
    "name": "Demo Shopper", "street": "123 Example Street",
    "city": "Example City", "state": "CA", "zip": "00000", "country": "US",
}


@pytest.fixture
def application(monkeypatch):
    monkeypatch.syspath_prepend(str(ROOT / "phoenix/langchain-py"))
    # Snapshot tests need the real order store and tool, without an exporter.
    tracing = ModuleType("backend.tracing")
    monkeypatch.setitem(sys.modules, "backend.tracing", tracing)
    backend = importlib.import_module("backend")
    monkeypatch.setattr(backend, "tracing", tracing, raising=False)
    orders = importlib.import_module("backend.orders")
    tools = importlib.import_module("backend.tools")
    inventory = importlib.import_module("backend.inventory")
    monkeypatch.setattr(orders, "_orders", {})
    for product_id in ("toy-051", "toy-014"):
        product = inventory.get_product(product_id)
        monkeypatch.setitem(product, "inventory", product["inventory"])
    return orders, tools.purchase_product


def run_sandbox_script(relative_path, sandbox):
    """Redirect only this script's sandbox paths; execute its actual code."""
    def sandbox_path(value):
        if str(value).startswith(("/app/", "/logs/")):
            return sandbox / str(value).lstrip("/")
        return Path(value)

    def import_for_script(name, globals=None, locals=None, fromlist=(), level=0):
        if name == "pathlib":
            return SimpleNamespace(Path=sandbox_path)
        return builtins.__import__(name, globals, locals, fromlist, level)

    script = ROOT / relative_path
    namespace = {
        "__name__": "__main__", "__file__": str(script),
        "__builtins__": {**vars(builtins), "__import__": import_for_script},
    }
    exec(compile(script.read_text(), str(script), "exec"), namespace)


@pytest.mark.parametrize("extra_owner", [None, "academy-shopper", "another-shopper"])
def test_runner_snapshot_includes_every_purchase(application, tmp_path, monkeypatch, extra_owner):
    orders, purchase = application
    (tmp_path / "app").mkdir()
    if extra_owner:
        result = purchase.invoke({
            "user_id": extra_owner,
            "items": [{"productId": "toy-014", "quantity": 1}],
            "shipping_address": ADDRESS,
        })
        assert result["success"] is True

    monkeypatch.setattr(sys, "argv", ["runner.py", "--oracle"])
    run_sandbox_script("academy/harbor/runner.py", tmp_path)
    snapshot = json.loads((tmp_path / "app/order-state.json").read_text())
    assert len(snapshot["orders"]) == len(orders._orders) == (2 if extra_owner else 1)

    run_sandbox_script("academy/harbor/purchase-confirmed/tests/verify.py", tmp_path)
    scores = json.loads((tmp_path / "logs/verifier/reward.json").read_text())
    assert scores["reward"] == int(extra_owner is None)
    if extra_owner is None:
        assert all(value == 1 for value in scores.values())


@pytest.mark.parametrize("owner", [None, "another-shopper"])
def test_verifier_rejects_missing_or_wrong_owner_order(application, tmp_path, owner):
    orders, purchase = application
    (tmp_path / "app").mkdir()
    if owner:
        result = purchase.invoke({
            "user_id": owner,
            "items": [{"productId": "toy-051", "quantity": 1}],
            "shipping_address": ADDRESS,
        })
        assert result["success"] is True
    (tmp_path / "app/order-state.json").write_text(json.dumps({"orders": list(orders._orders.values())}))
    run_sandbox_script("academy/harbor/purchase-confirmed/tests/verify.py", tmp_path)
    scores = json.loads((tmp_path / "logs/verifier/reward.json").read_text())
    assert scores["reward"] == 0
    assert scores["order_owner_match"] == 0
    assert scores["ordered_items_match"] == int(owner is not None)
    assert scores["shipping_address_match"] == int(owner is not None)
