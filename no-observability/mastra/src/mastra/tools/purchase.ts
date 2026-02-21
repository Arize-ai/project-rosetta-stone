import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { products } from "@/lib/inventory";
import { createOrder } from "@/lib/orders";

export const purchaseProduct = createTool({
  id: "purchase-product",
  description:
    "Purchase one or more products. The user's credit card is on file, so only shipping details are needed. Use this after the user has confirmed they want to buy and has provided shipping information.",
  inputSchema: z.object({
    userId: z.string().describe("The authenticated user's ID"),
    items: z
      .array(
        z.object({
          productId: z.string().describe("The product ID to purchase"),
          quantity: z.number().min(1).describe("Quantity to purchase"),
        })
      )
      .describe("List of products and quantities to purchase"),
    shippingAddress: z.object({
      name: z.string().describe("Recipient full name"),
      street: z.string().describe("Street address"),
      city: z.string().describe("City"),
      state: z.string().describe("State/Province"),
      zip: z.string().describe("ZIP/Postal code"),
    }),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    orderId: z.string().optional(),
    total: z.number().optional(),
    error: z.string().optional(),
    items: z
      .array(
        z.object({
          productName: z.string(),
          quantity: z.number(),
          price: z.number(),
        })
      )
      .optional(),
  }),
  execute: async (input) => {
    const orderItems = [];
    for (const item of input.items) {
      const product = products.find((p) => p.id === item.productId);
      if (!product) {
        return { success: false, error: `Product ${item.productId} not found` };
      }
      if (product.inventory < item.quantity) {
        return {
          success: false,
          error: `Insufficient stock for ${product.name}. Only ${product.inventory} available.`,
        };
      }
      orderItems.push({
        productId: product.id,
        productName: product.name,
        quantity: item.quantity,
        price: product.price,
      });
    }

    // Deduct inventory
    for (const item of input.items) {
      const product = products.find((p) => p.id === item.productId)!;
      product.inventory -= item.quantity;
    }

    const order = createOrder(input.userId, orderItems, input.shippingAddress);

    return {
      success: true,
      orderId: order.id,
      total: order.total,
      items: orderItems.map((i) => ({
        productName: i.productName,
        quantity: i.quantity,
        price: i.price,
      })),
    };
  },
});
