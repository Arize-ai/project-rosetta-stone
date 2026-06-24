import { defineTool } from "eve/tools";
import { z } from "zod";
import {
  getOrderById,
  getOrdersByUser,
  searchOrdersByProduct,
} from "../lib/orders.js";

const inputSchema = z.object({
  userId: z.string().describe("The authenticated user's ID"),
  orderId: z
    .string()
    .optional()
    .describe("Specific order ID to look up (e.g. 'A1B2C3D4')"),
  productSearch: z
    .string()
    .optional()
    .describe("Search term to find orders by product name (e.g. 'puzzle' or 'train')"),
});

export default defineTool({
  description:
    "Check the status of an order by order ID, or search for orders by product name. Use this when users ask about their order status, shipping, or delivery.",
  inputSchema,
  async execute(input: z.infer<typeof inputSchema>) {
    let matchedOrders;

    if (input.orderId) {
      const order = getOrderById(input.orderId);
      matchedOrders = order ? [order] : [];
    } else if (input.productSearch) {
      matchedOrders = searchOrdersByProduct(input.userId, input.productSearch);
    } else {
      matchedOrders = getOrdersByUser(input.userId);
    }

    if (matchedOrders.length === 0) {
      return { found: false, orders: [] };
    }

    return {
      found: true,
      orders: matchedOrders.map((o) => ({
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
    };
  },
});
