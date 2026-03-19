import { tool } from "ai";
import { z } from "zod";
import { cancelOrder } from "@/lib/orders";

const inputSchema = z.object({
  userId: z.string().describe("The authenticated user's ID"),
  orderId: z.string().describe("The order ID to cancel (e.g. 'A1B2C3D4')"),
});

export const cancelOrderTool = tool({
  description:
    "Cancel an order by its order ID. Only orders that are still processing or shipping can be cancelled. Delivered orders cannot be cancelled.",
  inputSchema,
  execute: async (input: z.infer<typeof inputSchema>) => {
    return cancelOrder(input.orderId, input.userId);
  },
});
