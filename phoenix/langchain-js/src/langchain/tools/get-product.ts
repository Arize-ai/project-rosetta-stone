import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { products } from "@/lib/inventory";

export const getProduct = tool(
  async (input) => {
    const product = products.find((p) => p.id === input.productId);
    if (!product) {
      return JSON.stringify({ found: false });
    }
    return JSON.stringify({
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
  },
  {
    name: "get_product",
    description:
      "Get detailed information about a specific product by its ID. Use this when the user asks about a specific product or needs more details.",
    schema: z.object({
      productId: z.string().describe("The product ID (e.g. 'toy-001')"),
    }),
  }
);
