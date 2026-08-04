import { tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import { products } from "@/lib/inventory";
import { textResult } from "./result";

export const getProduct = tool(
  "get_product_detail",
  "Get detailed information about a specific product by its ID. Use this when the user asks about a specific product or needs more details.",
  {
    productId: z.string().describe("The product ID to look up (e.g. 'toy-001')"),
  },
  async (input) => {
    const product = products.find((p) => p.id === input.productId);
    if (!product) {
      return textResult({ found: false });
    }
    return textResult({
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
    });
  }
);
