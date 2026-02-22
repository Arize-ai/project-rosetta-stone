import os

from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import StreamingResponse

from backend.inventory import get_product, get_featured
from backend.agent import stream_agent

BACKEND_SECRET = os.environ.get("BACKEND_SECRET", "")

app = FastAPI(title="Wonder Toys LangChain Backend")


def _verify_api_key(request: Request) -> None:
    api_key = request.headers.get("x-api-key", "")
    if not BACKEND_SECRET:
        return  # No secret configured, allow all (dev mode)
    if api_key != BACKEND_SECRET:
        raise HTTPException(status_code=403, detail="Invalid API key")


@app.post("/chat")
async def chat(request: Request):
    _verify_api_key(request)

    user_id = request.headers.get("x-user-id", "anonymous")
    body = await request.json()
    messages = body.get("messages", [])

    return StreamingResponse(
        stream_agent(messages, user_id),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    )


@app.get("/products/featured")
async def featured_products():
    return get_featured()


@app.get("/products/{product_id}")
async def product_detail(product_id: str):
    product = get_product(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return {
        "id": product["id"],
        "name": product["name"],
        "description": product["description"],
        "marketingCopy": product["marketingCopy"],
        "keywords": product["keywords"],
        "ageRange": product["ageRange"],
        "price": product["price"],
        "inventory": product["inventory"],
        "category": product["category"],
        "image": product["image"],
        "rating": product["rating"],
        "manufacturer": product["manufacturer"],
        "dimensions": product["dimensions"],
        "bestSellersRank": product["bestSellersRank"],
    }
