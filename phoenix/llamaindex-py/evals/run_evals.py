"""
Run evaluations against Phoenix traces from the synthetic request harness.

Fetches agent spans from Phoenix Cloud, runs 6 evaluators (4 LLM-judge,
2 code-based), and logs results back as span annotations.

Usage:
  cd phoenix/llamaindex-py
  set -a && source .env.local && set +a
  python -m evals.run_evals

Requires PHOENIX_COLLECTOR_ENDPOINT, PHOENIX_API_KEY, PHOENIX_PROJECT_NAME,
and ANTHROPIC_API_KEY in the environment.
"""

import json
import os
import re

from phoenix.client import Client
from phoenix.evals import LLM, ClassificationEvaluator

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

PROJECT_NAME = os.environ.get("PHOENIX_PROJECT_NAME", "wonder-toys-llamaindex-py")
JUDGE_MODEL = LLM(provider="anthropic", model="claude-sonnet-4-20250514")

# Available tools the agent can use
AVAILABLE_TOOLS = "\n".join([
    "search-products — Search the toy store inventory by text query, keywords, age range, or category",
    "get-product — Get detailed information about a specific product by its ID",
    "purchase-product — Purchase one or more products with a shipping address",
    "check-order-status — Check order status by order ID or product search",
    "cancel-order — Cancel an order that hasn't been delivered yet",
])


def get_phoenix_base_url() -> str:
    """Derive the Phoenix API base URL from the OTLP endpoint.

    PHOENIX_COLLECTOR_ENDPOINT is like
    "https://app.phoenix.arize.com/s/<space>/v1/traces"
    The client needs "https://app.phoenix.arize.com/s/<space>" (strip /v1/traces)
    """
    endpoint = os.environ.get("PHOENIX_COLLECTOR_ENDPOINT", "")
    if not endpoint:
        raise RuntimeError("PHOENIX_COLLECTOR_ENDPOINT is not set")
    return re.sub(r"/v1/traces/?$", "", endpoint)


# ---------------------------------------------------------------------------
# LLM Evaluators
# ---------------------------------------------------------------------------

correctness_eval = ClassificationEvaluator(
    name="correctness",
    llm=JUDGE_MODEL,
    prompt_template="""You are evaluating a shopping assistant for a children's toy store called "Wonder Toys". The assistant can search products, show details, make purchases, check orders, and cancel orders.

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

Is the response correct or incorrect?""",
    choices={"correct": 1.0, "incorrect": 0.0},
    include_explanation=True,
)

tool_selection_eval = ClassificationEvaluator(
    name="tool_selection",
    llm=JUDGE_MODEL,
    prompt_template="""You are evaluating whether a shopping assistant selected the right tools to handle a user query.

Available tools:
{available_tools}

The user asked: {input}

The agent selected these tools: {tool_selection}

APPROPRIATE — The tools chosen are reasonable for addressing the user's query. If no tools were selected, that's appropriate only for purely conversational queries (greetings, vague requests, adversarial prompts).

INAPPROPRIATE — The tools chosen are wrong for the query (e.g., searching when the user wanted to buy, or not searching when the user asked to find products).

Was the tool selection appropriate or inappropriate?""",
    choices={"appropriate": 1.0, "inappropriate": 0.0},
    include_explanation=True,
)

tool_response_eval = ClassificationEvaluator(
    name="tool_response_handling",
    llm=JUDGE_MODEL,
    prompt_template="""You are evaluating how well a shopping assistant used tool results in its response.

The user asked: {input}

Tools called and their results:
{tool_result_summary}

The agent's response: {output}

GOOD — The agent accurately incorporated tool results into its response, presenting data correctly without fabricating information beyond what the tools returned.

POOR — The agent misrepresented tool results, ignored important data, or fabricated information not present in the tool results.

How well did the agent handle the tool responses?""",
    choices={"good": 1.0, "poor": 0.0},
    include_explanation=True,
)

format_compliance_eval = ClassificationEvaluator(
    name="format_compliance",
    llm=JUDGE_MODEL,
    prompt_template="""You are evaluating whether a shopping assistant's response follows its required markdown formatting rules for displaying products.

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

Based on the rules above, classify this response.""",
    choices={"compliant": 1.0, "non_compliant": 0.0, "not_applicable": 0.5},
    include_explanation=True,
)

# ---------------------------------------------------------------------------
# Code Evaluators
# ---------------------------------------------------------------------------


def evaluate_image_urls(output: str) -> dict | None:
    """Check that all markdown image URLs use valid local paths."""
    matches = re.findall(r"!\[([^\]]*)\]\(([^)]+)\)", output)
    if not matches:
        return None

    valid_pattern = re.compile(r"^/product-images/toy-\d{3}\.png$")
    invalid = [(alt, url) for alt, url in matches if not valid_pattern.match(url)]

    if not invalid:
        return {
            "label": "valid",
            "score": 1.0,
            "explanation": f"All {len(matches)} image URL(s) use valid local paths",
        }
    return {
        "label": "invalid",
        "score": 0.0,
        "explanation": (
            f"{len(invalid)}/{len(matches)} image URL(s) are invalid: "
            + ", ".join(url for _, url in invalid)
        ),
    }


def evaluate_tool_call_count(user_query: str, tool_call_count: int) -> dict:
    """Check whether the number of tool calls is appropriate."""
    conversational_patterns = [
        re.compile(p, re.IGNORECASE)
        for p in [
            r"no idea",
            r"ignore.*instructions",
            r"tell me the system prompt",
            r"what can you do",
            r"help me",
            r"hello|hi there",
        ]
    ]
    is_conversational = any(p.search(user_query) for p in conversational_patterns)

    if tool_call_count == 0:
        if is_conversational:
            return {
                "label": "appropriate",
                "score": 1.0,
                "explanation": "0 tool calls is appropriate for a conversational query",
            }
        return {
            "label": "too_few",
            "score": 0.0,
            "explanation": "0 tool calls for a query that likely needed at least one tool",
        }

    if tool_call_count > 5:
        return {
            "label": "excessive",
            "score": 0.5,
            "explanation": f"{tool_call_count} tool calls may be excessive",
        }

    return {
        "label": "appropriate",
        "score": 1.0,
        "explanation": f"{tool_call_count} tool call(s) is reasonable",
    }


# ---------------------------------------------------------------------------
# Helpers: extract clean data from span attributes
# ---------------------------------------------------------------------------


def extract_root_data(span) -> tuple[str, str]:
    """Extract user query and agent response from a root span.

    LlamaIndex OpenInference spans store input.value and output.value
    as JSON strings containing the message content.
    """
    attrs = span.get("attributes", {}) if isinstance(span, dict) else {}

    input_val = attrs.get("input.value", "")
    output_val = attrs.get("output.value", "")

    # Also check llm.input_messages (OpenInference attribute — list of dicts with message.role/message.content)
    llm_input_messages = attrs.get("llm.input_messages", None)

    # Extract last user message from input
    user_query = ""

    # Try llm.input_messages first (cleaner format)
    if llm_input_messages and isinstance(llm_input_messages, list):
        user_msgs = [m for m in llm_input_messages if isinstance(m, dict) and m.get("message.role") == "user"]
        if user_msgs:
            user_query = user_msgs[-1].get("message.content", "")

    # Fall back to input.value JSON
    if not user_query:
        try:
            parsed = json.loads(input_val) if isinstance(input_val, str) else input_val
            if isinstance(parsed, dict):
                messages = parsed.get("messages", [])
                # Also try direct content field
                if not messages and "content" in parsed:
                    user_query = str(parsed["content"])
            elif isinstance(parsed, list):
                messages = parsed
            elif isinstance(parsed, str):
                user_query = parsed
                messages = []
            else:
                messages = []

            if not user_query:
                for msg in reversed(messages):
                    if not isinstance(msg, dict):
                        continue
                    msg_type = msg.get("type", "") or msg.get("role", "")
                    if msg_type in ("human", "user"):
                        content = msg.get("content", "")
                        if isinstance(content, list):
                            user_query = " ".join(
                                b.get("text", "") for b in content
                                if isinstance(b, dict) and b.get("type") == "text"
                            )
                        else:
                            user_query = str(content)
                        break
        except (json.JSONDecodeError, TypeError):
            user_query = str(input_val)

    # Extract the final AI response from output
    agent_response = ""
    try:
        parsed = json.loads(output_val) if isinstance(output_val, str) else output_val
        if isinstance(parsed, dict):
            # LlamaIndex output may have various structures
            messages = parsed.get("messages", [])
            for msg in reversed(messages):
                if not isinstance(msg, dict):
                    continue
                msg_type = msg.get("type", "") or msg.get("role", "")
                if msg_type in ("ai", "assistant"):
                    content = msg.get("content", "")
                    if isinstance(content, str) and content:
                        agent_response = content
                        break
            # Fallback to other common keys
            if not agent_response:
                agent_response = parsed.get("text", "") or parsed.get("content", "") or parsed.get("response", "") or ""
        elif isinstance(parsed, str):
            agent_response = parsed
    except (json.JSONDecodeError, TypeError):
        agent_response = str(output_val)

    return user_query, agent_response


def extract_tool_data(trace_id: str, all_spans_df) -> tuple[int, str, str]:
    """Extract tool call information from all spans in a trace.

    Returns (tool_call_count, tool_selection_str, tool_result_summary).
    """
    # Filter to spans in this trace with TOOL span kind
    trace_spans = all_spans_df[all_spans_df["context.trace_id"] == trace_id]

    # OpenInference uses openinference.span.kind = "TOOL" for tool spans
    tool_col = None
    for col in ["attributes.openinference.span.kind", "openinference.span.kind"]:
        if col in trace_spans.columns:
            tool_col = col
            break

    if tool_col is None:
        # Try to identify tool spans by name pattern or span_kind column
        if "span_kind" in trace_spans.columns:
            tool_spans = trace_spans[trace_spans["span_kind"] == "TOOL"]
        else:
            # Fallback: look for spans whose name contains a tool name
            tool_names = {"search-products", "get-product", "purchase-product", "check-order-status", "cancel-order"}
            tool_spans = trace_spans[trace_spans["name"].isin(tool_names)] if "name" in trace_spans.columns else trace_spans.iloc[0:0]
    else:
        tool_spans = trace_spans[trace_spans[tool_col] == "TOOL"]

    if tool_spans.empty:
        return 0, "(no tools called)", ""

    selections = []
    results = []

    for _, ts in tool_spans.iterrows():
        name = ts.get("name", "unknown")

        # Get tool input/output from attributes
        input_val = ""
        output_val = ""
        for prefix in ["attributes.", ""]:
            if not input_val:
                input_val = str(ts.get(f"{prefix}input.value", "") or "")
            if not output_val:
                output_val = str(ts.get(f"{prefix}output.value", "") or "")

        selections.append(name)
        results.append(f"{name} -> {output_val[:500]}")

    return len(tool_spans), ", ".join(selections), "\n".join(results)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------


def main():
    print("Wonder Toys — Eval Runner (LlamaIndex Python)")
    print(f"Project: {PROJECT_NAME}")
    print()

    base_url = get_phoenix_base_url()
    print(f"Phoenix base URL: {base_url}")

    client = Client(
        base_url=base_url,
        api_key=os.environ.get("PHOENIX_API_KEY", ""),
    )

    # Fetch spans
    print("Fetching spans...")
    all_spans_df = client.spans.get_spans_dataframe(
        project_identifier=PROJECT_NAME,
        limit=500,
    )

    if all_spans_df is None or all_spans_df.empty:
        print("No spans found. Run synthetic_requests.py first.")
        return

    print(f"Found {len(all_spans_df)} total spans")

    # Filter to root spans (no parent)
    if "parent_id" in all_spans_df.columns:
        root_spans = all_spans_df[all_spans_df["parent_id"].isna()]
    elif "context.parent_id" in all_spans_df.columns:
        root_spans = all_spans_df[all_spans_df["context.parent_id"].isna()]
    else:
        # If we can't determine parent, treat all spans as potential roots
        root_spans = all_spans_df

    print(f"Found {len(root_spans)} root spans")

    if root_spans.empty:
        print("No root spans found. Run synthetic_requests.py first.")
        return

    all_annotations = []

    for i, (idx, span) in enumerate(root_spans.iterrows()):
        span_id = span.get("context.span_id", "") or str(idx)
        trace_id = span.get("context.trace_id", "")

        # Build a dict-like view for extract_root_data
        span_dict = {"attributes": {}}
        for col in all_spans_df.columns:
            if col.startswith("attributes."):
                key = col[len("attributes."):]
                span_dict["attributes"][key] = span.get(col)
            elif col in ("input.value", "output.value"):
                span_dict["attributes"][col] = span.get(col)

        user_query, agent_response = extract_root_data(span_dict)
        tool_call_count, tool_selection, tool_result_summary = extract_tool_data(
            trace_id, all_spans_df
        )

        label = f"[{str(i + 1).zfill(2)}/{len(root_spans)}]"
        print(f"\n{label} \"{user_query[:80]}\"")

        # -- LLM Evals --------------------------------------------------------

        # 1. Correctness
        try:
            scores = correctness_eval.evaluate({
                "input": user_query,
                "output": agent_response,
                "tools_used": tool_selection if tool_call_count > 0 else "(none)",
            })
            result = scores[0]
            print(f"  Correctness: {result.label} ({result.score})")
            all_annotations.append({
                "span_id": span_id,
                "name": "correctness",
                "label": result.label,
                "score": result.score,
                "explanation": result.explanation,
                "annotator_kind": "LLM",
            })
        except Exception as err:
            print(f"  Correctness ERROR: {err}")

        # 2. Tool Selection
        try:
            scores = tool_selection_eval.evaluate({
                "input": user_query,
                "available_tools": AVAILABLE_TOOLS,
                "tool_selection": tool_selection,
            })
            result = scores[0]
            print(f"  Tool Selection: {result.label} ({result.score})")
            all_annotations.append({
                "span_id": span_id,
                "name": "tool_selection",
                "label": result.label,
                "score": result.score,
                "explanation": result.explanation,
                "annotator_kind": "LLM",
            })
        except Exception as err:
            print(f"  Tool Selection ERROR: {err}")

        # 3. Tool Response Handling (only if tools were called)
        if tool_call_count > 0:
            try:
                scores = tool_response_eval.evaluate({
                    "input": user_query,
                    "tool_result_summary": tool_result_summary,
                    "output": agent_response,
                })
                result = scores[0]
                print(f"  Tool Response: {result.label} ({result.score})")
                all_annotations.append({
                    "span_id": span_id,
                    "name": "tool_response_handling",
                    "label": result.label,
                    "score": result.score,
                    "explanation": result.explanation,
                    "annotator_kind": "LLM",
                })
            except Exception as err:
                print(f"  Tool Response ERROR: {err}")

        # 4. Format Compliance
        try:
            scores = format_compliance_eval.evaluate({"input": user_query, "output": agent_response})
            result = scores[0]
            print(f"  Format Compliance: {result.label} ({result.score})")
            all_annotations.append({
                "span_id": span_id,
                "name": "format_compliance",
                "label": result.label,
                "score": result.score,
                "explanation": result.explanation,
                "annotator_kind": "LLM",
            })
        except Exception as err:
            print(f"  Format Compliance ERROR: {err}")

        # -- Code Evals -------------------------------------------------------

        # 5. Image URL Correctness
        image_result = evaluate_image_urls(agent_response)
        if image_result:
            print(f"  Image URLs: {image_result['label']} ({image_result['score']})")
            all_annotations.append({
                "span_id": span_id,
                "name": "image_url_correctness",
                "label": image_result["label"],
                "score": image_result["score"],
                "explanation": image_result["explanation"],
                "annotator_kind": "CODE",
            })

        # 6. Tool Call Count
        tool_count_result = evaluate_tool_call_count(user_query, tool_call_count)
        print(
            f"  Tool Call Count: {tool_count_result['label']} "
            f"({tool_count_result['score']}) [{tool_call_count} calls]"
        )
        all_annotations.append({
            "span_id": span_id,
            "name": "tool_call_count",
            "label": tool_count_result["label"],
            "score": tool_count_result["score"],
            "explanation": tool_count_result["explanation"],
            "annotator_kind": "CODE",
        })

    # Log all annotations to Phoenix
    print(f"\nLogging {len(all_annotations)} annotations to Phoenix...")
    for ann in all_annotations:
        client.spans.add_span_annotation(
            span_id=ann["span_id"],
            annotation_name=ann["name"],
            annotator_kind=ann["annotator_kind"],
            label=ann["label"],
            score=ann["score"],
            explanation=ann.get("explanation", ""),
        )

    print("Done! Annotations are now visible in Phoenix Cloud.")


if __name__ == "__main__":
    main()
