import { Tool, StringToolOutput, ToolEmitter } from "beeai-framework/tools/base";
import { Emitter } from "beeai-framework/emitter/emitter";
import { z } from "zod";
import { products } from "@/lib/inventory";

const inputSchema = z.object({
  productId: z.string().describe("The product ID (e.g. 'toy-001')"),
});

type Input = z.infer<typeof inputSchema>;

class GetProductTool extends Tool<StringToolOutput> {
  name = "get_product";
  description =
    "Get detailed information about a specific product by its ID. Use this when the user asks about a specific product or needs more details.";

  inputSchema() {
    return inputSchema;
  }

  public readonly emitter: ToolEmitter<Input, StringToolOutput> = Emitter.root.child({
    namespace: ["tool", "get_product"],
    creator: this,
  });

  protected async _run(input: Input): Promise<StringToolOutput> {
    const product = products.find((p) => p.id === input.productId);
    if (!product) return new StringToolOutput(JSON.stringify({ found: false }));
    return new StringToolOutput(
      JSON.stringify({
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
      }),
    );
  }
}

export const getProductTool = new GetProductTool();
