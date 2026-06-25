/**
 * Run evaluations against Phoenix traces from the synthetic request harness.
 *
 * Fetches agent spans from Phoenix Cloud, runs 6 evaluators (4 LLM-judge,
 * 2 code-based), and logs results back as span annotations.
 *
 * Usage:
 *   npm run evals    (from any phoenix/<framework> directory)
 *
 * Requires PHOENIX_COLLECTOR_ENDPOINT, PHOENIX_API_KEY, PHOENIX_PROJECT_NAME,
 * and ANTHROPIC_API_KEY in the environment.
 */

import { anthropic } from "@ai-sdk/anthropic";
import {
  createToolSelectionEvaluator,
  createToolResponseHandlingEvaluator,
  createClassificationEvaluator,
} from "@arizeai/phoenix-evals";
import { createClient } from "@arizeai/phoenix-client";
import { getSpans } from "@arizeai/phoenix-client/spans";
import { logSpanAnnotations } from "@arizeai/phoenix-client/spans";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const projectName = process.env.PHOENIX_PROJECT_NAME;
if (!projectName) throw new Error("PHOENIX_PROJECT_NAME is not set");

const judgeModel = anthropic("claude-sonnet-4-6");

// Derive the Phoenix API base URL from the OTLP endpoint.
// PHOENIX_COLLECTOR_ENDPOINT is like "https://app.phoenix.arize.com/s/<space>/v1/traces"
// The client needs "https://app.phoenix.arize.com/s/<space>" (strip /v1/traces)
function getPhoenixBaseUrl(): string {
  const endpoint = process.env.PHOENIX_COLLECTOR_ENDPOINT;
  if (!endpoint) throw new Error("PHOENIX_COLLECTOR_ENDPOINT is not set");
  return endpoint.replace(/\/v1\/traces\/?$/, "");
}

// Available tools the agent can use — listed in kebab-case (canonical form).
// Tool names are normalised to kebab-case in extractToolData so the LLM judge
// can always match them exactly, regardless of framework naming conventions
// (camelCase for Mastra/Vercel, snake_case for LangChain.js, kebab-case for
// LangChain Py / LlamaIndex).
const AVAILABLE_TOOLS = [
  "search-products — Search the toy store inventory by text query, keywords, age range, or category",
  "get-product — Get detailed information about a specific product by its ID",
  "purchase-product — Purchase one or more products with a shipping address",
  "check-order-status — Check order status by order ID or product search",
  "cancel-order — Cancel an order that hasn't been delivered yet",
].join("\n");

// ---------------------------------------------------------------------------
// LLM Evaluators
// ---------------------------------------------------------------------------

// Custom correctness eval — the built-in one flags tool-returned product data
// as "fabricated" since it has no ground truth. This template is scoped to
// evaluate whether the agent addressed the user's request appropriately.
const correctnessEval = createClassificationEvaluator({
  model: judgeModel as any,
  name: "correctness",
  promptTemplate: [
    {
      role: "user" as const,
      content: `You are evaluating a shopping assistant for a children's toy store called "Wonder Toys". The assistant can search products, show details, make purchases, check orders, and cancel orders.

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
{{input}}
</input>
<tools_used>
{{tools_used}}
</tools_used>
<output>
{{output}}
</output>
</data>

Is the response correct or incorrect?`,
    },
  ],
  choices: { correct: 1, incorrect: 0 },
});

const toolSelectionEval = createToolSelectionEvaluator({
  model: judgeModel as any,
});

const toolResponseEval = createToolResponseHandlingEvaluator({
  model: judgeModel as any,
});

const formatComplianceEval = createClassificationEvaluator({
  model: judgeModel as any,
  name: "format_compliance",
  promptTemplate: [
    {
      role: "user" as const,
      content: `You are evaluating whether a shopping assistant's response follows its required markdown formatting rules for displaying products.

The formatting rules are:
- Search results: Each product must have an image (![Name](/product-images/toy-XXX.png)), bold name with price, star rating with count, age range, manufacturer, and description
- Product details: Image, heading with name, price/rating/BSR line, age/category/manufacturer, dimensions/weight, stock count, and description
- Images must use local paths starting with /product-images/

If the response does not display products (e.g., it asks a question, confirms an order, or handles a non-product query), classify as "not_applicable".
If the response displays products and follows the formatting rules reasonably well, classify as "compliant".
If the response displays products but is missing required elements (images, prices, ratings) or uses incorrect image URLs, classify as "non_compliant".

[BEGIN DATA]
User input: {{input}}
Agent response: {{output}}
[END DATA]

Based on the rules above, classify this response.`,
    },
  ],
  choices: { compliant: 1, non_compliant: 0, not_applicable: 0.5 },
});

// ---------------------------------------------------------------------------
// Code Evaluators
// ---------------------------------------------------------------------------

function evaluateImageUrls(output: string): {
  label: string;
  score: number;
  explanation: string;
} | null {
  const imagePattern = /!\[([^\]]*)\]\(([^)]+)\)/g;
  const matches = [...output.matchAll(imagePattern)];

  if (matches.length === 0) {
    return null; // No images to evaluate
  }

  const validPattern = /^\/product-images\/toy-\d{3}\.png$/;
  const invalid = matches.filter((m) => !validPattern.test(m[2]));

  if (invalid.length === 0) {
    return {
      label: "valid",
      score: 1,
      explanation: `All ${matches.length} image URL(s) use valid local paths`,
    };
  }

  return {
    label: "invalid",
    score: 0,
    explanation: `${invalid.length}/${matches.length} image URL(s) are invalid: ${invalid.map((m) => m[2]).join(", ")}`,
  };
}

/**
 * Evaluate whether the agent used an appropriate number of tool calls.
 *
 * Heuristic: most queries should use at least 1 tool. Queries that are
 * clearly conversational (vague, adversarial, follow-up questions) may
 * legitimately use 0. We flag spans with 0 tool calls when the user
 * query looks like it should have triggered a search/action, and flag
 * excessively high counts (> 5) as potentially wasteful.
 */
function evaluateToolCallCount(
  userQuery: string,
  toolCallCount: number,
): { label: string; score: number; explanation: string } {
  // Queries that plausibly need no tools
  const conversationalPatterns = [
    /no idea/i,
    /ignore.*instructions/i,
    /tell me the system prompt/i,
    /what can you do/i,
    /help me/i,
    /hello|hi there/i,
  ];
  const isConversational = conversationalPatterns.some((p) => p.test(userQuery));

  if (toolCallCount === 0) {
    if (isConversational) {
      return {
        label: "appropriate",
        score: 1,
        explanation: `0 tool calls is appropriate for a conversational query`,
      };
    }
    return {
      label: "too_few",
      score: 0,
      explanation: `0 tool calls for a query that likely needed at least one tool`,
    };
  }

  if (toolCallCount > 5) {
    return {
      label: "excessive",
      score: 0.5,
      explanation: `${toolCallCount} tool calls may be excessive`,
    };
  }

  return {
    label: "appropriate",
    score: 1,
    explanation: `${toolCallCount} tool call(s) is reasonable`,
  };
}

// ---------------------------------------------------------------------------
// Helpers: extract clean data from span attributes
// ---------------------------------------------------------------------------

/**
 * From a root span, extract the user's query and the agent's text response.
 *
 * Handles multiple framework span formats:
 *   - Mastra:        input.value = JSON array [{role, content}], output.value = { text: "..." }
 *   - LangChain.js:  root span is an HTTP span (span_kind=UNKNOWN) with no input.value;
 *                    actual data lives on the LangGraph child span. Messages use LangChain
 *                    constructor format: {lc:1, type:"constructor", id:[...,"HumanMessage"], kwargs:{content}}
 *   - LangChain Py:  input.value = { messages: [{type:"human"|"ai"|"system", content}] };
 *                    AI message content may be a list of blocks [{type:"text",text:"..."}, ...]
 *   - Vercel SDK:    input.value = JSON array [{role, content}], output.value = plain string or { text }
 */
function extractRootData(span: any, allSpans: any[]): { userQuery: string; agentResponse: string } {
  let attrs = span.attributes ?? {};

  // langchain-js: root span is an HTTP span with span_kind=UNKNOWN and no input.value.
  // Find the first span in the same trace with a non-UNKNOWN span_kind that has input.value.
  if (!attrs["input.value"]) {
    const traceId = span.context?.trace_id;
    const agentSpan = allSpans.find((s: any) =>
      s.context?.trace_id === traceId &&
      s.span_kind !== "UNKNOWN" &&
      (s.attributes ?? {})["input.value"],
    );
    if (agentSpan) {
      attrs = agentSpan.attributes ?? {};
    }
  }

  // Extract text from a content field that may be a string or array of blocks.
  function extractContent(content: any): string {
    if (typeof content === "string") return content;
    if (Array.isArray(content)) {
      return content
        .filter((b: any) => b.type === "text")
        .map((b: any) => String(b.text || b.content || ""))
        .join(" ");
    }
    return String(content ?? "");
  }

  // Determine role for a message across all framework formats.
  function getRole(m: any): "user" | "assistant" | null {
    if (m.role === "user") return "user";
    if (m.role === "assistant") return "assistant";
    if (m.type === "human") return "user";
    if (m.type === "ai") return "assistant";
    // LangChain JS constructor format: {lc:1, type:"constructor", id:[...,"HumanMessage"]}
    if (m.lc === 1 && m.type === "constructor" && Array.isArray(m.id)) {
      const typeName: string = m.id[m.id.length - 1];
      if (typeName === "HumanMessage") return "user";
      if (typeName === "AIMessage" || typeName === "AIMessageChunk") return "assistant";
    }
    return null;
  }

  // Get content for a message, handling both direct .content and LangChain .kwargs.content.
  function getContent(m: any): string {
    const raw = m.lc === 1 && m.kwargs !== undefined ? m.kwargs?.content : m.content;
    return extractContent(raw);
  }

  // Extract last user message from input
  let userQuery = "";
  try {
    const parsed = JSON.parse(attrs["input.value"] || "[]");
    const messages: any[] = Array.isArray(parsed) ? parsed : (parsed.messages ?? []);
    for (let i = messages.length - 1; i >= 0; i--) {
      if (getRole(messages[i]) === "user") {
        userQuery = getContent(messages[i]);
        break;
      }
    }
  } catch {
    userQuery = String(attrs["input.value"] || "");
  }

  // Extract text from output — multiple formats across frameworks
  let agentResponse = "";
  try {
    const parsed = JSON.parse(attrs["output.value"] || "");
    if (typeof parsed === "string") {
      // Plain string (some Vercel SDK spans)
      agentResponse = parsed;
    } else if (typeof parsed.text === "string") {
      // Mastra format: { text: "...", files: [] }
      agentResponse = parsed.text;
    } else if (Array.isArray(parsed.messages)) {
      // LangChain format: { messages: [...] } — find last AI message with text content
      for (let i = parsed.messages.length - 1; i >= 0; i--) {
        const m = parsed.messages[i];
        if (getRole(m) === "assistant") {
          const content = getContent(m);
          if (content.trim()) {
            agentResponse = content;
            break;
          }
        }
      }
    } else {
      agentResponse = String(parsed.content ?? parsed.response ?? "");
    }
  } catch {
    agentResponse = String(attrs["output.value"] || "");
  }

  return { userQuery, agentResponse };
}

// Canonical name map — normalises all framework naming conventions to kebab-case
// so they can be matched against AVAILABLE_TOOLS which is listed in kebab-case.
const TOOL_NAME_MAP: Record<string, string> = {
  searchProducts: "search-products",
  search_products: "search-products",
  "search-products": "search-products",
  getProduct: "get-product",
  get_product: "get-product",
  "get-product": "get-product",
  purchaseProduct: "purchase-product",
  purchase_product: "purchase-product",
  "purchase-product": "purchase-product",
  checkOrderStatus: "check-order-status",
  check_order_status: "check-order-status",
  "check-order-status": "check-order-status",
  // Vercel registers the tool as cancelOrderTool; all others use cancel-order
  cancelOrderTool: "cancel-order",
  cancelOrder: "cancel-order",
  cancel_order: "cancel-order",
  "cancel-order": "cancel-order",
};

function normalizeToolName(name: string): string {
  if (TOOL_NAME_MAP[name]) return TOOL_NAME_MAP[name];
  // Fallback: camelCase / snake_case → kebab-case
  return name.replace(/([a-z])([A-Z])/g, "$1-$2").replace(/_/g, "-").toLowerCase();
}

/**
 * Extract the human-readable tool result from framework-specific output formats.
 *
 * Frameworks wrap tool results differently:
 *   - Mastra / Vercel:  output.value is the raw JSON result object
 *   - LangChain.js:     output.value = { output: { lc:1, ..., kwargs: { content: "..." } } }
 *   - LangChain Py:     output.value = { content: "..." }
 */
function extractToolResultText(outputValue: string): string {
  if (!outputValue) return "";
  try {
    const parsed = JSON.parse(outputValue);
    // LangChain.py: { content: "json-string" }
    if (typeof parsed.content === "string") return parsed.content;
    // LangChain.js ToolMessage constructor: { output: { lc:1, ..., kwargs: { content: "..." } } }
    if (parsed.output?.kwargs?.content !== undefined) {
      return String(parsed.output.kwargs.content);
    }
    // Mastra / Vercel: direct result object — return compact JSON
    return JSON.stringify(parsed);
  } catch {
    return outputValue;
  }
}

/**
 * From all spans in a trace, gather tool call information.
 *
 * Identifies tool spans using multiple strategies to cover all frameworks:
 *   1. OpenInference standard attribute: openinference.span.kind === "TOOL"
 *      (LangChain.js via @arizeai/openinference-instrumentation-langchain,
 *       Vercel AI SDK via @arizeai/openinference-vercel)
 *   2. Phoenix top-level field:         span.span_kind === "TOOL"
 *   3. Mastra-specific:                 mastra.span.type === "tool_call"
 *   4. Known tool name fallback:        span.name in TOOL_NAMES
 *
 * Tool names are normalised to kebab-case to match AVAILABLE_TOOLS.
 */
function extractToolData(
  traceId: string,
  allSpans: any[],
): {
  toolCallCount: number;
  toolSelection: string;
  toolCallSummary: string;
  toolResultSummary: string;
} {
  const traceSpans = allSpans.filter(
    (s: any) => s.context?.trace_id === traceId,
  );

  // Known tool names across all frameworks (camelCase, kebab-case, and snake_case variants)
  const TOOL_NAMES = new Set(Object.keys(TOOL_NAME_MAP));

  const toolSpans = traceSpans.filter((s: any) => {
    const attrs = s.attributes ?? {};
    return (
      attrs["openinference.span.kind"] === "TOOL" ||  // OpenInference attribute
      s.span_kind === "TOOL" ||                        // Phoenix top-level field
      attrs["mastra.span.type"] === "tool_call" ||     // Mastra-specific
      TOOL_NAMES.has(s.name)                           // name-based fallback
    );
  });

  if (toolSpans.length === 0) {
    return {
      toolCallCount: 0,
      toolSelection: "(no tools called)",
      toolCallSummary: "",
      toolResultSummary: "",
    };
  }

  const selections: string[] = [];
  const calls: string[] = [];
  const results: string[] = [];

  for (const ts of toolSpans) {
    const attrs = ts.attributes ?? {};
    const rawName = attrs["tool.name"] || ts.name;
    const name = normalizeToolName(rawName);
    const input = attrs["input.value"] || "";
    const output = attrs["output.value"] || "";

    // Extract the readable result content and give the LLM judge enough text
    // to verify the agent accurately incorporated the tool results (2000 chars).
    const resultText = extractToolResultText(String(output));

    selections.push(name);
    calls.push(`${name}(${input})`);
    results.push(`${name} → ${resultText.slice(0, 4500)}`);
  }

  return {
    toolCallCount: toolSpans.length,
    toolSelection: selections.join(", "),
    toolCallSummary: calls.join("\n"),
    toolResultSummary: results.join("\n"),
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("Wonder Toys — Eval Runner");
  console.log(`Project: ${projectName}`);
  console.log();

  const baseUrl = getPhoenixBaseUrl();
  console.log(`Phoenix base URL: ${baseUrl}`);

  const client = createClient({
    options: {
      baseUrl,
      headers: {
        Authorization: `Bearer ${process.env.PHOENIX_API_KEY}`,
      },
    },
  });

  // Fetch spans
  console.log("Fetching spans...");
  const { spans } = await getSpans({
    client,
    project: { projectName },
    limit: 500,
  });

  // Filter to root spans (agent runs — no parent)
  const rootSpans = spans.filter((s: any) => !s.parent_id);
  console.log(
    `Found ${spans.length} total spans, ${rootSpans.length} root spans`,
  );

  if (rootSpans.length === 0) {
    console.log("No root spans found. Run synthetic-requests.ts first.");
    return;
  }

  const allAnnotations: any[] = [];

  for (let i = 0; i < rootSpans.length; i++) {
    const span = rootSpans[i] as any;
    const spanId = span.context?.span_id;
    const traceId = span.context?.trace_id;
    if (!spanId || !traceId) continue;

    const { userQuery, agentResponse } = extractRootData(span, spans as any[]);
    const { toolCallCount, toolSelection, toolCallSummary, toolResultSummary } =
      extractToolData(traceId, spans as any[]);

    const label = `[${String(i + 1).padStart(2, "0")}/${rootSpans.length}]`;
    console.log(`\n${label} "${userQuery.slice(0, 80)}"`);

    // -- LLM Evals ----------------------------------------------------------

    // 1. Correctness
    try {
      const result = await correctnessEval.evaluate({
        input: userQuery,
        output: agentResponse,
        tools_used: toolCallCount > 0 ? toolSelection : "(none)",
      });
      console.log(`  Correctness: ${result.label} (${result.score})`);
      allAnnotations.push({
        spanId,
        name: "correctness",
        label: result.label,
        score: result.score,
        explanation: result.explanation,
        annotatorKind: "LLM" as const,
      });
    } catch (err: any) {
      console.error(`  Correctness ERROR: ${err.message}`);
    }

    // 2. Tool Selection (always run — the evaluator should judge whether
    //    the right tools were picked, including "none" being correct)
    try {
      const result = await toolSelectionEval.evaluate({
        input: userQuery,
        availableTools: AVAILABLE_TOOLS,
        toolSelection: toolSelection,
      });
      console.log(`  Tool Selection: ${result.label} (${result.score})`);
      allAnnotations.push({
        spanId,
        name: "tool_selection",
        label: result.label,
        score: result.score,
        explanation: result.explanation,
        annotatorKind: "LLM" as const,
      });
    } catch (err: any) {
      console.error(`  Tool Selection ERROR: ${err.message}`);
    }

    // 3. Tool Response Handling (only if tools were actually called)
    if (toolCallCount > 0) {
      try {
        const result = await toolResponseEval.evaluate({
          input: userQuery,
          toolCall: toolCallSummary,
          toolResult: toolResultSummary,
          output: agentResponse,
        });
        console.log(`  Tool Response: ${result.label} (${result.score})`);
        allAnnotations.push({
          spanId,
          name: "tool_response_handling",
          label: result.label,
          score: result.score,
          explanation: result.explanation,
          annotatorKind: "LLM" as const,
        });
      } catch (err: any) {
        console.error(`  Tool Response ERROR: ${err.message}`);
      }
    }

    // 4. Format Compliance
    try {
      const result = await formatComplianceEval.evaluate({
        input: userQuery,
        output: agentResponse,
      });
      console.log(`  Format Compliance: ${result.label} (${result.score})`);
      allAnnotations.push({
        spanId,
        name: "format_compliance",
        label: result.label,
        score: result.score,
        explanation: result.explanation,
        annotatorKind: "LLM" as const,
      });
    } catch (err: any) {
      console.error(`  Format Compliance ERROR: ${err.message}`);
    }

    // -- Code Evals ---------------------------------------------------------

    // 5. Image URL Correctness
    const imageResult = evaluateImageUrls(agentResponse);
    if (imageResult) {
      console.log(
        `  Image URLs: ${imageResult.label} (${imageResult.score})`,
      );
      allAnnotations.push({
        spanId,
        name: "image_url_correctness",
        label: imageResult.label,
        score: imageResult.score,
        explanation: imageResult.explanation,
        annotatorKind: "CODE" as const,
      });
    }

    // 6. Tool Call Count
    const toolCountResult = evaluateToolCallCount(userQuery, toolCallCount);
    console.log(
      `  Tool Call Count: ${toolCountResult.label} (${toolCountResult.score}) [${toolCallCount} calls]`,
    );
    allAnnotations.push({
      spanId,
      name: "tool_call_count",
      label: toolCountResult.label,
      score: toolCountResult.score,
      explanation: toolCountResult.explanation,
      annotatorKind: "CODE" as const,
    });
  }

  // Log all annotations to Phoenix
  console.log(
    `\nLogging ${allAnnotations.length} annotations to Phoenix...`,
  );
  await logSpanAnnotations({
    client,
    spanAnnotations: allAnnotations,
    sync: true,
  });

  console.log("Done! Annotations are now visible in Phoenix Cloud.");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
