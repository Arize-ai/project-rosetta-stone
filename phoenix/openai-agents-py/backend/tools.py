from typing import Optional, Annotated

from agents import function_tool
from pydantic import BaseModel, Field

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


# ---------------------------------------------------------------------------
# 1. search_products
# ---------------------------------------------------------------------------


@function_tool
def search_products(
    query: Annotated[
        Optional[str],
        Field(
            description="Free-text search query to match against product names and descriptions"
        ),
    ] = None,
    keywords: Annotated[
        Optional[list[str]],
        Field(description="Specific keywords to match against product keyword tags"),
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
    """Search the toy store inventory by text query, keywords, age range, or category. Use this when the user wants to find or browse products."""
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
                    if any(
                        kw in pk.lower()
                        for kw in kws
                        for pk in p["keywords"]
                    )
                ]

            results = [_to_search_result(p) for p in filtered[:10]]
            return {"results": results, "totalFound": len(filtered)}

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


@function_tool
def get_product_detail(
    product_id: Annotated[
        str, Field(description="The product ID to look up (e.g. 'toy-001')")
    ],
) -> dict:
    """Get detailed information about a specific product by its ID. Use this when the user asks about a specific product or needs more details."""
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


class PurchaseItem(BaseModel):
    product_id: str = Field(description="The product ID to purchase (e.g. 'toy-001')")
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
    shipping_state: Annotated[str, Field(description="State or Province")],
    shipping_zip: Annotated[str, Field(description="ZIP or Postal code")],
    shipping_country: Annotated[str, Field(description="Country")],
) -> dict:
    """Purchase one or more products. The user's credit card is on file, so only shipping details are needed. Use this after the user has confirmed they want to buy and has provided shipping information."""
    user_id = current_user_id.get()

    order_items = []
    for item in items:
        pid = item["product_id"] if isinstance(item, dict) else item.product_id
        qty = item["quantity"] if isinstance(item, dict) else item.quantity
        product = get_product(pid)
        if not product:
            return {"success": False, "error": f"Product {pid} not found"}
        if product["inventory"] < qty:
            return {
                "success": False,
                "error": f"Insufficient stock for {product['name']}. Only {product['inventory']} available.",
            }
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
        pid = item["product_id"] if isinstance(item, dict) else item.product_id
        qty = item["quantity"] if isinstance(item, dict) else item.quantity
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
        Field(
            description="Specific order ID to look up (e.g. 'A1B2C3D4')"
        ),
    ] = None,
    product_search: Annotated[
        Optional[str],
        Field(
            description="Search term to find orders by product name (e.g. 'puzzle' or 'train')"
        ),
    ] = None,
) -> dict:
    """Check the status of an order by order ID, or search for orders by product name. Use this when users ask about their order status, shipping, or delivery."""
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
    order_id: Annotated[
        str, Field(description="The order ID to cancel (e.g. 'A1B2C3D4')")
    ],
) -> dict:
    """Cancel an order by its order ID. Only orders that are still processing or shipping can be cancelled. Delivered orders cannot be cancelled."""
    user_id = current_user_id.get()
    return cancel_order(order_id, user_id)


# All tools for the agent
all_tools = [
    search_products,
    get_product_detail,
    purchase_product,
    check_order_status,
    cancel_order_tool,
]
