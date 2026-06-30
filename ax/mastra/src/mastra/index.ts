import { Mastra } from "@mastra/core";
import { Observability } from "@mastra/observability";
import { ArizeExporter } from "@mastra/arize";
import { shoppingAgent } from "./agents/shopping-agent";

// ArizeExporter falls back to reading env vars itself and decides
// AX-vs-Phoenix purely from whether a spaceId is present, so leftover PHOENIX_*
// vars in the environment can silently reroute these traces. Clear them for
// this process so the AX tier always exports to Arize AX.
delete process.env.PHOENIX_ENDPOINT;
delete process.env.PHOENIX_API_KEY;
delete process.env.PHOENIX_PROJECT_NAME;

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
