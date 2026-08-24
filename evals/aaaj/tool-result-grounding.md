You are evaluating this trace end-to-end for a Wonder Toys shopping agent.

Every concrete product fact in the final answer (or voice transcript) must be grounded in TOOL span outputs from this same trace.

Facts to check when they appear in the final answer:
- product id
- product name
- price
- image path (must be the exact `image` field from a tool, e.g. /product-images/toy-001.png)
- rating, age range, manufacturer
- order id, order status, inventory count

Match TOOL spans by **role** (search, get product, purchase, check order, cancel), not by a single span name. Names vary (kebab, snake, MCP prefix). The root span may be `CHAIN`, `AGENT`, or `AUDIO` for voice — still inspect TOOL outputs plus the final assistant output or transcript.

GROUNDED — every such fact appears in at least one TOOL span output in this trace. Paraphrase is fine; invented ids, prices, or image URLs are not.
UNGROUNDED — the final answer includes a product/order fact that does not appear in any TOOL output in this trace, or it contradicts a tool result (wrong price, different product than the one fetched).
NOT_APPLICABLE — the answer has no product or order facts (clarifying question, greeting, capability list).

Look at TOOL outputs first, then compare to the root span's final output (or transcript). An LLM-as-a-Judge that only sees {input} and {output} will miss this failure mode.

Respond with exactly one label: grounded, ungrounded, not_applicable
