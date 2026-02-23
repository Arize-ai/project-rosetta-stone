# Arize AX Evaluations — Setup Guide

This guide walks through setting up 6 evaluators in the Arize AX console to assess the Wonder Toys shopping agent.

## Prerequisites

Generate traces first by running the synthetic request harness:

```bash
cd ax/llamaindex-py
set -a && source .env.local && set +a
python -m evals.synthetic_requests
```

This sends 25 requests of varying complexity directly to the agent, producing traces in your AX project.

Then open your project at [app.arize.com](https://app.arize.com).

---

## Eval 1: Correctness (Custom LLM-as-a-Judge)

1. Click **New Eval Task** → **LLM-as-a-Judge**
2. Name: `correctness`
3. Cadence: **Run on historical data**
4. Click **Add Evaluator** → **Create New** → **Create From Blank**
5. Name: `correctness`
6. Select your judge model (e.g. Claude Sonnet via Anthropic, or GPT-4o via OpenAI)
7. Paste this prompt template:

```
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

8. Labels: `correct` (score 1), `incorrect` (score 0)
9. Enable explanations
10. Configure the task: scope to **Trace**, map `input` → `attributes.input.value`, `output` → `attributes.output.value`, `tools_used` → `attributes.tool.name`

---

## Eval 2: Tool Selection (LLM-as-a-Judge)

1. Click **New Eval Task** → **LLM-as-a-Judge**
2. Name: `tool_selection`
3. Cadence: **Run on historical data**
4. Check if the **Tool Calling** pre-built template fits your needs. If not, **Create From Blank**:

```
You are evaluating whether a shopping assistant selected the appropriate tools for a user's request.

The available tools are:
- search-products — Search the toy store inventory by text query, keywords, age range, or category
- get-product — Get detailed information about a specific product by its ID
- purchase-product — Purchase one or more products with a shipping address
- check-order-status — Check order status by order ID or product search
- cancel-order — Cancel an order that hasn't been delivered yet

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

5. Labels: `correct` (score 1), `incorrect` (score 0)
6. Enable explanations
7. Scope: **Trace**, map `input` → `attributes.input.value`, `output` → `attributes.output.value`

---

## Eval 3: Tool Response Handling (LLM-as-a-Judge)

1. Click **New Eval Task** → **LLM-as-a-Judge**
2. Name: `tool_response_handling`
3. Cadence: **Run on historical data**
4. **Create From Blank**:

```
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

5. Labels: `correct` (score 1), `incorrect` (score 0), `not_applicable` (score 0.5)
6. Enable explanations
7. Scope: **Trace**, map `input` → `attributes.input.value`, `output` → `attributes.output.value`

---

## Eval 4: Format Compliance (Custom LLM-as-a-Judge)

1. Click **New Eval Task** → **LLM-as-a-Judge**
2. Name: `format_compliance`
3. Cadence: **Run on historical data**
4. **Create From Blank**:

```
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

5. Labels: `compliant` (score 1), `non_compliant` (score 0), `not_applicable` (score 0.5)
6. Enable explanations
7. Scope: **Trace**, map `input` → `attributes.input.value`, `output` → `attributes.output.value`

---

## Eval 5: Image URL Correctness (Code Evaluator)

Requires AX Enterprise. Custom code evaluators are Python-only (JavaScript coming soon).

1. Click **New Eval Task** → **Code Evaluator**
2. Name: `image_url_correctness`
3. Cadence: **Run on historical data**
4. Scope: **Trace** (root spans)
5. Click **Add Evaluator** → **Create New** → custom code evaluator
6. Set the input attribute to `attributes.output.value`
7. Paste this Python code:

```python
import re
import json
from typing import Any, Mapping, Optional
from arize.experimental.datasets.experiments.evaluators.base import (
    EvaluationResult,
    CodeEvaluator,
    JSONSerializable,
)

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

---

## Eval 6: Tool Call Count (Code Evaluator)

Requires AX Enterprise.

1. Click **New Eval Task** → **Code Evaluator**
2. Name: `tool_call_count`
3. Cadence: **Run on historical data**
4. Scope: **Trace** (root spans)
5. Click **Add Evaluator** → **Create New** → custom code evaluator
6. Set input attributes: `attributes.input.value` and `attributes.output.value`
7. Paste this Python code:

```python
import re
import json
from typing import Any, Mapping, Optional
from arize.experimental.datasets.experiments.evaluators.base import (
    EvaluationResult,
    CodeEvaluator,
    JSONSerializable,
)

class ToolCallCountEvaluator(CodeEvaluator):
    def evaluate(
        self,
        *,
        dataset_row: Optional[Mapping[str, JSONSerializable]] = None,
        **kwargs: Any,
    ) -> EvaluationResult:
        input_val = dataset_row.get("attributes.input.value") if dataset_row else None
        output_val = dataset_row.get("attributes.output.value") if dataset_row else None

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

        # Count tool calls from the span's child data
        # Note: This is approximate — the span metadata available may vary.
        # Adjust based on what attributes AX exposes for your traces.
        tool_call_count = kwargs.get("tool_call_count", 0)

        # Queries that plausibly need no tools
        conversational_patterns = [
            r'no idea', r'ignore.*instructions', r'tell me the system prompt',
            r'what can you do', r'help me', r'hello|hi there',
        ]
        is_conversational = any(
            re.search(p, user_query, re.IGNORECASE)
            for p in conversational_patterns
        )

        if tool_call_count == 0:
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

        if tool_call_count > 5:
            return EvaluationResult(
                label="excessive",
                score=0.5,
                explanation=f"{tool_call_count} tool calls may be excessive"
            )

        return EvaluationResult(
            label="appropriate",
            score=1.0,
            explanation=f"{tool_call_count} tool call(s) is reasonable"
        )
```

**Note**: The tool call count may not be directly available as a span attribute. You may need to adjust this evaluator based on what trace data AX exposes, or use the managed **Matches Regex** evaluator as an approximation.

---

## Comparison with Phoenix

These are the same 6 evaluators used in the [Phoenix programmatic eval harness](../../phoenix/llamaindex-py/evals/). The key difference is workflow:

| | Phoenix | AX |
|---|---------|-----|
| **Setup** | Python code (`run_evals.py`) | AX web console UI |
| **Execution** | CLI command | Click "Run" in UI |
| **LLM judge** | `arize-phoenix-evals` SDK | AX Evaluator Hub |
| **Code evals** | Inline Python functions | Python code evaluators (Enterprise) |
| **Results** | Logged as span annotations via API | Visible in AX eval dashboard |
