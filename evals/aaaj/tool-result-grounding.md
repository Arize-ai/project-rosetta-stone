You are evaluating this trace end-to-end for a Wonder Toys shopping assistant.

Every concrete product fact in the final answer must be grounded in TOOL span outputs from this same trace.

Facts to check when they appear in the final answer:
- product id
- product name
- price
- image path (must be the exact `image` field from a tool, e.g. /product-images/toy-001.png)
- rating, age range, manufacturer
- order id, order status, inventory count

GROUNDED — every such fact appears in at least one TOOL span output (search-products, get-product, purchase-product, check-order-status, or cancel-order). Paraphrase is fine; invented ids, prices, or image URLs are not.
UNGROUNDED — the final answer includes a product/order fact that does not appear in any TOOL output in this trace, or it contradicts a tool result (wrong price, different product than the one fetched).
NOT_APPLICABLE — the answer has no product or order facts (clarifying question, greeting, capability list).

Look at TOOL outputs first, then compare to the root span's final output. An LLM-as-a-Judge that only sees {input} and {output} will miss this failure mode.

Respond with exactly one label: grounded, ungrounded, not_applicable
