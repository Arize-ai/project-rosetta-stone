import { Tool, StringToolOutput, ToolEmitter } from "beeai-framework/tools/base";
import { Emitter } from "beeai-framework/emitter/emitter";
import { z } from "zod";
import { products } from "@/lib/inventory";
import { createOrder } from "@/lib/orders";

const inputSchema = z.object({
  userId: z.string().describe("The authenticated user's ID"),
  items: z
    .array(
      z.object({
        productId: z.string().describe("The product ID to purchase"),
        quantity: z.number().min(1).describe("Quantity to purchase"),
      }),
    )
    .describe("List of products and quantities to purchase"),
  shippingAddress: z.object({
    name: z.string().describe("Recipient full name"),
    street: z.string().describe("Street address"),
    city: z.string().describe("City"),
    state: z.string().describe("State/Province"),
    zip: z.string().describe("ZIP/Postal code"),
    country: z.string().describe("Country"),
  }),
});

type Input = z.infer<typeof inputSchema>;

class PurchaseProductTool extends Tool<StringToolOutput> {
  name = "purchase_product";
  description =
    "Purchase one or more products. The user's credit card is on file, so only shipping details are needed. Use this after the user has confirmed they want to buy and has provided shipping information.";

  inputSchema() {
    return inputSchema;
  }

  public readonly emitter: ToolEmitter<Input, StringToolOutput> = Emitter.root.child({
    namespace: ["tool", "purchase_product"],
    creator: this,
  });

  protected async _run(input: Input): Promise<StringToolOutput> {
    const orderItems: { productId: string; productName: string; quantity: number; price: number }[] = [];
    for (const item of input.items) {
      const product = products.find((p) => p.id === item.productId);
      if (!product) {
        return new StringToolOutput(
          JSON.stringify({ success: false, error: `Product ${item.productId} not found` }),
        );
      }
      if (product.inventory < item.quantity) {
        return new StringToolOutput(
          JSON.stringify({
            success: false,
            error: `Insufficient stock for ${product.name}. Only ${product.inventory} available.`,
          }),
        );
      }
      orderItems.push({
        productId: product.id,
        productName: product.name,
        quantity: item.quantity,
        price: product.price,
      });
    }

    for (const item of input.items) {
      const product = products.find((p) => p.id === item.productId)!;
      product.inventory -= item.quantity;
    }

    const order = createOrder(input.userId, orderItems, input.shippingAddress);
    return new StringToolOutput(
      JSON.stringify({
        success: true,
        orderId: order.id,
        total: order.total,
        items: orderItems.map((i) => ({
          productName: i.productName,
          quantity: i.quantity,
          price: i.price,
        })),
      }),
    );
  }
}

export const purchaseProductTool = new PurchaseProductTool();
