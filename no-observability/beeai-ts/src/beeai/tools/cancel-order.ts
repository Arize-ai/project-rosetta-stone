import { Tool, StringToolOutput, ToolEmitter } from "beeai-framework/tools/base";
import { Emitter } from "beeai-framework/emitter/emitter";
import { z } from "zod";
import { cancelOrder } from "@/lib/orders";

const inputSchema = z.object({
  userId: z.string().describe("The authenticated user's ID"),
  orderId: z.string().describe("The order ID to cancel (e.g. 'A1B2C3D4')"),
});

type Input = z.infer<typeof inputSchema>;

class CancelOrderTool extends Tool<StringToolOutput> {
  name = "cancel_order";
  description =
    "Cancel an order by its order ID. Only orders that are still processing or shipping can be cancelled. Delivered orders cannot be cancelled.";

  inputSchema() {
    return inputSchema;
  }

  public readonly emitter: ToolEmitter<Input, StringToolOutput> = Emitter.root.child({
    namespace: ["tool", "cancel_order"],
    creator: this,
  });

  protected async _run(input: Input): Promise<StringToolOutput> {
    const result = cancelOrder(input.orderId, input.userId);
    return new StringToolOutput(JSON.stringify(result));
  }
}

export const cancelOrderToolBeeAI = new CancelOrderTool();
