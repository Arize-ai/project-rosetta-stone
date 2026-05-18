from __future__ import annotations

import os
from urllib.parse import urlparse

import chromadb

CHROMA_URL = os.environ.get("CHROMA_URL", "http://localhost:8000")
COLLECTION_NAME = "products"

_client: chromadb.HttpClient | None = None


def _get_client() -> chromadb.HttpClient:
    global _client
    if _client is None:
        parsed = urlparse(CHROMA_URL)
        _client = chromadb.HttpClient(
            host=parsed.hostname or "localhost",
            port=parsed.port or 8000,
            ssl=(parsed.scheme == "https"),
        )
    return _client


def get_products_collection():
    try:
        client = _get_client()
        return client.get_collection(name=COLLECTION_NAME)
    except Exception as e:
        print(f"ChromaDB unavailable, falling back to keyword search: {e}")
        return None


def vector_search(
    query: str,
    n_results: int = 20,
    where: dict | None = None,
) -> list[str] | None:
    collection = get_products_collection()
    if collection is None:
        return None

    try:
        kwargs: dict = {"query_texts": [query], "n_results": n_results}
        if where:
            kwargs["where"] = where
        results = collection.query(**kwargs)
        return results["ids"][0] if results["ids"] else []
    except Exception as e:
        print(f"ChromaDB query failed, falling back to keyword search: {e}")
        return None
