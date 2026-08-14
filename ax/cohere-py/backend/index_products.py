"""
Index all products into ChromaDB for vector search.

Prerequisites:
  ChromaDB server must be running at CHROMA_URL (default: http://localhost:8000)

Usage:
  python backend/index_products.py
"""

import json
import os
from pathlib import Path
from urllib.parse import urlparse

import chromadb

CHROMA_URL = os.environ.get("CHROMA_URL", "http://localhost:8000")
COLLECTION_NAME = "products"
BATCH_SIZE = 50


def main():
    data_path = Path(__file__).parent / "products.json"
    products = json.loads(data_path.read_text())

    parsed = urlparse(CHROMA_URL)
    print(f"Connecting to ChromaDB at {CHROMA_URL}...")
    client = chromadb.HttpClient(
        host=parsed.hostname or "localhost",
        port=parsed.port or 8000,
        ssl=(parsed.scheme == "https"),
    )

    # Verify connection
    heartbeat = client.heartbeat()
    print(f"Connected (heartbeat: {heartbeat})")

    # Delete and recreate collection for a clean index
    try:
        client.delete_collection(name=COLLECTION_NAME)
        print(f"Deleted existing '{COLLECTION_NAME}' collection")
    except Exception:
        pass  # Collection doesn't exist yet

    collection = client.create_collection(name=COLLECTION_NAME)
    print(f"Created '{COLLECTION_NAME}' collection")

    # Prepare documents
    ids = []
    documents = []
    metadatas = []

    for p in products:
        ids.append(p["id"])

        doc = "\n\n".join(
            [
                p["name"],
                p["description"],
                p["marketingCopy"],
                f"Category: {p['category']}",
                f"Keywords: {', '.join(p['keywords'])}",
                f"Manufacturer: {p['manufacturer']}",
                f"Ages {p['ageRange']['min']} to {p['ageRange']['max']}",
            ]
        )
        documents.append(doc)

        metadatas.append(
            {
                "category": p["category"],
                "ageMin": p["ageRange"]["min"],
                "ageMax": p["ageRange"]["max"],
                "price": p["price"],
                "inStock": p["inventory"] > 0,
                "manufacturer": p["manufacturer"],
            }
        )

    # Index in batches
    total = len(ids)
    for i in range(0, total, BATCH_SIZE):
        end = min(i + BATCH_SIZE, total)
        collection.add(
            ids=ids[i:end],
            documents=documents[i:end],
            metadatas=metadatas[i:end],
        )
        print(f"Indexed products {i + 1}–{end} of {total}")

    print(f"\nDone! {total} products indexed in ChromaDB.")


if __name__ == "__main__":
    main()
