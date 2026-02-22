import { Mastra } from "@mastra/core";
import { Observability } from "@mastra/observability";
import { ArizeExporter } from "@mastra/arize";
import { shoppingAgent } from "./agents/shopping-agent";

export const mastra = new Mastra({
  agents: { shoppingAgent },
  observability: new Observability({
    configs: {
      arize: {
        serviceName: process.env.PHOENIX_PROJECT_NAME || "wonder-toys-mastra",
        exporters: [
          new ArizeExporter({
            endpoint: process.env.PHOENIX_ENDPOINT!,
            apiKey: process.env.PHOENIX_API_KEY,
            projectName:
              process.env.PHOENIX_PROJECT_NAME || "wonder-toys-mastra",
          }),
        ],
      },
    },
  }),
});
