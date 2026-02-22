import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { cancelOrder } from "@/lib/orders";

export const cancelOrderTool = tool(
  async (input) => {
    return JSON.stringify(cancelOrder(input.orderId, input.userId));
  },
  {
    name: "cancel_order",
    description:
      "Cancel an order by its order ID. Only orders that are still processing or shipping can be cancelled. Delivered orders cannot be cancelled.",
    schema: z.object({
      userId: z.string().describe("The authenticated user's ID"),
      orderId: z.string().describe("The order ID to cancel (e.g. 'A1B2C3D4')"),
    }),
  }
);
