import { Mastra } from "@mastra/core";
import { Observability } from "@mastra/observability";
import { ArizeExporter } from "@mastra/arize";
import { shoppingAgent } from "./agents/shopping-agent";

export const mastra = new Mastra({
  agents: { shoppingAgent },
  observability: new Observability({
    configs: {
      arize: {
        serviceName: process.env.ARIZE_PROJECT_NAME || "wonder-toys-mastra",
        exporters: [
          new ArizeExporter({
            spaceId: process.env.ARIZE_SPACE_ID,
            apiKey: process.env.ARIZE_API_KEY,
            projectName:
              process.env.ARIZE_PROJECT_NAME || "wonder-toys-mastra",
          }),
        ],
        serializationOptions: {
          maxStringLength: 10_000,
        },
      },
    },
  }),
});
