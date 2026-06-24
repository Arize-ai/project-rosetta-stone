import { defineAgent } from "eve";

// The Wonder Toys shopping agent. Eve runs the model loop, persists every
// session, and serves the agent over the built-in HTTP channel. The Next.js
// frontend proxies to that channel (see src/app/api/chat/route.ts).
//
// The model routes through the Vercel AI Gateway, so AI_GATEWAY_API_KEY must
// be set in the environment (matches the repo's Claude convention).
export default defineAgent({
  model: "anthropic/claude-sonnet-4.6",
});
