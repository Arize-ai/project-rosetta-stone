"""Wonder Toys plugin for Semantic Kernel.

Semantic Kernel discovers tools via classes whose methods are decorated with
`@kernel_function`. The class is passed to `ChatCompletionAgent(plugins=[...])`.
"""

from typing import Annotated

from semantic_kernel.functions import kernel_function

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


class WonderToysPlugin:
    """Semantic Kernel plugin exposing the Wonder Toys shopping tools."""

    # ---------------------------------------------------------------------
    # 1. search_products
    # ---------------------------------------------------------------------
    @kernel_function(
        name="search_products",
        description="Search the toy store inventory by text query, keywords, age range, or category. Use this when the user wants to find or browse products. Pass an empty string / 0 for parameters you don't want to filter on.",
    )
    def search_products(
        self,
        query: Annotated[
            str,
            "Free-text search query to match against product names and descriptions; empty string to skip",
        ] = "",
        keywords: Annotated[
            str,
            # NOTE: We accept a single comma-separated string rather than `list[str]`
            # because SK's parameter validator rejects partial / single-element
            # streamed lists from the Anthropic connector with
            # `FunctionExecutionException: Parameter ... expected to be parsed to
            # list[str] but is not`. Splitting on commas inside the tool dodges that
            # validation path while keeping the schema natural to Claude.
            "Comma-separated keywords to match against product keyword tags (e.g. 'dragon,plush'); empty string to skip",
        ] = "",
        min_age: Annotated[
            int,
            "Minimum age in years for the target child; 0 to skip",
        ] = 0,
        max_age: Annotated[
            int,
            "Maximum age in years for the target child; 0 to skip",
        ] = 0,
        category: Annotated[
            str,
            "Product category to filter by; empty string to skip",
        ] = "",
    ) -> dict:
        # Normalize "no-op" sentinels back to Python None semantics.
        query = query or None
        keywords_list = (
            [k.strip() for k in keywords.split(",") if k.strip()] if keywords else None
        )
        keywords = keywords_list  # type: ignore[assignment] — rebind below uses list semantics
        min_age = min_age if min_age else None
        max_age = max_age if max_age else None
        category = category or None

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

    # ---------------------------------------------------------------------
    # 2. get_product_detail
    # ---------------------------------------------------------------------
    @kernel_function(
        name="get_product_detail",
        description="Get detailed information about a specific product by its ID. Use this when the user asks about a specific product or needs more details.",
    )
    def get_product_detail(
        self,
        product_id: Annotated[str, "The product ID to look up (e.g. 'toy-001')"],
    ) -> dict:
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

    # ---------------------------------------------------------------------
    # 3. purchase_product
    # ---------------------------------------------------------------------
    # NOTE: Semantic Kernel's Anthropic connector has two known parser issues
    # we work around here:
    #  1. Pydantic-derived JSON Schema for `list[PurchaseItem]` emits a
    #     "Ge(ge=1)" description string Claude rejects as
    #     "JSON schema is invalid; must match draft 2020-12".
    #  2. SK's parameter validator throws `FunctionExecutionException: Parameter
    #     <name> expected to be parsed to list[str|int] but is not` for streamed
    #     list args from the Anthropic connector.
    # Both are sidestepped by accepting comma-separated strings and splitting
    # inside the tool.
    @kernel_function(
        name="purchase_product",
        description="Purchase one or more products. The user's credit card is on file, so only shipping details are needed. Use this after the user has confirmed they want to buy and has provided shipping information.",
    )
    def purchase_product(
        self,
        product_ids: Annotated[
            str,
            "Comma-separated product IDs to purchase (e.g. 'toy-001,toy-042') — order must align with quantities",
        ],
        quantities: Annotated[
            str,
            "Comma-separated quantities to purchase for each product, aligned with product_ids (e.g. '1,2')",
        ],
        shipping_name: Annotated[str, "Recipient full name"],
        shipping_street: Annotated[str, "Street address"],
        shipping_city: Annotated[str, "City"],
        shipping_state: Annotated[str, "State or Province"],
        shipping_zip: Annotated[str, "ZIP or Postal code"],
        shipping_country: Annotated[str, "Country"],
    ) -> dict:
        user_id = current_user_id.get()

        # Parse the comma-separated lists.
        product_ids = [pid.strip() for pid in product_ids.split(",") if pid.strip()]
        try:
            quantities = [int(q.strip()) for q in quantities.split(",") if q.strip()]
        except ValueError:
            return {
                "success": False,
                "error": "quantities must be comma-separated integers",
            }

        if len(product_ids) != len(quantities):
            return {
                "success": False,
                "error": "product_ids and quantities must be the same length",
            }

        order_items = []
        for pid, qty in zip(product_ids, quantities):
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

        for pid, qty in zip(product_ids, quantities):
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

    # ---------------------------------------------------------------------
    # 4. check_order_status
    # ---------------------------------------------------------------------
    @kernel_function(
        name="check_order_status",
        description="Check the status of an order by order ID, or search for orders by product name. Use this when users ask about their order status, shipping, or delivery. Pass an empty string for whichever you don't want to use.",
    )
    def check_order_status(
        self,
        order_id: Annotated[
            str,
            "Specific order ID to look up (e.g. 'A1B2C3D4'); empty string to list all orders for the user",
        ] = "",
        product_search: Annotated[
            str,
            "Search term to find orders by product name (e.g. 'puzzle' or 'train'); empty string to skip",
        ] = "",
    ) -> dict:
        user_id = current_user_id.get()

        order_id = order_id or None
        product_search = product_search or None

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

    # ---------------------------------------------------------------------
    # 5. cancel_order
    # ---------------------------------------------------------------------
    @kernel_function(
        name="cancel_order",
        description="Cancel an order by its order ID. Only orders that are still processing or shipping can be cancelled. Delivered orders cannot be cancelled.",
    )
    def cancel_order_tool(
        self,
        order_id: Annotated[str, "The order ID to cancel (e.g. 'A1B2C3D4')"],
    ) -> dict:
        user_id = current_user_id.get()
        return cancel_order(order_id, user_id)
