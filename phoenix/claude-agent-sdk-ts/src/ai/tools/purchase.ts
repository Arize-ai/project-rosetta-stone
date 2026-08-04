import { tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import { products } from "@/lib/inventory";
import { createOrder } from "@/lib/orders";
import { getUserId } from "@/ai/context";
import { textResult } from "./result";

export const purchaseProduct = tool(
  "purchase_product",
  "Purchase one or more products. The user's credit card is on file, so only shipping details are needed. Use this after the user has confirmed they want to buy and has provided shipping information.",
  {
    items: z
      .array(
        z.object({
          productId: z.string().describe("The product ID to purchase (e.g. 'toy-001')"),
          quantity: z.number().min(1).describe("Quantity to purchase"),
        })
      )
      .describe("List of products and quantities to purchase"),
    shippingName: z.string().describe("Recipient full name"),
    shippingStreet: z.string().describe("Street address"),
    shippingCity: z.string().describe("City"),
    shippingState: z.string().describe("State or Province"),
    shippingZip: z.string().describe("ZIP or Postal code"),
    shippingCountry: z.string().describe("Country"),
  },
  async (input) => {
    const userId = getUserId();

    const orderItems = [];
    for (const item of input.items) {
      const product = products.find((p) => p.id === item.productId);
      if (!product) {
        return textResult({ success: false, error: `Product ${item.productId} not found` });
      }
      if (product.inventory < item.quantity) {
        return textResult({
          success: false,
          error: `Insufficient stock for ${product.name}. Only ${product.inventory} available.`,
        });
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

    const order = createOrder(userId, orderItems, {
      name: input.shippingName,
      street: input.shippingStreet,
      city: input.shippingCity,
      state: input.shippingState,
      zip: input.shippingZip,
      country: input.shippingCountry,
    });

    return textResult({
      success: true,
      orderId: order.id,
      total: order.total,
      items: orderItems.map((i) => ({
        productName: i.productName,
        quantity: i.quantity,
        price: i.price,
      })),
    });
  }
);
