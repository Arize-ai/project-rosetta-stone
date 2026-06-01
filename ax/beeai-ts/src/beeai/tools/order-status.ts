import { Tool, StringToolOutput, ToolEmitter } from "beeai-framework/tools/base";
import { Emitter } from "beeai-framework/emitter/emitter";
import { z } from "zod";
import { getOrderById, getOrdersByUser, searchOrdersByProduct } from "@/lib/orders";

const inputSchema = z.object({
  userId: z.string().describe("The authenticated user's ID"),
  orderId: z.string().optional().describe("Specific order ID to look up (e.g. 'A1B2C3D4')"),
  productSearch: z
    .string()
    .optional()
    .describe("Search term to find orders by product name (e.g. 'puzzle' or 'train')"),
});

type Input = z.infer<typeof inputSchema>;

class CheckOrderStatusTool extends Tool<StringToolOutput> {
  name = "check_order_status";
  description =
    "Check the status of an order by order ID, or search for orders by product name. Use this when users ask about their order status, shipping, or delivery.";

  inputSchema() {
    return inputSchema;
  }

  public readonly emitter: ToolEmitter<Input, StringToolOutput> = Emitter.root.child({
    namespace: ["tool", "check_order_status"],
    creator: this,
  });

  protected async _run(input: Input): Promise<StringToolOutput> {
    let matched;
    if (input.orderId) {
      const o = getOrderById(input.orderId);
      matched = o ? [o] : [];
    } else if (input.productSearch) {
      matched = searchOrdersByProduct(input.userId, input.productSearch);
    } else {
      matched = getOrdersByUser(input.userId);
    }

    if (matched.length === 0) return new StringToolOutput(JSON.stringify({ found: false, orders: [] }));

    return new StringToolOutput(
      JSON.stringify({
        found: true,
        orders: matched.map((o) => ({
          orderId: o.id,
          items: o.items.map((i) => ({
            productName: i.productName,
            quantity: i.quantity,
            price: i.price,
          })),
          total: o.total,
          status: o.status,
          shippingAddress: {
            name: o.shippingAddress.name,
            city: o.shippingAddress.city,
            state: o.shippingAddress.state,
          },
          createdAt: o.createdAt,
        })),
      }),
    );
  }
}

export const checkOrderStatusTool = new CheckOrderStatusTool();
