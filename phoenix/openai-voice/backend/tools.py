"""Tool implementations and OpenAI tool/function-call schemas.

Each tool has:
- A plain Python function (the implementation)
- A JSON-schema definition compatible with both the OpenAI Realtime API
  `tools` field and the OpenAI Chat Completions `tools` parameter

The two consumers (voice agent and text-fallback chat agent) share these
definitions so a single change updates both.
"""

from typing import Any, Optional

from backend.inventory import get_product, products
from backend.orders import (
    cancel_order as _cancel_order,
    create_order,
    get_order_by_id,
    get_orders_by_user,
    search_orders_by_product,
)
from backend.chroma_client import vector_search


# ---------------------------------------------------------------------------
# 1. search_products
# ---------------------------------------------------------------------------


def search_products(
    query: Optional[str] = None,
    keywords: Optional[list[str]] = None,
    min_age: Optional[int] = None,
    max_age: Optional[int] = None,
    category: Optional[str] = None,
    **_: Any,
) -> dict:
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
            return {"results": results, "totalFound": len(filtered)}

        # Vector search unavailable or empty — fall back to substring match
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
    return {"results": results, "totalFound": len(filtered)}


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
# 2. get_product_detail
# ---------------------------------------------------------------------------


def get_product_detail(product_id: str, **_: Any) -> dict:
    product = get_product(product_id)
    if not product:
        return {"found": False}
    return {
        "found": True,
        "product": {
            "id": product["id"],
            "name": product["name"],
            "description": product["description"],
            "marketingCopy": product["marketingCopy"],
            "keywords": product["keywords"],
            "ageRange": f"{product['ageRange']['min']}-{product['ageRange']['max']} years",
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


# ---------------------------------------------------------------------------
# 3. purchase_product
# ---------------------------------------------------------------------------


def purchase_product(
    user_id: str,
    items: list,
    shipping_address: dict,
    **_: Any,
) -> dict:
    order_items = []
    for item in items:
        pid = item["product_id"]
        qty = item["quantity"]
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
        product = get_product(item["product_id"])
        product["inventory"] -= item["quantity"]

    order = create_order(user_id, order_items, shipping_address)

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


def check_order_status(
    user_id: str,
    order_id: Optional[str] = None,
    product_search: Optional[str] = None,
    **_: Any,
) -> dict:
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


def cancel_order_tool(user_id: str, order_id: str, **_: Any) -> dict:
    return _cancel_order(order_id, user_id)


# ---------------------------------------------------------------------------
# Tool schemas (shared between Realtime API and Chat Completions API)
# ---------------------------------------------------------------------------

# Realtime API tool format: top-level {type, name, description, parameters}.
# Chat Completions tool format: {type: "function", function: {name, description, parameters}}.
# We define the inner spec once and build both wrappers.

_TOOL_SPECS: list[dict] = [
    {
        "name": "search_products",
        "description": (
            "Search the toy store inventory by free-text query, keyword tags, age range, "
            "or category. Returns up to 10 products ranked by relevance. Always use this "
            "when the customer describes what they're looking for."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "Free-text search query matched against product names and descriptions",
                },
                "keywords": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Specific keyword tags to match",
                },
                "min_age": {
                    "type": "integer",
                    "description": "Minimum age in years for the target child",
                },
                "max_age": {
                    "type": "integer",
                    "description": "Maximum age in years for the target child",
                },
                "category": {
                    "type": "string",
                    "description": "Product category to filter by",
                },
            },
        },
    },
    {
        "name": "get_product",
        "description": (
            "Get full detail for a specific product by ID, including marketing copy, "
            "dimensions, manufacturer, rating, and best-seller rank."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "product_id": {
                    "type": "string",
                    "description": "The product ID (e.g. 'toy-001')",
                }
            },
            "required": ["product_id"],
        },
    },
    {
        "name": "purchase_product",
        "description": (
            "Purchase one or more products. The customer's credit card is already on "
            "file, so only the shipping address is needed. Confirm products, quantities, "
            "and shipping details with the customer before calling."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "user_id": {
                    "type": "string",
                    "description": "The authenticated user's ID (from the system context)",
                },
                "items": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "product_id": {"type": "string"},
                            "quantity": {"type": "integer", "minimum": 1},
                        },
                        "required": ["product_id", "quantity"],
                    },
                    "description": "Products and quantities to purchase",
                },
                "shipping_address": {
                    "type": "object",
                    "properties": {
                        "name": {"type": "string", "description": "Recipient full name"},
                        "street": {"type": "string"},
                        "city": {"type": "string"},
                        "state": {"type": "string", "description": "State or province"},
                        "zip": {"type": "string", "description": "ZIP or postal code"},
                        "country": {"type": "string"},
                    },
                    "required": ["name", "street", "city", "state", "zip", "country"],
                },
            },
            "required": ["user_id", "items", "shipping_address"],
        },
    },
    {
        "name": "check_order_status",
        "description": (
            "Look up an order by ID, or search this user's orders by product name. "
            "With no filter, returns all of this user's orders."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "user_id": {
                    "type": "string",
                    "description": "The authenticated user's ID",
                },
                "order_id": {
                    "type": "string",
                    "description": "Specific order ID to look up (e.g. 'A1B2C3D4')",
                },
                "product_search": {
                    "type": "string",
                    "description": "Search term to match against ordered product names",
                },
            },
            "required": ["user_id"],
        },
    },
    {
        "name": "cancel_order",
        "description": (
            "Cancel an order that is still processing or shipping. Delivered orders "
            "cannot be cancelled. Confirm with the customer first."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "user_id": {
                    "type": "string",
                    "description": "The authenticated user's ID",
                },
                "order_id": {
                    "type": "string",
                    "description": "The order ID to cancel",
                },
            },
            "required": ["user_id", "order_id"],
        },
    },
]


def realtime_tools() -> list[dict]:
    """Tools formatted for the OpenAI Realtime API session.update event."""
    return [
        {
            "type": "function",
            "name": spec["name"],
            "description": spec["description"],
            "parameters": spec["parameters"],
        }
        for spec in _TOOL_SPECS
    ]


def chat_tools() -> list[dict]:
    """Tools formatted for the OpenAI Chat Completions API."""
    return [
        {
            "type": "function",
            "function": {
                "name": spec["name"],
                "description": spec["description"],
                "parameters": spec["parameters"],
            },
        }
        for spec in _TOOL_SPECS
    ]


# Dispatch table — maps OpenAI tool names to Python implementations
_HANDLERS = {
    "search_products": search_products,
    "get_product": get_product_detail,
    "purchase_product": purchase_product,
    "check_order_status": check_order_status,
    "cancel_order": cancel_order_tool,
}


def call_tool(name: str, arguments: dict) -> dict:
    """Dispatch a tool call by name with parsed JSON arguments."""
    handler = _HANDLERS.get(name)
    if handler is None:
        return {"error": f"Unknown tool: {name}"}
    try:
        return handler(**arguments)
    except Exception as e:
        return {"error": f"Tool '{name}' raised: {type(e).__name__}: {e}"}
