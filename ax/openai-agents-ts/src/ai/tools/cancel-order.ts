import { tool } from "@openai/agents";
import { z } from "zod";
import { cancelOrder } from "@/lib/orders";

const inputSchema = z.object({
  userId: z.string().describe("The authenticated user's ID"),
  orderId: z.string().describe("The order ID to cancel (e.g. 'A1B2C3D4')"),
});

export const cancelOrderTool = tool({
  name: "cancel_order",
  description:
    "Cancel an order by its order ID. Only orders that are still processing or shipping can be cancelled. Delivered orders cannot be cancelled.",
  parameters: inputSchema,
  execute: async (input) => {
    return cancelOrder(input.orderId, input.userId);
  },
});
