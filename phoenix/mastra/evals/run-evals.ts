/**
 * Run evaluations against Phoenix traces from the synthetic request harness.
 *
 * Fetches agent spans from Phoenix Cloud, runs 6 evaluators (4 LLM-judge,
 * 2 code-based), and logs results back as span annotations.
 *
 * Usage:
 *   set -a && source .env.local && set +a && npx tsx --conditions=import evals/run-evals.ts
 *
 * Requires PHOENIX_ENDPOINT, PHOENIX_API_KEY, PHOENIX_PROJECT_NAME,
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

const projectName = process.env.PHOENIX_PROJECT_NAME || "wonder-toys-mastra";
const judgeModel = anthropic("claude-sonnet-4-20250514");

// Derive the Phoenix API base URL from the OTLP endpoint.
// PHOENIX_ENDPOINT is like "https://app.phoenix.arize.com/s/<space>/v1/traces"
// The client needs "https://app.phoenix.arize.com/s/<space>" (strip /v1/traces)
function getPhoenixBaseUrl(): string {
  const endpoint = process.env.PHOENIX_ENDPOINT;
  if (!endpoint) throw new Error("PHOENIX_ENDPOINT is not set");
  return endpoint.replace(/\/v1\/traces\/?$/, "");
}

// Available tools the agent can use
const AVAILABLE_TOOLS = [
  "searchProducts — Search the toy store inventory by text query, keywords, age range, or category",
  "getProduct — Get detailed information about a specific product by its ID",
  "purchaseProduct — Purchase one or more products with a shipping address",
  "checkOrderStatus — Check order status by order ID or product search",
  "cancelOrderTool — Cancel an order that hasn't been delivered yet",
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
 * From a root agent_run span, extract the user's query and the agent's
 * text response.
 *
 * Root span attributes:
 *   input.value  = JSON array of messages [{role, content}, ...]
 *   output.value = JSON object { text: "...", files: [] }
 */
function extractRootData(span: any): { userQuery: string; agentResponse: string } {
  const attrs = span.attributes ?? {};

  // Extract last user message from input
  let userQuery = "";
  try {
    const messages = JSON.parse(attrs["input.value"] || "[]");
    const userMsgs = messages.filter((m: any) => m.role === "user");
    userQuery = userMsgs.length > 0 ? userMsgs[userMsgs.length - 1].content : "";
  } catch {
    userQuery = String(attrs["input.value"] || "");
  }

  // Extract text from output
  let agentResponse = "";
  try {
    const output = JSON.parse(attrs["output.value"] || "{}");
    agentResponse = output.text || "";
  } catch {
    agentResponse = String(attrs["output.value"] || "");
  }

  return { userQuery, agentResponse };
}

/**
 * From all spans in a trace, gather tool call information:
 * - Which tools were called (from tool_call spans)
 * - What arguments were passed
 * - What results were returned
 * - Total count of tool calls
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
  const toolSpans = traceSpans.filter(
    (s: any) => s.attributes?.["mastra.span.type"] === "tool_call",
  );

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
    const name = attrs["tool.name"] || ts.name;
    const input = attrs["input.value"] || "";
    const output = attrs["output.value"] || "";

    selections.push(name);
    calls.push(`${name}(${input})`);
    results.push(`${name} → ${String(output).slice(0, 500)}`);
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

    const { userQuery, agentResponse } = extractRootData(span);
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
