import { ChromaClient } from "chromadb";

const CHROMA_URL = process.env.CHROMA_URL || "http://localhost:8000";
const COLLECTION_NAME = "products";

let client: ChromaClient | null = null;

function getClient(): ChromaClient {
  if (!client) {
    const url = new URL(CHROMA_URL);
    client = new ChromaClient({
      host: url.hostname,
      port: parseInt(url.port) || 8000,
      ssl: url.protocol === "https:",
    });
  }
  return client;
}

export async function getProductsCollection() {
  try {
    const c = getClient();
    return await c.getCollection({ name: COLLECTION_NAME });
  } catch (error) {
    console.warn("ChromaDB unavailable, falling back to keyword search:", (error as Error).message);
    return null;
  }
}

export async function vectorSearch(
  query: string,
  nResults: number = 20,
  where?: Record<string, unknown>
) {
  const collection = await getProductsCollection();
  if (!collection) return null;

  try {
    const results = await collection.query({
      queryTexts: [query],
      nResults,
      ...(where ? { where } : {}),
    });

    return results.ids[0] || [];
  } catch (error) {
    console.warn("ChromaDB query failed, falling back to keyword search:", (error as Error).message);
    return null;
  }
}
