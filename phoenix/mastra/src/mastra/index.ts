import { Mastra } from "@mastra/core";
import { Observability } from "@mastra/observability";
import { ArizeExporter } from "@mastra/arize";
import { shoppingAgent } from "./agents/shopping-agent";

// ArizeExporter falls back to reading env vars itself and decides
// AX-vs-Phoenix purely from whether a spaceId is present, so a stray
// ARIZE_SPACE_ID in the environment would silently flip this tier into AX
// mode. Clear the ARIZE_* vars for this process so the Phoenix tier always
// exports to Phoenix.
delete process.env.ARIZE_SPACE_ID;
delete process.env.ARIZE_API_KEY;
delete process.env.ARIZE_PROJECT_NAME;

export const mastra = new Mastra({
  agents: { shoppingAgent },
  observability: new Observability({
    configs: {
      arize: {
        serviceName: process.env.PHOENIX_PROJECT_NAME || "wonder-toys-mastra",
        exporters: [
          new ArizeExporter({
            endpoint: process.env.PHOENIX_COLLECTOR_ENDPOINT!,
            apiKey: process.env.PHOENIX_API_KEY,
            projectName:
              process.env.PHOENIX_PROJECT_NAME || "wonder-toys-mastra",
          }),
        ],
        serializationOptions: {
          maxStringLength: 10_000,
        },
      },
    },
  }),
});
