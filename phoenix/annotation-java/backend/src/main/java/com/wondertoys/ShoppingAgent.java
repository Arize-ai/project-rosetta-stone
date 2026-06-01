package com.wondertoys;

import com.anthropic.client.AnthropicClient;
import com.anthropic.core.JsonValue;
import com.anthropic.core.http.StreamResponse;
import com.arize.instrumentation.annotation.Agent;
import com.arize.instrumentation.annotation.Chain;
import com.arize.instrumentation.annotation.LLM;
import com.anthropic.models.messages.ContentBlockParam;
import com.anthropic.models.messages.MessageCreateParams;
import com.anthropic.models.messages.MessageParam;
import com.anthropic.models.messages.RawContentBlockDelta;
import com.anthropic.models.messages.RawContentBlockDeltaEvent;
import com.anthropic.models.messages.RawContentBlockStartEvent;
import com.anthropic.models.messages.RawMessageStreamEvent;
import com.anthropic.models.messages.TextBlockParam;
import com.anthropic.models.messages.Tool;
import com.anthropic.models.messages.ToolResultBlockParam;
import com.anthropic.models.messages.ToolUnion;
import com.anthropic.models.messages.ToolUseBlock;
import com.anthropic.models.messages.ToolUseBlockParam;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.wondertoys.tools.WonderToysTools;
import com.wondertoys.tools.WonderToysTools.ToolSpec;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.function.Consumer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Hand-rolled agent loop on top of the official Anthropic Java SDK. Unlike the LangChain4j tier
 * (which uses {@code AiServices} to materialise the loop), this tier owns it explicitly:
 *
 * <ol>
 *   <li>Build a {@link MessageCreateParams} with system prompt + history + tools.
 *   <li>Stream the response via {@code messages().createStreaming(...)}.
 *   <li>Push text deltas to the SSE consumer as they arrive.
 *   <li>Buffer JSON deltas for tool-use blocks until each block closes.
 *   <li>When the stream ends with tool-use blocks present, dispatch every tool, append an
 *       {@code assistant} message containing the tool-use blocks + a {@code user} message
 *       containing the tool results, and loop.
 *   <li>When the stream ends with no tool-use blocks, return — Claude is done.
 * </ol>
 *
 * <p>In the phoenix/ax tiers, {@link #chat} is annotated {@code @Agent} so it becomes the
 * top-level AGENT span; {@link #callClaude} is {@code @LLM} so each model call becomes an LLM
 * span; {@link #invokeTool} is {@code @Chain} so each tool dispatch shows up as a CHAIN around
 * the inner {@code @Tool}-annotated method on {@link WonderToysTools}. In this no-observability
 * tier the annotations are absent — the method shapes stay identical so the cross-tier
 * comparison is fair.
 */
@Component
public class ShoppingAgent {

  private static final Logger log = LoggerFactory.getLogger(ShoppingAgent.class);

  /** Maximum tool-use iterations per request — prevents runaway loops. */
  private static final int MAX_ITERATIONS = 10;

  /** Copied verbatim from {@code no-observability/langchain-py/backend/agent.py}. */
  private static final String SYSTEM_PROMPT =
      """
      You are a friendly and helpful shopping assistant for "Wonder Toys", a children's toy store. Your job is to help customers find the perfect toys, answer questions about products, and help them complete purchases.

      ## Your Capabilities
      - Search for products by description, keywords, age range, or category
      - Get detailed information about specific products
      - Help customers purchase products (their credit card is already on file)
      - Check order status for previous purchases
      - Cancel orders that haven't been delivered yet

      ## Formatting Product Information

      When displaying products, always use rich markdown formatting with images. This is critical for a good shopping experience.

      **IMPORTANT: Image URLs must come EXACTLY from the `image` field returned by the tool (e.g. `/product-images/toy-001.png`). These are local paths starting with `/`. NEVER invent, guess, or use external URLs for images. Use the exact path from the tool result.**

      ### Search Results (multiple products)
      For each product in search results, format as:

      ![Product Name](/product-images/toy-XXX.png)
      **Product Name** — $price
      ⭐ rating (count ratings) · Ages age_range · by Manufacturer
      Description text

      ### Product Details (single product, detailed view)
      When showing a single product's details, format as:

      ![Product Name](/product-images/toy-XXX.png)
      ## Product Name
      **$price** · ⭐ rating (count ratings) · Best Seller Rank #rank

      **Ages:** age_range · **Category:** category · **By:** manufacturer
      **Dimensions:** L×W×H inches, weight lbs
      **In Stock:** inventory available

      Description or marketing copy

      ## Guidelines
      1. **Product Search**: When customers describe what they're looking for, use the search tool with relevant queries, keywords, and age filters. Be proactive about suggesting age-appropriate options.

      2. **Product Details**: When a customer shows interest in a product, use the get-product tool and show the full detailed view with the product image, marketing copy, dimensions, rating, manufacturer, and best seller rank.

      3. **Purchasing**: Before completing a purchase:
         - Confirm the product(s) and quantities
         - Ask for shipping details (recipient name, street address, city, state/province, ZIP/postal code, country)
         - The customer's credit card is already saved in our system, so just confirm they'd like to proceed
         - After purchase, share the order ID and total

      4. **Order Status**: Help customers check on their orders. They can provide an order ID, or describe what they ordered (e.g., "where's my dinosaur set?") and you'll search for matching orders.

      5. **Order Cancellation**: Customers can cancel orders that are still processing or shipping. Use the cancel-order tool with the order ID. Delivered orders cannot be cancelled. Always confirm with the customer before cancelling.

      6. **Tone**: Be warm, enthusiastic about toys, and helpful. Use a conversational tone appropriate for a toy store. Suggest related products when relevant.

      7. **Important**: You have a userId available in the conversation context. Always use it when making purchases or checking orders. The userId will be provided in the system context.
      """;

  private final AnthropicClient client;
  private final WonderToysTools tools;
  private final ObjectMapper mapper;
  private final String modelName;
  private final List<ToolUnion> anthropicTools;

  public ShoppingAgent(
      AnthropicClient client,
      WonderToysTools tools,
      ObjectMapper mapper,
      @Value("${wondertoys.anthropic.model}") String modelName) {
    this.client = client;
    this.tools = tools;
    this.mapper = mapper;
    this.modelName = modelName;
    this.anthropicTools = buildAnthropicTools(tools.toolSpecs());
  }

  /**
   * Run the agent loop end-to-end for a single chat request. Text deltas are pushed to
   * {@code onText}; the {@code \n\n} paragraph break between pre- and post-tool text is the
   * caller's responsibility (see {@link ChatController}).
   *
   * @param history previous turns (oldest → newest); should NOT include the latest user message.
   * @param latestUserMessage the new question to answer.
   * @param userId the authenticated user, threaded into the system prompt and tool calls.
   * @param onText called with each text delta as it arrives from Claude.
   * @param onToolUse called once per tool dispatch — the caller uses this to insert paragraph
   *     breaks in the SSE stream.
   * @return the accumulated final response text Claude sent on the closing turn. Returning a
   *     non-void value is required by the {@code @Agent} annotation — the OpenInference
   *     advice binds {@code @Advice.Return Object} on method exit so a void method fails to
   *     instrument. The returned text also becomes the {@code output.value} on the AGENT span.
   */
  @Agent(name = "wonder-toys-agent")
  public String chat(
      List<Map<String, String>> history,
      String latestUserMessage,
      String userId,
      Consumer<String> onText,
      Runnable onToolUse) {

    List<MessageParam> messages = new ArrayList<>();
    for (Map<String, String> raw : history) {
      MessageParam mp = toMessageParam(raw);
      if (mp != null) messages.add(mp);
    }
    messages.add(MessageParam.builder().role(MessageParam.Role.USER).content(latestUserMessage).build());

    String systemPrompt =
        SYSTEM_PROMPT
            + "\n\nThe current authenticated user's ID is: "
            + userId
            + ". Use this userId when making purchases or checking order status.";

    for (int iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
      Turn turn = callClaude(messages, systemPrompt, onText);

      if (turn.toolUses.isEmpty()) {
        // No tool calls — Claude is done. The accumulated text in this turn is the final reply.
        return turn.text;
      }

      // Append the assistant's message (text + tool-use blocks) so Claude has context next round.
      List<ContentBlockParam> assistantBlocks = new ArrayList<>();
      if (!turn.text.isBlank()) {
        assistantBlocks.add(ContentBlockParam.ofText(TextBlockParam.builder().text(turn.text).build()));
      }
      for (BufferedToolUse tu : turn.toolUses) {
        assistantBlocks.add(
            ContentBlockParam.ofToolUse(
                ToolUseBlockParam.builder()
                    .id(tu.id)
                    .name(tu.name)
                    .input(JsonValue.from(tu.input))
                    .build()));
      }
      messages.add(MessageParam.builder().role(MessageParam.Role.ASSISTANT).contentOfBlockParams(assistantBlocks).build());

      // Execute every tool and gather results into a single user message of tool_result blocks.
      List<ContentBlockParam> resultBlocks = new ArrayList<>();
      for (BufferedToolUse tu : turn.toolUses) {
        onToolUse.run();
        String resultJson = invokeTool(tu.name, tu.input, userId);
        resultBlocks.add(
            ContentBlockParam.ofToolResult(
                ToolResultBlockParam.builder().toolUseId(tu.id).content(resultJson).build()));
      }
      messages.add(MessageParam.builder().role(MessageParam.Role.USER).contentOfBlockParams(resultBlocks).build());
    }

    log.warn("Agent loop hit MAX_ITERATIONS={} without finishing — bailing out", MAX_ITERATIONS);
    return "";
  }

  /**
   * One round-trip to Claude. Streams text deltas to {@code onText} as they arrive, and accumulates
   * tool-use blocks (id, name, partial JSON input) until the stream ends. Returns whatever the
   * model produced so the caller can decide whether to loop.
   *
   * <p>In the phoenix/ax tiers this method is annotated {@code @LLM} so each invocation becomes
   * one LLM span — input.value is the messages list, output.value is the accumulated text +
   * tool-use blocks.
   */
  @LLM(name = "claude-messages")
  Turn callClaude(List<MessageParam> messages, String systemPrompt, Consumer<String> onText) {
    MessageCreateParams params =
        MessageCreateParams.builder()
            .model(modelName)
            .maxTokens(4096L)
            .system(systemPrompt)
            .messages(messages)
            .tools(anthropicTools)
            .build();

    StringBuilder text = new StringBuilder();
    // index -> partial JSON for in-flight tool_use blocks. TreeMap keeps insertion order stable.
    Map<Long, BufferedToolUse> toolUseByIndex = new TreeMap<>();

    try (StreamResponse<RawMessageStreamEvent> stream = client.messages().createStreaming(params)) {
      stream
          .stream()
          .forEach(
              event -> {
                if (event.isContentBlockStart()) {
                  RawContentBlockStartEvent start = event.asContentBlockStart();
                  if (start.contentBlock().isToolUse()) {
                    ToolUseBlock block = start.contentBlock().asToolUse();
                    toolUseByIndex.put(
                        start.index(), new BufferedToolUse(block.id(), block.name(), new StringBuilder()));
                  }
                } else if (event.isContentBlockDelta()) {
                  RawContentBlockDeltaEvent deltaEvt = event.asContentBlockDelta();
                  RawContentBlockDelta delta = deltaEvt.delta();
                  if (delta.isText()) {
                    String chunk = delta.asText().text();
                    text.append(chunk);
                    onText.accept(chunk);
                  } else if (delta.isInputJson()) {
                    BufferedToolUse tu = toolUseByIndex.get(deltaEvt.index());
                    if (tu != null) {
                      tu.jsonBuffer.append(delta.asInputJson().partialJson());
                    }
                  }
                }
                // We ignore content_block_stop / message_delta / message_stop here — the stream
                // ending implicitly closes everything.
              });
    }

    // Parse the buffered tool-use JSON into actual input maps.
    List<BufferedToolUse> toolUses = new ArrayList<>();
    for (BufferedToolUse tu : toolUseByIndex.values()) {
      tu.input = parseJsonObject(tu.jsonBuffer.toString());
      toolUses.add(tu);
    }

    return new Turn(text.toString(), toolUses);
  }

  /**
   * Dispatch a tool by name and return its result as a JSON string (Anthropic's
   * {@code tool_result} content expects a string body).
   *
   * <p>In the phoenix/ax tiers this method is annotated {@code @Chain} so the tool dispatch
   * wraps the underlying {@code @Tool}-annotated method on {@link WonderToysTools}. The TOOL span
   * carries the actual input/output; the CHAIN here is a logical grouping inside the agent loop.
   */
  @Chain(name = "tool-dispatch")
  String invokeTool(String name, Map<String, Object> input, String userId) {
    Object result;
    try {
      result = tools.dispatch(name, input, userId);
    } catch (Exception e) {
      log.error("Tool {} failed", name, e);
      result = Map.of("error", e.getMessage());
    }
    try {
      return mapper.writeValueAsString(result);
    } catch (Exception e) {
      log.error("Failed to serialise tool result", e);
      return "{\"error\":\"failed to serialise tool result\"}";
    }
  }

  // ---------------------------------------------------------------------------
  // History → MessageParam conversion
  // ---------------------------------------------------------------------------

  private static MessageParam toMessageParam(Map<String, String> raw) {
    String role = raw.getOrDefault("role", "user");
    String content = raw.getOrDefault("content", "");
    if (content == null || content.isEmpty()) return null;
    MessageParam.Role mpRole =
        switch (role) {
          case "assistant" -> MessageParam.Role.ASSISTANT;
          default -> MessageParam.Role.USER;
        };
    return MessageParam.builder().role(mpRole).content(content).build();
  }

  public static Split splitHistory(List<Map<String, String>> messages) {
    if (messages == null || messages.isEmpty()) return new Split(List.of(), "");
    Map<String, String> last = messages.get(messages.size() - 1);
    if (!"user".equals(last.get("role"))) {
      return new Split(messages, "");
    }
    return new Split(messages.subList(0, messages.size() - 1), last.getOrDefault("content", ""));
  }

  /** Result of {@link #splitHistory(List)} — history goes into the loop, latestUserMessage is appended. */
  public record Split(List<Map<String, String>> history, String latestUserMessage) {}

  // ---------------------------------------------------------------------------
  // Tool specs → Anthropic ToolUnion
  // ---------------------------------------------------------------------------

  private static List<ToolUnion> buildAnthropicTools(List<ToolSpec> specs) {
    List<ToolUnion> out = new ArrayList<>();
    for (ToolSpec spec : specs) {
      Tool.InputSchema.Builder schemaBuilder = Tool.InputSchema.builder();

      Object props = spec.inputSchema().get("properties");
      Object required = spec.inputSchema().get("required");

      if (props instanceof Map<?, ?> propsMap) {
        Tool.InputSchema.Properties.Builder propsBuilder = Tool.InputSchema.Properties.builder();
        for (Map.Entry<?, ?> e : propsMap.entrySet()) {
          propsBuilder.putAdditionalProperty(e.getKey().toString(), JsonValue.from(e.getValue()));
        }
        schemaBuilder.properties(propsBuilder.build());
      }
      if (required instanceof List<?> reqList) {
        List<String> reqs = new ArrayList<>();
        for (Object o : reqList) reqs.add(o.toString());
        schemaBuilder.required(reqs);
      }

      Tool tool =
          Tool.builder()
              .name(spec.name())
              .description(spec.description())
              .inputSchema(schemaBuilder.build())
              .build();
      out.add(ToolUnion.ofTool(tool));
    }
    return out;
  }

  // ---------------------------------------------------------------------------
  // Streaming-state records
  // ---------------------------------------------------------------------------

  /** Accumulator for a single tool_use block while it's being streamed in. */
  static final class BufferedToolUse {
    final String id;
    final String name;
    final StringBuilder jsonBuffer;
    Map<String, Object> input = Map.of();

    BufferedToolUse(String id, String name, StringBuilder jsonBuffer) {
      this.id = id;
      this.name = name;
      this.jsonBuffer = jsonBuffer;
    }
  }

  /** Output of a single {@link #callClaude} invocation — assistant text + parsed tool-use blocks. */
  record Turn(String text, List<BufferedToolUse> toolUses) {}

  private Map<String, Object> parseJsonObject(String json) {
    if (json == null || json.isBlank()) return new HashMap<>();
    try {
      return mapper.readValue(json, new TypeReference<Map<String, Object>>() {});
    } catch (Exception e) {
      log.warn("Failed to parse tool input JSON ({}); using empty map", e.getMessage());
      return new HashMap<>();
    }
  }
}
