import { tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import { cancelOrder } from "@/lib/orders";
import { getUserId } from "@/ai/context";
import { textResult } from "./result";

export const cancelOrderTool = tool(
  "cancel_order",
  "Cancel an order by its order ID. Only orders that are still processing or shipping can be cancelled. Delivered orders cannot be cancelled.",
  {
    orderId: z.string().describe("The order ID to cancel (e.g. 'A1B2C3D4')"),
  },
  async (input) => {
    const userId = getUserId();
    return textResult(cancelOrder(input.orderId, userId));
  }
);
