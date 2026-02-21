import { Mastra } from "@mastra/core";
import { shoppingAgent } from "./agents/shopping-agent";

export const mastra = new Mastra({
  agents: { shoppingAgent },
});
