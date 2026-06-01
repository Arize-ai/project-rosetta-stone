/**
 * One-time script to index all products into ChromaDB for vector search.
 *
 * Prerequisites:
 *   pip install chromadb
 *   chroma run --path ./chroma-data
 *
 * Usage:
 *   npx tsx scripts/index-products.ts
 */

import { ChromaClient } from "chromadb";
import { products } from "../src/lib/inventory";

const CHROMA_URL = process.env.CHROMA_URL || "http://localhost:8000";
const COLLECTION_NAME = "products";
const BATCH_SIZE = 50;

async function main() {
  console.log(`Connecting to ChromaDB at ${CHROMA_URL}...`);
  const url = new URL(CHROMA_URL);
  const client = new ChromaClient({
    host: url.hostname,
    port: parseInt(url.port) || 8000,
    ssl: url.protocol === "https:",
  });

  // Verify connection
  const heartbeat = await client.heartbeat();
  console.log(`Connected (heartbeat: ${JSON.stringify(heartbeat)})`);

  // Delete and recreate collection for a clean index
  try {
    await client.deleteCollection({ name: COLLECTION_NAME });
    console.log(`Deleted existing '${COLLECTION_NAME}' collection`);
  } catch {
    // Collection doesn't exist yet, that's fine
  }

  const collection = await client.createCollection({ name: COLLECTION_NAME });
  console.log(`Created '${COLLECTION_NAME}' collection`);

  // Prepare documents
  const ids: string[] = [];
  const documents: string[] = [];
  const metadatas: Record<string, string | number | boolean>[] = [];

  for (const p of products) {
    ids.push(p.id);

    // Combine all text fields into a single searchable document
    const doc = [
      p.name,
      p.description,
      p.marketingCopy,
      `Category: ${p.category}`,
      `Keywords: ${p.keywords.join(", ")}`,
      `Manufacturer: ${p.manufacturer}`,
      `Ages ${p.ageRange.min} to ${p.ageRange.max}`,
    ].join("\n\n");
    documents.push(doc);

    metadatas.push({
      category: p.category,
      ageMin: p.ageRange.min,
      ageMax: p.ageRange.max,
      price: p.price,
      inStock: p.inventory > 0,
      manufacturer: p.manufacturer,
    });
  }

  // Index in batches
  const total = ids.length;
  for (let i = 0; i < total; i += BATCH_SIZE) {
    const end = Math.min(i + BATCH_SIZE, total);
    await collection.add({
      ids: ids.slice(i, end),
      documents: documents.slice(i, end),
      metadatas: metadatas.slice(i, end),
    });
    console.log(`Indexed products ${i + 1}–${end} of ${total}`);
  }

  console.log(`\nDone! ${total} products indexed in ChromaDB.`);
}

main().catch((err) => {
  console.error("Failed to index products:", err);
  process.exit(1);
});
