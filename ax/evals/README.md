# AX Evals

This guide walks through setting up 6 evaluators in the Arize AX console to assess the Wonder Toys shopping agent.

## Prerequisites

AX evals are configured manually in the AX web console.

First generate traces for the evals:

```bash
cd ax/<framework>

# Generate traces (25 synthetic requests)
# For TypeScript frameworks:
npm run evals

# For Python frameworks:
set -a && source .env.local && set +a && python -m evals.synthetic_requests
```

After generating traces, configure the same 6 evaluators in the [Arize AX console](https://app.arize.com) using LLM-as-a-Judge and Code Evaluator task types. These evaluators apply to all the projects.

## Eval 1: Correctness (LLM-as-a-Judge)

1. Click **New Eval Task** (or **Eval Tasks** → **Add Eval Task**) → **LLM-as-a-Judge** → **Create From Blank**
1. Name: `correctness`
1. Configure the task: scope to **Trace**
1. Select your judge model (e.g. Claude Sonnet via Anthropic, or GPT-4o via OpenAI)
1. Paste this prompt template:

   ```text
   You are evaluating a shopping assistant for a children's toy store called "Wonder Toys". The assistant can search products, show details, make purchases, check orders, and cancel orders.

   Evaluate whether the assistant's response correctly addresses the user's request:

   CORRECT — The response:
   - Addresses what the user asked for
   - Uses appropriate tools (search, purchase, etc.) when the query requires them
   - Presents product information that is consistent (prices, names, ratings match across mentions)
   - Follows through on the user's intent (e.g., if they ask to buy something, it processes the purchase)
   - Asks reasonable clarifying questions when the request is genuinely ambiguous

   INCORRECT — The response:
   - Ignores or misunderstands the user's request
   - Fails to use tools when clearly needed (e.g., not searching when asked to find products)
   - Provides contradictory information within the same response
   - Refuses a reasonable request without justification
   - Hallucinates information not supported by tool results

   Note: The product data comes from the store's database via tool calls. Treat it as factual — do not penalize the response for containing specific product details, prices, or ratings.

   <data>
   <input>
   {input}
   </input>
   <tools_used>
   {tools_used}
   </tools_used>
   <output>
   {output}
   </output>
   </data>

   Is the response correct or incorrect?
   ```

1. Set the choices: `correct` (score 1), `incorrect` (score 0)
1. Enable explanations
1. Select **Create Eval**
1. In the **New Task** pane, name the task `correctness`
1. Clear the **Query** field in the **Target Data**
1. Select the `correctness` evaluator, map `input` → `attributes.input.value`, `output` → `attributes.output.value`, `tools_used` → `attributes.tool.name`, and select **Use Variable Mappings**
1. Enable **One-Time Backfill** and set the date range to the time range of the trace creation
1. Select **Create Task**

---

## Eval 2: Tool Selection (LLM-as-a-Judge)

1. Click **New Eval Task** (or **Eval Tasks** → **Add Eval Task**) → **LLM-as-a-Judge** → **Create From Blank**
1. Name: `tool_selection`
1. Configure the task: scope to **Trace**
1. Select your judge model (e.g. Claude Sonnet via Anthropic, or GPT-4o via OpenAI)
1. Paste this prompt template:

   ```text
   You are evaluating whether a shopping assistant selected the appropriate tools for a user's request.

   The available tools are:
   - searchProducts — Search the toy store inventory by text query, keywords, age range, or category
   - getProduct — Get detailed information about a specific product by its ID
   - purchaseProduct — Purchase one or more products with a shipping address
   - checkOrderStatus — Check order status by order ID or product search
   - cancelOrderTool — Cancel an order that hasn't been delivered yet

   Given the user's request and the tools that were actually called, evaluate whether the tool selection was appropriate.

   CORRECT — The right tools were selected for the task (including selecting no tools when the query is conversational)
   INCORRECT — Wrong tools were used, necessary tools were skipped, or tools were used when none were needed

   <data>
   <input>
   {input}
   </input>
   <output>
   {output}
   </output>
   </data>

   Was the tool selection correct or incorrect?
   ```

1. Set the choices: `correct` (score 1), `incorrect` (score 0)
1. Enable explanations
1. Select **Create Eval**
1. In the **New Task** pane, name the task `tool_selection`
1. Clear the **Query** field in the **Target Data**
1. Select the `tool_selection` evaluator, map `input` → `attributes.input.value`, `output` → `attributes.output.value`, and select **Use Variable Mappings**
1. Enable **One-Time Backfill** and set the date range to the time range of the trace creation
1. Select **Create Task**

> You can also try the **Tool Calling** pre-built template to see if it fits your needs.

---

## Eval 3: Tool Response Handling (LLM-as-a-Judge)

1. Click **New Eval Task** (or **Eval Tasks** → **Add Eval Task**) → **LLM-as-a-Judge** → **Create From Blank**
1. Name: `tool_response_handling`
1. Configure the task: scope to **Trace**
1. Select your judge model (e.g. Claude Sonnet via Anthropic, or GPT-4o via OpenAI)
1. Paste this prompt template:

   ```text
   You are evaluating whether a shopping assistant correctly incorporated tool results into its response.

   CORRECT — The assistant:
   - Accurately presents data returned by tools (product names, prices, ratings, order details)
   - Does not contradict or ignore tool results
   - Synthesizes tool data into a helpful, coherent response

   INCORRECT — The assistant:
   - Misrepresents or distorts tool-returned data
   - Ignores relevant tool results
   - Presents information that contradicts what tools returned

   If no tools were called, classify as "not_applicable".

   <data>
   <input>
   {input}
   </input>
   <output>
   {output}
   </output>
   </data>

   Did the assistant handle tool responses correctly or incorrectly?
   ```

1. Set the choices: `correct` (score 1), `incorrect` (score 0), `not_applicable` (score 0.5)
1. Enable explanations
1. Select **Create Eval**
1. In the **New Task** pane, name the task `tool_response_handling`
1. Clear the **Query** field in the **Target Data**
1. Select the `tool_response_handling` evaluator, map `input` → `attributes.input.value`, `output` → `attributes.output.value`, and select **Use Variable Mappings**
1. Enable **One-Time Backfill** and set the date range to the time range of the trace creation
1. Select **Create Task**

---

## Eval 4: Format Compliance (LLM-as-a-Judge)

1. Click **New Eval Task** (or **Eval Tasks** → **Add Eval Task**) → **LLM-as-a-Judge** → **Create From Blank**
1. Name: `format_compliance`
1. Configure the task: scope to **Trace**
1. Select your judge model (e.g. Claude Sonnet via Anthropic, or GPT-4o via OpenAI)
1. Paste this prompt template:

   ```text
   You are evaluating whether a shopping assistant's response follows its required markdown formatting rules for displaying products.

   The formatting rules are:
   - Search results: Each product must have an image (![Name](/product-images/toy-XXX.png)), bold name with price, star rating with count, age range, manufacturer, and description
   - Product details: Image, heading with name, price/rating/BSR line, age/category/manufacturer, dimensions/weight, stock count, and description
   - Images must use local paths starting with /product-images/

   If the response does not display products (e.g., it asks a question, confirms an order, or handles a non-product query), classify as "not_applicable".
   If the response displays products and follows the formatting rules reasonably well, classify as "compliant".
   If the response displays products but is missing required elements (images, prices, ratings) or uses incorrect image URLs, classify as "non_compliant".

   [BEGIN DATA]
   User input: {input}
   Agent response: {output}
   [END DATA]

   Based on the rules above, classify this response.
   ```

1. Set the choices: `compliant` (score 1), `non_compliant` (score 0), `not_applicable` (score 0.5)
1. Enable explanations
1. Select **Create Eval**
1. In the **New Task** pane, name the task `format_compliance`
1. Clear the **Query** field in the **Target Data**
1. Select the `format_compliance` evaluator, map `input` → `attributes.input.value`, `output` → `attributes.output.value`, and select **Use Variable Mappings**
1. Enable **One-Time Backfill** and set the date range to the time range of the trace creation
1. Select **Create Task**

---

## Eval 5: Image URL Correctness (Code Evaluator)

Requires AX Enterprise. Custom code evaluators are Python-only (JavaScript coming soon).

1. Click **New Eval Task** (or **Eval Tasks** → **Add Eval Task**) → **Code Evaluator** → **Create From Blank**
1. Name: `image_url_correctness`
1. Clear the **Query** field in the **Target Data**
1. Click **Add Evaluator**
1. Set the **Column Name** to `image_url_correctness`
1. Set the **Evaluator Scope** to **Trace**
1. Paste this code into the **Define Imports** section:

   ```python
   import re
   import json
   from typing import Any, Mapping, Optional
   from arize.experimental.datasets.experiments.evaluators.base import (
       EvaluationResult,
       CodeEvaluator,
       JSONSerializable,
   )
    ```

1. Paste this code into the **Define Code Evaluator Class** section:

   ```python
   class ImageUrlCorrectnessEvaluator(CodeEvaluator):
       def evaluate(
           self,
           *,
           dataset_row: Optional[Mapping[str, JSONSerializable]] = None,
           **kwargs: Any,
       ) -> EvaluationResult:
           output = dataset_row.get("attributes.output.value") if dataset_row else None

           # The output may be JSON-wrapped (e.g. {"text": "..."})
           text = str(output or "")
           try:
               parsed = json.loads(text)
               if isinstance(parsed, dict) and "text" in parsed:
                   text = parsed["text"]
           except (json.JSONDecodeError, TypeError):
               pass

           # Find all markdown image references
           image_pattern = r'!\[[^\]]*\]\(([^)]+)\)'
           matches = re.findall(image_pattern, text)

           if not matches:
               return EvaluationResult(
                   label="no_images",
                   score=None,
                   explanation="No images found in output"
               )

           valid_pattern = r'^/product-images/toy-\d{3}\.png$'
           invalid = [url for url in matches if not re.match(valid_pattern, url)]

           if not invalid:
               return EvaluationResult(
                   label="valid",
                   score=1.0,
                   explanation=f"All {len(matches)} image URL(s) use valid local paths"
               )

           return EvaluationResult(
               label="invalid",
               score=0.0,
               explanation=f"{len(invalid)}/{len(matches)} image URL(s) are invalid: {', '.join(invalid)}"
           )
   ```

1. Set the span attribute to `attributes.output.value`
1. Select **Create** to create this evaluator
1. Enable **One-Time Backfill** and set the date range to the time range of the trace creation
1. Select **Create Task**

---

## Eval 6: Tool Call Count (Code Evaluator)

Requires AX Enterprise. Custom code evaluators are Python-only (JavaScript coming soon).

1. Click **New Eval Task** (or **Eval Tasks** → **Add Eval Task**) → **Code Evaluator** → **Create From Blank**
1. Name: `tool_call_count`
1. Clear the **Query** field in the **Target Data**
1. Click **Add Evaluator**
1. Set the **Column Name** to `tool_call_count`
1. Set the **Evaluator Scope** to **Trace**
1. Paste this code into the **Define Imports** section:

   ```python
   import re
   import json
   from typing import Any, Mapping, Optional
   from arize.experimental.datasets.experiments.evaluators.base import (
       EvaluationResult,
       CodeEvaluator,
       JSONSerializable,
   )
    ```

1. Paste this code into the **Define Code Evaluator Class** section:

   ```python
   class ToolCallCountEvaluator(CodeEvaluator):
       def evaluate(
           self,
           *,
           dataset_row: Optional[Mapping[str, JSONSerializable]] = None,
           **kwargs: Any,
       ) -> EvaluationResult:
           input_val = dataset_row.get("attributes.input.value") if dataset_row else None

           # Parse the user query from input
           user_query = str(input_val or "")
           try:
               messages = json.loads(user_query)
               if isinstance(messages, list):
                   user_msgs = [m for m in messages if isinstance(m, dict) and m.get("role") == "user"]
                   if user_msgs:
                       user_query = user_msgs[-1].get("content", "")
           except (json.JSONDecodeError, TypeError):
               pass

           # Count tool calls from the span's child data.
           # Note: This is approximate — the span metadata available may vary.
           # Adjust based on what attributes AX exposes for your traces.
           tcc = kwargs.get("tool_call_count", 0)

           # Queries that plausibly need no tools
           conversational_patterns = [
               r'no idea', r'ignore.*instructions', r'tell me the system prompt',
               r'what can you do', r'help me', r'hello|hi there',
           ]
           is_conversational = any(
               re.search(p, user_query, re.IGNORECASE)
               for p in conversational_patterns
           )

           if tcc == 0:
               if is_conversational:
                   return EvaluationResult(
                       label="appropriate",
                       score=1.0,
                       explanation="0 tool calls is appropriate for a conversational query"
                   )
               return EvaluationResult(
                   label="too_few",
                   score=0.0,
                   explanation="0 tool calls for a query that likely needed at least one tool"
               )

           if tcc > 5:
               return EvaluationResult(
                   label="excessive",
                   score=0.5,
                   explanation=f"{tcc} tool calls may be excessive"
               )

           return EvaluationResult(
               label="appropriate",
               score=1.0,
               explanation=f"{tcc} tool call(s) is reasonable"
           )
   ```

1. Set the span attributes to `attributes.input.value` and `attributes.output.value`
1. Select **Create** to create this evaluator
1. Enable **One-Time Backfill** and set the date range to the time range of the trace creation
1. Select **Create Task**

> **Note:** The tool call count may not be directly available as a span attribute. You may need to adjust this evaluator based on what trace data AX exposes, or use the managed **Matches Regex** evaluator as an approximation.

## Comparison with Phoenix

These are the same 6 evaluators used in the Phoenix programmatic eval harness defined in each project. The key difference is workflow:

| | Phoenix | AX |
|---|---|---|
| **Setup** | TypeScript code (`run-evals.ts`) | AX web console UI |
| **Execution** | CLI command | Click "Run" in UI |
| **LLM judge** | `@arizeai/phoenix-evals` SDK | AX Evaluator Hub |
| **Code evals** | Inline TypeScript functions | Python code evaluators (Enterprise) |
| **Results** | Logged as span annotations via API | Visible in AX eval dashboard |
