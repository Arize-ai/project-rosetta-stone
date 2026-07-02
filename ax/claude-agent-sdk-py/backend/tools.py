"""Wonder Toys tools exposed to the Claude Agent SDK.

The Claude Agent SDK consumes custom tools as an in-process MCP server built
with `create_sdk_mcp_server`. Each `@tool` runs in this same Python process, so
the `current_user_id` context var set by the request handler is visible here —
no user id needs to be threaded through the model.

Tool names as seen by the model are namespaced `mcp__wonder_toys__<name>`; the
allow-list in `agent.py` uses those fully-qualified names.
"""

import json

from claude_agent_sdk import tool, create_sdk_mcp_server

from backend.context import current_user_id
from backend.inventory import products, get_product
from backend.orders import (
    create_order,
    get_order_by_id,
    get_orders_by_user,
    search_orders_by_product,
    cancel_order,
)
from backend.chroma_client import vector_search


def _text(payload: dict) -> dict:
    """Wrap a JSON-serialisable payload in the MCP tool-result envelope."""
    return {"content": [{"type": "text", "text": json.dumps(payload)}]}


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


@tool(
    "search_products",
    "Search the toy store inventory by text query, keywords, age range, or category. Use this when the user wants to find or browse products.",
    {
        "type": "object",
        "properties": {
            "query": {
                "type": "string",
                "description": "Free-text search query to match against product names and descriptions",
            },
            "keywords": {
                "type": "array",
                "items": {"type": "string"},
                "description": "Specific keywords to match against product keyword tags",
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
        "required": [],
    },
)
async def search_products(args: dict) -> dict:
    query = args.get("query")
    keywords = args.get("keywords")
    min_age = args.get("min_age")
    max_age = args.get("max_age")
    category = args.get("category")

    filtered = list(products)

    # If there's a text query, try vector search first
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

        if vector_ids and len(vector_ids) > 0:
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
            return _text({"results": results, "totalFound": len(filtered)})

        # Vector search unavailable or returned nothing — fall back to keyword match
        q = query.lower()
        filtered = [
            p
            for p in filtered
            if q in p["name"].lower() or q in p["description"].lower()
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
    return _text({"results": results, "totalFound": len(filtered)})


# ---------------------------------------------------------------------------
# 2. get_product_detail
# ---------------------------------------------------------------------------


@tool(
    "get_product_detail",
    "Get detailed information about a specific product by its ID. Use this when the user asks about a specific product or needs more details.",
    {
        "type": "object",
        "properties": {
            "product_id": {
                "type": "string",
                "description": "The product ID to look up (e.g. 'toy-001')",
            },
        },
        "required": ["product_id"],
    },
)
async def get_product_detail(args: dict) -> dict:
    product = get_product(args["product_id"])
    if not product:
        return _text({"found": False})
    return _text(
        {
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
    )


# ---------------------------------------------------------------------------
# 3. purchase_product
# ---------------------------------------------------------------------------


@tool(
    "purchase_product",
    "Purchase one or more products. The user's credit card is on file, so only shipping details are needed. Use this after the user has confirmed they want to buy and has provided shipping information.",
    {
        "type": "object",
        "properties": {
            "items": {
                "type": "array",
                "description": "List of products and quantities to purchase",
                "items": {
                    "type": "object",
                    "properties": {
                        "product_id": {
                            "type": "string",
                            "description": "The product ID to purchase (e.g. 'toy-001')",
                        },
                        "quantity": {
                            "type": "integer",
                            "minimum": 1,
                            "description": "Quantity to purchase",
                        },
                    },
                    "required": ["product_id", "quantity"],
                },
            },
            "shipping_name": {"type": "string", "description": "Recipient full name"},
            "shipping_street": {"type": "string", "description": "Street address"},
            "shipping_city": {"type": "string", "description": "City"},
            "shipping_state": {"type": "string", "description": "State or Province"},
            "shipping_zip": {"type": "string", "description": "ZIP or Postal code"},
            "shipping_country": {"type": "string", "description": "Country"},
        },
        "required": [
            "items",
            "shipping_name",
            "shipping_street",
            "shipping_city",
            "shipping_state",
            "shipping_zip",
            "shipping_country",
        ],
    },
)
async def purchase_product(args: dict) -> dict:
    user_id = current_user_id.get()
    items = args["items"]

    order_items = []
    for item in items:
        pid = item["product_id"]
        qty = item["quantity"]
        product = get_product(pid)
        if not product:
            return _text({"success": False, "error": f"Product {pid} not found"})
        if product["inventory"] < qty:
            return _text(
                {
                    "success": False,
                    "error": f"Insufficient stock for {product['name']}. Only {product['inventory']} available.",
                }
            )
        order_items.append(
            {
                "productId": product["id"],
                "productName": product["name"],
                "quantity": qty,
                "price": product["price"],
            }
        )

    # Deduct inventory
    for item in items:
        product = get_product(item["product_id"])
        product["inventory"] -= item["quantity"]

    addr = {
        "name": args["shipping_name"],
        "street": args["shipping_street"],
        "city": args["shipping_city"],
        "state": args["shipping_state"],
        "zip": args["shipping_zip"],
        "country": args["shipping_country"],
    }

    order = create_order(user_id, order_items, addr)

    return _text(
        {
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
    )


# ---------------------------------------------------------------------------
# 4. check_order_status
# ---------------------------------------------------------------------------


@tool(
    "check_order_status",
    "Check the status of an order by order ID, or search for orders by product name. Use this when users ask about their order status, shipping, or delivery.",
    {
        "type": "object",
        "properties": {
            "order_id": {
                "type": "string",
                "description": "Specific order ID to look up (e.g. 'A1B2C3D4')",
            },
            "product_search": {
                "type": "string",
                "description": "Search term to find orders by product name (e.g. 'puzzle' or 'train')",
            },
        },
        "required": [],
    },
)
async def check_order_status(args: dict) -> dict:
    user_id = current_user_id.get()
    order_id = args.get("order_id")
    product_search = args.get("product_search")

    if order_id:
        order = get_order_by_id(order_id)
        matched_orders = [order] if order else []
    elif product_search:
        matched_orders = search_orders_by_product(user_id, product_search)
    else:
        matched_orders = get_orders_by_user(user_id)

    if not matched_orders:
        return _text({"found": False, "orders": []})

    return _text(
        {
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
    )


# ---------------------------------------------------------------------------
# 5. cancel_order
# ---------------------------------------------------------------------------


@tool(
    "cancel_order",
    "Cancel an order by its order ID. Only orders that are still processing or shipping can be cancelled. Delivered orders cannot be cancelled.",
    {
        "type": "object",
        "properties": {
            "order_id": {
                "type": "string",
                "description": "The order ID to cancel (e.g. 'A1B2C3D4')",
            },
        },
        "required": ["order_id"],
    },
)
async def cancel_order_tool(args: dict) -> dict:
    user_id = current_user_id.get()
    return _text(cancel_order(args["order_id"], user_id))


# ---------------------------------------------------------------------------
# In-process MCP server + fully-qualified tool allow-list
# ---------------------------------------------------------------------------

MCP_SERVER_NAME = "wonder_toys"

wonder_toys_server = create_sdk_mcp_server(
    name=MCP_SERVER_NAME,
    version="1.0.0",
    tools=[
        search_products,
        get_product_detail,
        purchase_product,
        check_order_status,
        cancel_order_tool,
    ],
)

# Names as the model sees them: mcp__<server>__<tool>
allowed_tools = [
    f"mcp__{MCP_SERVER_NAME}__search_products",
    f"mcp__{MCP_SERVER_NAME}__get_product_detail",
    f"mcp__{MCP_SERVER_NAME}__purchase_product",
    f"mcp__{MCP_SERVER_NAME}__check_order_status",
    f"mcp__{MCP_SERVER_NAME}__cancel_order",
]
