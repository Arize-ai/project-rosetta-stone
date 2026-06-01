/**
 * One-time script to generate products.json from the canonical inventory.ts.
 *
 * Usage:
 *   cd no-observability/langchain-py
 *   npx tsx scripts/generate-products-json.ts
 */

import { products } from "../../mastra/src/lib/inventory";
import { writeFileSync } from "fs";
import { join } from "path";

const outPath = join(__dirname, "..", "backend", "products.json");
writeFileSync(outPath, JSON.stringify(products, null, 2));
console.log(`Wrote ${products.length} products to ${outPath}`);
