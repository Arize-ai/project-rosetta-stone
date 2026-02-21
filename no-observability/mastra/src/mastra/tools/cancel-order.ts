import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { cancelOrder } from "@/lib/orders";

export const cancelOrderTool = createTool({
  id: "cancel-order",
  description:
    "Cancel an order by its order ID. Only orders that are still processing or shipping can be cancelled. Delivered orders cannot be cancelled.",
  inputSchema: z.object({
    userId: z.string().describe("The authenticated user's ID"),
    orderId: z.string().describe("The order ID to cancel (e.g. 'A1B2C3D4')"),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    error: z.string().optional(),
  }),
  execute: async (input) => {
    return cancelOrder(input.orderId, input.userId);
  },
});
