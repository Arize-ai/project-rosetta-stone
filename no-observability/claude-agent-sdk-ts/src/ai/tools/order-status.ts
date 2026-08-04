import { tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import {
  getOrderById,
  getOrdersByUser,
  searchOrdersByProduct,
} from "@/lib/orders";
import { getUserId } from "@/ai/context";
import { textResult } from "./result";

export const checkOrderStatus = tool(
  "check_order_status",
  "Check the status of an order by order ID, or search for orders by product name. Use this when users ask about their order status, shipping, or delivery.",
  {
    orderId: z
      .string()
      .nullish()
      .describe("Specific order ID to look up (e.g. 'A1B2C3D4')"),
    productSearch: z
      .string()
      .nullish()
      .describe("Search term to find orders by product name (e.g. 'puzzle' or 'train')"),
  },
  async (input) => {
    const userId = getUserId();
    let matchedOrders;

    if (input.orderId) {
      const order = getOrderById(input.orderId);
      matchedOrders = order ? [order] : [];
    } else if (input.productSearch) {
      matchedOrders = searchOrdersByProduct(userId, input.productSearch);
    } else {
      matchedOrders = getOrdersByUser(userId);
    }

    if (matchedOrders.length === 0) {
      return textResult({ found: false, orders: [] });
    }

    return textResult({
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
    });
  }
);
