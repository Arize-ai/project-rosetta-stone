import { tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import { products } from "@/lib/inventory";
import type { Where } from "chromadb";
import { vectorSearch } from "@/lib/chroma";
import { textResult } from "./result";

function toSearchResult(p: (typeof products)[number]) {
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    price: p.price,
    ageRange: `${p.ageRange.min}-${p.ageRange.max} years`,
    category: p.category,
    inStock: p.inventory > 0,
    image: p.image,
    rating: p.rating,
    manufacturer: p.manufacturer,
  };
}

export const searchProducts = tool(
  "search_products",
  "Search the toy store inventory by text query, keywords, age range, or category. Use this when the user wants to find or browse products.",
  {
    query: z
      .string()
      .nullish()
      .describe("Free-text search query to match against product names and descriptions"),
    keywords: z
      .array(z.string())
      .nullish()
      .describe("Specific keywords to match against product keyword tags"),
    minAge: z.number().nullish().describe("Minimum age in years for the target child"),
    maxAge: z.number().nullish().describe("Maximum age in years for the target child"),
    category: z.string().nullish().describe("Product category to filter by"),
  },
  async (input) => {
    let filtered = [...products];

    if (input.query) {
      const where: Where = {};
      const conditions: Where[] = [];

      if (input.category) {
        conditions.push({ category: { $eq: input.category.toLowerCase() } });
      }
      if (input.minAge !== null && input.minAge !== undefined) {
        conditions.push({ ageMax: { $gte: input.minAge } });
      }
      if (input.maxAge !== null && input.maxAge !== undefined) {
        conditions.push({ ageMin: { $lte: input.maxAge } });
      }

      if (conditions.length === 1) {
        Object.assign(where, conditions[0]);
      } else if (conditions.length > 1) {
        Object.assign(where, { $and: conditions });
      }

      const vectorIds = await vectorSearch(
        input.query,
        20,
        conditions.length > 0 ? where : undefined
      );

      if (vectorIds && vectorIds.length > 0) {
        const idSet = new Set(vectorIds);
        const idOrder = new Map(vectorIds.map((id, i) => [id, i]));

        filtered = products
          .filter((p) => idSet.has(p.id))
          .sort((a, b) => (idOrder.get(a.id) ?? 0) - (idOrder.get(b.id) ?? 0));

        if (input.keywords && input.keywords.length > 0) {
          const kws = input.keywords.map((k: string) => k.toLowerCase());
          filtered = filtered.filter((p) =>
            kws.some((kw: string) =>
              p.keywords.some((pk) => pk.toLowerCase().includes(kw))
            )
          );
        }

        const results = filtered.slice(0, 10).map(toSearchResult);
        return textResult({ results, totalFound: filtered.length });
      }

      const q = input.query.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      );
    }

    if (input.keywords && input.keywords.length > 0) {
      const kws = input.keywords.map((k: string) => k.toLowerCase());
      filtered = filtered.filter((p) =>
        kws.some((kw: string) =>
          p.keywords.some((pk) => pk.toLowerCase().includes(kw))
        )
      );
    }

    if (input.minAge !== null && input.minAge !== undefined) {
      filtered = filtered.filter((p) => p.ageRange.max >= input.minAge!);
    }

    if (input.maxAge !== null && input.maxAge !== undefined) {
      filtered = filtered.filter((p) => p.ageRange.min <= input.maxAge!);
    }

    if (input.category) {
      const cat = input.category.toLowerCase();
      filtered = filtered.filter((p) => p.category.toLowerCase().includes(cat));
    }

    const results = filtered.slice(0, 10).map(toSearchResult);
    return textResult({ results, totalFound: filtered.length });
  }
);
