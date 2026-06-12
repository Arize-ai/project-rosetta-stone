"""@function_tool wrappers for the OpenAI Agents SDK.

The same five tools serve both modes:
- Voice (`RealtimeAgent` via `RealtimeRunner`)
- Text (`Agent` via `Runner`)

User identity is injected via the `current_user_id` contextvar (set by the
HTTP/WS entry points), not via tool arguments — the model is told it is
authenticated and that the system handles the user id automatically.

In voice mode the search/product tools also push rendered markdown product
cards to the browser via the `current_voice_callback` contextvar. In text
mode that callback is None and the model emits markdown itself in the
streamed response.
"""

from __future__ import annotations

import json
from typing import Annotated, Optional

from agents import function_tool
from pydantic import BaseModel, Field

from backend.chroma_client import vector_search
from backend.context import current_user_id, current_voice_callback
from backend.inventory import get_product, products
from backend.orders import (
    cancel_order as _cancel_order,
)
from backend.orders import (
    create_order,
    get_order_by_id,
    get_orders_by_user,
    search_orders_by_product,
)


# ---------------------------------------------------------------------------
# Markdown formatters (voice mode only — text mode lets the model do it)
# ---------------------------------------------------------------------------


def _format_search_markdown(result: dict) -> str:
    results = result.get("results") or []
    if not results:
        return "_No matching products found._"
    lines: list[str] = []
    for p in results:
        lines.append(f"![{p['name']}]({p['image']})")
        lines.append(f"**{p['name']}** — ${p['price']:.2f}")
        stars = p["rating"]["stars"]
        count = p["rating"]["numberOfRatings"]
        lines.append(
            f"⭐ {stars:.1f} ({count:,} ratings) · Ages {p['ageRange']} "
            f"· by {p['manufacturer']}"
        )
        lines.append(p["description"])
        lines.append("")
    return "\n".join(lines).rstrip()


def _format_product_markdown(result: dict) -> str:
    if not result.get("found"):
        return "_That product could not be found._"
    p = result["product"]
    return (
        f"![{p['name']}]({p['image']})\n"
        f"## {p['name']}\n"
        f"**${p['price']:.2f}** · ⭐ {p['rating']['stars']:.1f} "
        f"({p['rating']['numberOfRatings']:,} ratings) · "
        f"Best Seller #{p['bestSellersRank']}\n\n"
        f"**Ages:** {p['ageRange']} · **Category:** {p['category']} · "
        f"**By:** {p['manufacturer']}\n"
        f"**Dimensions:** "
        f"{p['dimensions']['lengthInches']}×{p['dimensions']['widthInches']}×"
        f"{p['dimensions']['heightInches']} in, "
        f"{p['dimensions']['weightLbs']} lbs\n"
        f"**In Stock:** {p['inventory']} available\n\n"
        f"{p['description']}"
    )


async def _push_voice_markdown(name: str, markdown: Optional[str]) -> None:
    if not markdown:
        return
    cb = current_voice_callback.get()
    if cb is None:
        return
    try:
        await cb(name, markdown)
    except Exception:
        pass


def _to_search_result(p: dict) -> dict:
    return {
        "id": p["id"],
        "name": p["name"],
        "description": p["description"],
        "price": p["price"],
        "ageRange": f"{p['ageRange']['min']}-{p['ageRange']['max']} years",
        "category": p["category"],
        "inStock": p["inventory"] > 0,
        "image": p["image"],
        "rating": p["rating"],
        "manufacturer": p["manufacturer"],
    }


# ---------------------------------------------------------------------------
# 1. search_products
# ---------------------------------------------------------------------------


@function_tool
async def search_products(
    query: Annotated[
        Optional[str],
        Field(
            description=(
                "Free-text search query matched against product names and descriptions"
            )
        ),
    ] = None,
    keywords: Annotated[
        Optional[list[str]],
        Field(description="Specific keyword tags to match against product keywords"),
    ] = None,
    min_age: Annotated[
        Optional[int],
        Field(description="Minimum age in years for the target child"),
    ] = None,
    max_age: Annotated[
        Optional[int],
        Field(description="Maximum age in years for the target child"),
    ] = None,
    category: Annotated[
        Optional[str], Field(description="Product category to filter by")
    ] = None,
) -> dict:
    """Search the toy store inventory by free-text query, keyword tags, age range, or category. Returns up to 10 products ranked by relevance. Always use this when the customer describes what they're looking for."""
    filtered = list(products)

    if query:
        conditions: list[dict] = []
        if category:
            conditions.append({"category": {"$eq": category.lower()}})
        if min_age is not None:
            conditions.append({"ageMax": {"$gte": min_age}})
        if max_age is not None:
            conditions.append({"ageMin": {"$lte": max_age}})

        where: dict | None = None
        if len(conditions) == 1:
            where = conditions[0]
        elif len(conditions) > 1:
            where = {"$and": conditions}

        vector_ids = vector_search(query, 20, where)

        if vector_ids:
            id_set = set(vector_ids)
            id_order = {vid: i for i, vid in enumerate(vector_ids)}
            filtered = sorted(
                [p for p in products if p["id"] in id_set],
                key=lambda p: id_order.get(p["id"], 0),
            )

            if keywords:
                kws = [k.lower() for k in keywords]
                filtered = [
                    p
                    for p in filtered
                    if any(kw in pk.lower() for kw in kws for pk in p["keywords"])
                ]

            results = [_to_search_result(p) for p in filtered[:10]]
            result = {"results": results, "totalFound": len(filtered)}
            await _push_voice_markdown(
                "search_products", _format_search_markdown(result)
            )
            return result

        q = query.lower()
        filtered = [
            p for p in filtered if q in p["name"].lower() or q in p["description"].lower()
        ]

    if keywords:
        kws = [k.lower() for k in keywords]
        filtered = [
            p
            for p in filtered
            if any(kw in pk.lower() for kw in kws for pk in p["keywords"])
        ]

    if min_age is not None:
        filtered = [p for p in filtered if p["ageRange"]["max"] >= min_age]

    if max_age is not None:
        filtered = [p for p in filtered if p["ageRange"]["min"] <= max_age]

    if category:
        cat = category.lower()
        filtered = [p for p in filtered if cat in p["category"].lower()]

    results = [_to_search_result(p) for p in filtered[:10]]
    result = {"results": results, "totalFound": len(filtered)}
    await _push_voice_markdown("search_products", _format_search_markdown(result))
    return result


# ---------------------------------------------------------------------------
# 2. get_product
# ---------------------------------------------------------------------------


@function_tool
async def get_product_detail(
    product_id: Annotated[
        str, Field(description="The product ID to look up (e.g. 'toy-001')")
    ],
) -> dict:
    """Get full detail for a specific product by ID, including marketing copy, dimensions, manufacturer, rating, and best-seller rank."""
    product = get_product(product_id)
    if not product:
        result = {"found": False}
    else:
        result = {
            "found": True,
            "product": {
                "id": product["id"],
                "name": product["name"],
                "description": product["description"],
                "marketingCopy": product["marketingCopy"],
                "keywords": product["keywords"],
                "ageRange": (
                    f"{product['ageRange']['min']}-{product['ageRange']['max']} years"
                ),
                "price": product["price"],
                "inventory": product["inventory"],
                "category": product["category"],
                "image": product["image"],
                "rating": product["rating"],
                "manufacturer": product["manufacturer"],
                "dimensions": product["dimensions"],
                "bestSellersRank": product["bestSellersRank"],
            },
        }
    await _push_voice_markdown("get_product", _format_product_markdown(result))
    return result


# ---------------------------------------------------------------------------
# 3. purchase_product
# ---------------------------------------------------------------------------


class PurchaseItem(BaseModel):
    product_id: str = Field(description="The product ID (e.g. 'toy-001')")
    quantity: int = Field(ge=1, description="Quantity to purchase")


@function_tool
def purchase_product(
    items: Annotated[
        list[PurchaseItem],
        Field(description="List of products and quantities to purchase"),
    ],
    shipping_name: Annotated[str, Field(description="Recipient full name")],
    shipping_street: Annotated[str, Field(description="Street address")],
    shipping_city: Annotated[str, Field(description="City")],
    shipping_state: Annotated[str, Field(description="State or province")],
    shipping_zip: Annotated[str, Field(description="ZIP or postal code")],
    shipping_country: Annotated[str, Field(description="Country")],
) -> dict:
    """Purchase one or more products. The customer's credit card is already on file, so only the shipping address is needed. Confirm products, quantities, and shipping details with the customer before calling."""
    user_id = current_user_id.get()

    order_items: list[dict] = []
    for item in items:
        pid = item.product_id if hasattr(item, "product_id") else item["product_id"]
        qty = item.quantity if hasattr(item, "quantity") else item["quantity"]
        product = get_product(pid)
        if not product:
            return {"success": False, "error": f"Product {pid} not found"}
        if product["inventory"] < qty:
            return {
                "success": False,
                "error": (
                    f"Insufficient stock for {product['name']}. "
                    f"Only {product['inventory']} available."
                ),
            }
        order_items.append(
            {
                "productId": product["id"],
                "productName": product["name"],
                "quantity": qty,
                "price": product["price"],
            }
        )

    for item in items:
        pid = item.product_id if hasattr(item, "product_id") else item["product_id"]
        qty = item.quantity if hasattr(item, "quantity") else item["quantity"]
        product = get_product(pid)
        product["inventory"] -= qty

    addr = {
        "name": shipping_name,
        "street": shipping_street,
        "city": shipping_city,
        "state": shipping_state,
        "zip": shipping_zip,
        "country": shipping_country,
    }

    order = create_order(user_id, order_items, addr)
    return {
        "success": True,
        "orderId": order["id"],
        "total": order["total"],
        "items": [
            {
                "productName": i["productName"],
                "quantity": i["quantity"],
                "price": i["price"],
            }
            for i in order_items
        ],
    }


# ---------------------------------------------------------------------------
# 4. check_order_status
# ---------------------------------------------------------------------------


@function_tool
def check_order_status(
    order_id: Annotated[
        Optional[str],
        Field(description="Specific order ID to look up (e.g. 'A1B2C3D4')"),
    ] = None,
    product_search: Annotated[
        Optional[str],
        Field(description="Search term to match against ordered product names"),
    ] = None,
) -> dict:
    """Look up an order by ID, or search this user's orders by product name. With no filter, returns all of this user's orders."""
    user_id = current_user_id.get()

    if order_id:
        order = get_order_by_id(order_id)
        matched_orders = [order] if order else []
    elif product_search:
        matched_orders = search_orders_by_product(user_id, product_search)
    else:
        matched_orders = get_orders_by_user(user_id)

    if not matched_orders:
        return {"found": False, "orders": []}

    return {
        "found": True,
        "orders": [
            {
                "orderId": o["id"],
                "items": [
                    {
                        "productName": i["productName"],
                        "quantity": i["quantity"],
                        "price": i["price"],
                    }
                    for i in o["items"]
                ],
                "total": o["total"],
                "status": o["status"],
                "shippingAddress": {
                    "name": o["shippingAddress"]["name"],
                    "city": o["shippingAddress"]["city"],
                    "state": o["shippingAddress"]["state"],
                },
                "createdAt": o["createdAt"],
            }
            for o in matched_orders
        ],
    }


# ---------------------------------------------------------------------------
# 5. cancel_order
# ---------------------------------------------------------------------------


@function_tool
def cancel_order_tool(
    order_id: Annotated[str, Field(description="The order ID to cancel")],
) -> dict:
    """Cancel an order that is still processing or shipping. Delivered orders cannot be cancelled."""
    user_id = current_user_id.get()
    return _cancel_order(order_id, user_id)


# All tools (same list passed to RealtimeAgent and Agent)
all_tools = [
    search_products,
    get_product_detail,
    purchase_product,
    check_order_status,
    cancel_order_tool,
]


__all__ = [
    "all_tools",
    "search_products",
    "get_product_detail",
    "purchase_product",
    "check_order_status",
    "cancel_order_tool",
    "_format_search_markdown",
    "_format_product_markdown",
]


# Backwards-compat shim — kept so external code (notebooks, eval scripts)
# that imported `call_tool(...)` doesn't break. The SDK owns dispatch now.
def call_tool(name: str, arguments: dict) -> dict:  # pragma: no cover
    raise RuntimeError(
        "call_tool() is no longer used — tool dispatch is owned by the OpenAI "
        "Agents SDK. Invoke tools via Runner.run(...) or RealtimeRunner instead."
    )
