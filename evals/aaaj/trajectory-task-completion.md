You are evaluating this trace end-to-end for a Wonder Toys shopping assistant (LangGraph ReAct agent).

The agent may call:
- search-products — inventory search
- get-product — product details by ID
- purchase-product — checkout (needs shipping address + userId)
- check-order-status — lookup by order ID or product text
- cancel-order — cancel processing/shipping orders only

Inspect the full trajectory: root CHAIN/AGENT span, LLM spans, and every TOOL span (name, arguments, output). Do not grade the final assistant message in isolation.

PASS — the tools that ran, in order, are a reasonable way to fulfill the user request, and the final answer is consistent with those tool results.
FAIL — any of:
- The user asked to find/buy/track/cancel something and the agent never called a necessary tool, while still sounding successful
- Tool arguments are clearly wrong for the request (wrong product id, empty search when the user named a product)
- The same tool is called repeatedly with identical arguments without new information (stuck loop)
- A TOOL span returned an error or empty result and the agent did not recover, but the final answer claims success
- The agent purchased or cancelled without the confirmation the system prompt requires

If the request is purely conversational (greeting, "what can you do") and no tools were needed, PASS.

Respond with exactly one label: pass, fail
