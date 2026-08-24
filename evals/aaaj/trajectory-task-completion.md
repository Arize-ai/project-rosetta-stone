You are evaluating this trace end-to-end for a Wonder Toys shopping agent.

The agent can search inventory, show a product, purchase (shipping address + user), check an order, and cancel a still-processing or shipping order. Match TOOL spans by **role** (search, get product, purchase, check order, cancel), not by a single span name. Names vary across frameworks: kebab (`search-products`), snake (`search_products`), MCP-prefixed (`mcp__…__search_products`), or similar.

Inspect the full trajectory: the root span (`CHAIN`, `AGENT`, or `AUDIO` for voice), nested LLM spans, every TOOL span (role, arguments, output), and the final assistant output or voice transcript. Do not grade the final message in isolation.

PASS — the tools that ran, in order, are a reasonable way to fulfill the user request, and the final answer is consistent with those tool results.
FAIL — any of:
- The user asked to find/buy/track/cancel something and the agent never called a necessary tool, while still sounding successful
- Tool arguments are clearly wrong for the request (wrong product id, empty search when the user named a product)
- The same tool is called repeatedly with identical arguments without new information (stuck loop)
- A TOOL span returned an error or empty result and the agent did not recover, but the final answer claims success
- The agent purchased or cancelled without the confirmation the system prompt requires

If the request is purely conversational (greeting, "what can you do") and no tools were needed, PASS.

Respond with exactly one label: pass, fail
