import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { products } from "@/lib/inventory";

export const getProduct = createTool({
  id: "get-product",
  description:
    "Get detailed information about a specific product by its ID. Use this when the user asks about a specific product or needs more details.",
  inputSchema: z.object({
    productId: z.string().describe("The product ID (e.g. 'toy-001')"),
  }),
  outputSchema: z.object({
    found: z.boolean(),
    product: z
      .object({
        id: z.string(),
        name: z.string(),
        description: z.string(),
        marketingCopy: z.string(),
        keywords: z.array(z.string()),
        ageRange: z.string(),
        price: z.number(),
        inventory: z.number(),
        category: z.string(),
        image: z.string(),
        rating: z.object({
          stars: z.number(),
          numberOfRatings: z.number(),
        }),
        manufacturer: z.string(),
        dimensions: z.object({
          lengthInches: z.number(),
          widthInches: z.number(),
          heightInches: z.number(),
          weightLbs: z.number(),
        }),
        bestSellersRank: z.number(),
      })
      .optional(),
  }),
  execute: async (input) => {
    const product = products.find((p) => p.id === input.productId);
    if (!product) {
      return { found: false };
    }
    return {
      found: true,
      product: {
        id: product.id,
        name: product.name,
        description: product.description,
        marketingCopy: product.marketingCopy,
        keywords: product.keywords,
        ageRange: `${product.ageRange.min}-${product.ageRange.max} years`,
        price: product.price,
        inventory: product.inventory,
        category: product.category,
        image: product.image,
        rating: product.rating,
        manufacturer: product.manufacturer,
        dimensions: product.dimensions,
        bestSellersRank: product.bestSellersRank,
      },
    };
  },
});
