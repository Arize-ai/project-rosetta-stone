import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import {
  getOrderById,
  getOrdersByUser,
  searchOrdersByProduct,
} from "@/lib/orders";

export const checkOrderStatus = createTool({
  id: "check-order-status",
  description:
    "Check the status of an order by order ID, or search for orders by product name. Use this when users ask about their order status, shipping, or delivery.",
  inputSchema: z.object({
    userId: z.string().describe("The authenticated user's ID"),
    orderId: z
      .string()
      .optional()
      .describe("Specific order ID to look up (e.g. 'A1B2C3D4')"),
    productSearch: z
      .string()
      .optional()
      .describe("Search term to find orders by product name (e.g. 'puzzle' or 'train')"),
  }),
  outputSchema: z.object({
    found: z.boolean(),
    orders: z.array(
      z.object({
        orderId: z.string(),
        items: z.array(
          z.object({
            productName: z.string(),
            quantity: z.number(),
            price: z.number(),
          })
        ),
        total: z.number(),
        status: z.string(),
        shippingAddress: z.object({
          name: z.string(),
          city: z.string(),
          state: z.string(),
        }),
        createdAt: z.string(),
      })
    ),
  }),
  execute: async (input) => {
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
