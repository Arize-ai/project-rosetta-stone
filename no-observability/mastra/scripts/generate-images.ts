/**
 * Generate product images for all inventory items using OpenAI's gpt-image-1.
 *
 * Usage:
 *   cd no-observability/mastra
 *   npx tsx scripts/generate-images.ts
 *
 * Images are saved to public/product-images/<id>.png.
 * After all images are generated, inventory.ts is updated to add `image` fields.
 *
 * Skips products that already have an image file on disk (re-run safe).
 */

import * as fs from "fs";
import * as path from "path";
import { products } from "../src/lib/inventory.js";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) {
  console.error("OPENAI_API_KEY is not set. Load .env.local or export it.");
  process.exit(1);
}

const CONCURRENCY = 10;
const IMAGE_DIR = path.resolve(__dirname, "../public/product-images");
const INVENTORY_PATH = path.resolve(__dirname, "../src/lib/inventory.ts");

// ── Helpers ──────────────────────────────────────────────────────────────────

async function generateImage(
  name: string,
  description: string,
  category: string
): Promise<Buffer> {
  const prompt = `Product photo of a children's toy called "${name}" on a clean white background. ${description} Category: ${category}. Professional toy catalog photography style, well-lit, no text or labels.`;

  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-image-1",
      prompt,
      n: 1,
      size: "1024x1024",
      quality: "medium",
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenAI API error ${res.status}: ${body}`);
  }

  const json = (await res.json()) as {
    data: { b64_json: string }[];
  };

  return Buffer.from(json.data[0].b64_json, "base64");
}

// ── Concurrency pool ─────────────────────────────────────────────────────────

interface TaskResult {
  id: string;
  success: boolean;
  error?: string;
}

async function runPool(
  tasks: (() => Promise<TaskResult>)[],
  concurrency: number
): Promise<TaskResult[]> {
  const results: TaskResult[] = [];
  let index = 0;

  async function worker() {
    while (index < tasks.length) {
      const i = index++;
      results.push(await tasks[i]());
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, tasks.length) }, () =>
    worker()
  );
  await Promise.all(workers);
  return results;
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  fs.mkdirSync(IMAGE_DIR, { recursive: true });

  let generated = 0;
  let skipped = 0;
  let failed = 0;

  const tasks = products.map((product) => {
    return async (): Promise<TaskResult> => {
      const outPath = path.join(IMAGE_DIR, `${product.id}.png`);

      // Skip if image already exists (re-run safe)
      if (fs.existsSync(outPath)) {
        skipped++;
        console.log(`⏭  [${product.id}] ${product.name} — already exists, skipping`);
        return { id: product.id, success: true };
      }

      try {
        console.log(`🎨 [${product.id}] ${product.name} — generating...`);
        const buf = await generateImage(
          product.name,
          product.description,
          product.category
        );
        fs.writeFileSync(outPath, buf);
        generated++;
        console.log(`✅ [${product.id}] ${product.name} — saved`);
        return { id: product.id, success: true };
      } catch (err: any) {
        failed++;
        console.error(`❌ [${product.id}] ${product.name} — ${err.message}`);
        return { id: product.id, success: false, error: err.message };
      }
    };
  });

  console.log(`\nGenerating images for ${products.length} products (concurrency: ${CONCURRENCY})...\n`);

  const results = await runPool(tasks, CONCURRENCY);

  // ── Update inventory.ts ──────────────────────────────────────────────────
  // Add `image` field to every product that has a generated image on disk.

  const successIds = new Set(
    results.filter((r) => r.success).map((r) => r.id)
  );

  let source = fs.readFileSync(INVENTORY_PATH, "utf-8");

  // Add `image` to the Product interface if not already present
  if (!source.includes("image:")) {
    source = source.replace(
      /^(export interface Product \{[^}]*)(^\})/m,
      "$1  image: string;\n$2"
    );
    // Fix: the above regex may not work perfectly with multiline. Use a more targeted approach:
    source = source.replace(
      /(export interface Product \{[\s\S]*?)(^\})/m,
      (match, before, closing) => {
        if (before.includes("image:")) return match;
        return before + "  image: string;\n" + closing;
      }
    );
  }

  // For each product, insert the image field after the id line
  for (const product of products) {
    if (!successIds.has(product.id)) continue;

    const imagePath = `/product-images/${product.id}.png`;
    const idPattern = new RegExp(
      `(    id: "${product.id}",\\n    name: "[^"]*",\\n)`
    );

    if (source.includes(`image: "${imagePath}"`)) continue;

    source = source.replace(idPattern, `$1    image: "${imagePath}",\n`);
  }

  fs.writeFileSync(INVENTORY_PATH, source);

  console.log(`\n── Done ──`);
  console.log(`  Generated: ${generated}`);
  console.log(`  Skipped:   ${skipped}`);
  console.log(`  Failed:    ${failed}`);

  if (failed > 0) {
    console.log(`\nRe-run the script to retry failed images.`);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
