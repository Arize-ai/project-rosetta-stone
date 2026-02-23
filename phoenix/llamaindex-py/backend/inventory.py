import json
from pathlib import Path

_data_path = Path(__file__).parent / "products.json"
products: list[dict] = json.loads(_data_path.read_text())

# Index by ID for fast lookup
_products_by_id: dict[str, dict] = {p["id"]: p for p in products}


def get_product(product_id: str) -> dict | None:
    return _products_by_id.get(product_id)


def get_featured() -> dict:
    """Return top 5 products by bestSellersRank and all categories."""
    sorted_products = sorted(products, key=lambda p: p["bestSellersRank"])
    popular = [
        {
            "id": p["id"],
            "name": p["name"],
            "price": p["price"],
            "image": p["image"],
            "rating": p["rating"],
            "category": p["category"],
            "ageRange": f"{p['ageRange']['min']}-{p['ageRange']['max']} years",
        }
        for p in sorted_products[:5]
    ]

    categories = sorted({p["category"] for p in products})

    return {"popular": popular, "categories": categories}


def get_all_categories() -> list[str]:
    return sorted({p["category"] for p in products})
