import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { products } from "@/lib/inventory";
import { vectorSearch } from "@/lib/chroma";

export const searchProducts = tool(
  async (input) => {
    let filtered = [...products];

    // If there's a text query, try vector search first
    if (input.query) {
      // Build ChromaDB where filter for metadata
      const where: Record<string, unknown> = {};
      const conditions: Record<string, unknown>[] = [];

      if (input.category) {
        conditions.push({ category: { $eq: input.category.toLowerCase() } });
      }
      if (input.minAge !== undefined) {
        conditions.push({ ageMax: { $gte: input.minAge } });
      }
      if (input.maxAge !== undefined) {
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
        // Use vector results — they're already ranked by relevance
        const idSet = new Set(vectorIds);
        const idOrder = new Map(vectorIds.map((id, i) => [id, i]));

        filtered = products
          .filter((p) => idSet.has(p.id))
          .sort((a, b) => (idOrder.get(a.id) ?? 0) - (idOrder.get(b.id) ?? 0));

        // Apply keyword filter on top of vector results if provided
        if (input.keywords && input.keywords.length > 0) {
          const kws = input.keywords.map((k: string) => k.toLowerCase());
          filtered = filtered.filter((p) =>
            kws.some((kw: string) =>
              p.keywords.some((pk) => pk.toLowerCase().includes(kw))
            )
          );
        }

        const results = filtered.slice(0, 10).map((p) => ({
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
        }));

        return JSON.stringify({ results, totalFound: filtered.length });
      }

      // Vector search unavailable or returned nothing — fall back to keyword match
      const q = input.query.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      );
    }

    // Apply non-vector filters (used when no query, or as fallback)
    if (input.keywords && input.keywords.length > 0) {
      const kws = input.keywords.map((k: string) => k.toLowerCase());
      filtered = filtered.filter((p) =>
        kws.some((kw: string) =>
          p.keywords.some((pk) => pk.toLowerCase().includes(kw))
        )
      );
    }

    if (input.minAge !== undefined) {
      filtered = filtered.filter((p) => p.ageRange.max >= input.minAge!);
    }

    if (input.maxAge !== undefined) {
      filtered = filtered.filter((p) => p.ageRange.min <= input.maxAge!);
    }

    if (input.category) {
      const cat = input.category.toLowerCase();
      filtered = filtered.filter((p) => p.category.toLowerCase().includes(cat));
    }

    const results = filtered.slice(0, 10).map((p) => ({
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
    }));

    return JSON.stringify({ results, totalFound: filtered.length });
  },
  {
    name: "search_products",
    description:
      "Search the toy store inventory by text query, keywords, age range, or category. Use this when the user wants to find or browse products.",
    schema: z.object({
      query: z
        .string()
        .optional()
        .describe("Free-text search query to match against product names and descriptions"),
      keywords: z
        .array(z.string())
        .optional()
        .describe("Specific keywords to match against product keyword tags"),
      minAge: z
        .number()
        .optional()
        .describe("Minimum age in years for the target child"),
      maxAge: z
        .number()
        .optional()
        .describe("Maximum age in years for the target child"),
      category: z
        .string()
        .optional()
        .describe("Product category to filter by"),
    }),
  }
);
