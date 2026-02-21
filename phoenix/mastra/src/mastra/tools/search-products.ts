import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { products } from "@/lib/inventory";

export const searchProducts = createTool({
  id: "search-products",
  description:
    "Search the toy store inventory by text query, keywords, age range, or category. Use this when the user wants to find or browse products.",
  inputSchema: z.object({
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
  outputSchema: z.object({
    results: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        description: z.string(),
        price: z.number(),
        ageRange: z.string(),
        category: z.string(),
        inStock: z.boolean(),
        image: z.string(),
        rating: z.object({
          stars: z.number(),
          numberOfRatings: z.number(),
        }),
        manufacturer: z.string(),
      })
    ),
    totalFound: z.number(),
  }),
  execute: async (input) => {
    let filtered = [...products];

    if (input.query) {
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

    return { results, totalFound: filtered.length };
  },
});
