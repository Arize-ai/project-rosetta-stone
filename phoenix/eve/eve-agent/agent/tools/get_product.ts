import { defineTool } from "eve/tools";
import { z } from "zod";
import { products } from "../lib/inventory.js";

const inputSchema = z.object({
  productId: z.string().describe("The product ID (e.g. 'toy-001')"),
});

export default defineTool({
  description:
    "Get detailed information about a specific product by its ID. Use this when the user asks about a specific product or needs more details.",
  inputSchema,
  async execute(input: z.infer<typeof inputSchema>) {
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
