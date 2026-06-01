import uuid
import random
from datetime import datetime, timezone
from typing import Literal

from backend.inventory import get_product

OrderStatus = Literal["processing", "shipping", "delivered", "cancelled"]

# In-memory order store (resets on restart)
_orders: dict[str, dict] = {}


def _random_status() -> OrderStatus:
    return random.choice(["processing", "shipping", "delivered"])


def create_order(
    user_id: str,
    items: list[dict],
    shipping_address: dict,
) -> dict:
    order_id = uuid.uuid4().hex[:8].upper()
    order = {
        "id": order_id,
        "userId": user_id,
        "items": items,
        "total": sum(item["price"] * item["quantity"] for item in items),
        "shippingAddress": shipping_address,
        "status": "processing",
        "createdAt": datetime.now(timezone.utc).isoformat(),
    }
    _orders[order_id] = order
    return order


def get_order_by_id(order_id: str) -> dict | None:
    return _orders.get(order_id.upper())


def get_orders_by_user(user_id: str) -> list[dict]:
    return [o for o in _orders.values() if o["userId"] == user_id]


def get_order_status(order_id: str) -> str | None:
    order = _orders.get(order_id.upper())
    if not order:
        return None
    # Simulate status progression: randomly advance status on each check
    order["status"] = _random_status()
    return order["status"]


def search_orders_by_product(user_id: str, search_term: str) -> list[dict]:
    term = search_term.lower()
    return [
        o
        for o in get_orders_by_user(user_id)
        if any(
            term in item["productName"].lower() or term in item["productId"].lower()
            for item in o["items"]
        )
    ]


def cancel_order(order_id: str, user_id: str) -> dict:
    order = _orders.get(order_id.upper())
    if not order:
        return {"success": False, "error": "Order not found"}
    if order["userId"] != user_id:
        return {"success": False, "error": "Order not found"}
    if order["status"] == "cancelled":
        return {"success": False, "error": "Order is already cancelled"}
    if order["status"] == "delivered":
        return {"success": False, "error": "Cannot cancel a delivered order"}

    order["status"] = "cancelled"

    # Restore inventory
    for item in order["items"]:
        product = get_product(item["productId"])
        if product:
            product["inventory"] += item["quantity"]

    return {"success": True}
