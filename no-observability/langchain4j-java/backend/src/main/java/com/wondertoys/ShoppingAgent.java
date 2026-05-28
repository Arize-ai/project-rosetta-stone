package com.wondertoys;

import com.wondertoys.tools.WonderToysTools;
import dev.langchain4j.data.message.AiMessage;
import dev.langchain4j.data.message.ChatMessage;
import dev.langchain4j.data.message.SystemMessage;
import dev.langchain4j.data.message.UserMessage;
import dev.langchain4j.memory.ChatMemory;
import dev.langchain4j.memory.chat.MessageWindowChatMemory;
import dev.langchain4j.model.chat.StreamingChatModel;
import dev.langchain4j.service.AiServices;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Component;

/**
 * Builds a per-request {@link Assistant} wired to:
 *
 * <ul>
 *   <li>the shared {@link StreamingChatModel} (Anthropic Claude),
 *   <li>the singleton {@link WonderToysTools} component,
 *   <li>a fresh {@link MessageWindowChatMemory} pre-populated with the incoming chat history.
 * </ul>
 *
 * <p>The system message is injected via {@code systemMessageProvider} so the authenticated user
 * ID is templated in at build time. This mirrors the Python tier's {@code stream_agent} function,
 * which also prepends a one-liner system message with the user ID.
 */
@Component
public class ShoppingAgent {

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

  private final StreamingChatModel model;
  private final WonderToysTools tools;

  public ShoppingAgent(StreamingChatModel model, WonderToysTools tools) {
    this.model = model;
    this.tools = tools;
  }

  /**
   * Build an {@link Assistant} for a single HTTP request.
   *
   * @param history previous turns (user + assistant, ordered oldest → newest). Should NOT include
   *     the user's current question — that's passed to {@code Assistant.chat(...)} separately.
   *     Pass via {@link #splitHistory(List)} to slice the trailing user message off cleanly.
   * @param userId the authenticated user's ID, threaded into the system message and into every
   *     tool call the model makes.
   * @return a fresh, single-use {@link Assistant} instance.
   */
  public Assistant build(List<Map<String, String>> history, String userId) {
    ChatMemory memory = MessageWindowChatMemory.builder().maxMessages(40).build();
    for (Map<String, String> raw : history) {
      ChatMessage msg = toChatMessage(raw);
      if (msg != null) memory.add(msg);
    }

    String systemPrompt =
        SYSTEM_PROMPT
            + "\n\nThe current authenticated user's ID is: "
            + userId
            + ". Use this userId when making purchases or checking order status.";

    return AiServices.builder(Assistant.class)
        .streamingChatModel(model)
        .tools(tools)
        // Per-request system message templated with userId. The chatMemory below holds the
        // conversation history; AiServices will prepend this system message on each call.
        .systemMessageProvider(memoryId -> systemPrompt)
        .chatMemory(memory)
        .build();
  }

  /**
   * Slice an incoming {@code messages} array into (history, latestUserMessage). If the last
   * message isn't a user message (e.g. a stray assistant turn), the entire array becomes history
   * and the latest user message is {@code ""} — caller should treat that as a no-op.
   */
  public static Split splitHistory(List<Map<String, String>> messages) {
    if (messages == null || messages.isEmpty()) return new Split(List.of(), "");
    Map<String, String> last = messages.get(messages.size() - 1);
    if (!"user".equals(last.get("role"))) {
      return new Split(messages, "");
    }
    return new Split(messages.subList(0, messages.size() - 1), last.getOrDefault("content", ""));
  }

  /** Result of {@link #splitHistory(List)} — history goes into memory, latestUserMessage into chat(). */
  public record Split(List<Map<String, String>> history, String latestUserMessage) {}

  private static ChatMessage toChatMessage(Map<String, String> raw) {
    String role = raw.getOrDefault("role", "user");
    String content = raw.getOrDefault("content", "");
    if (content == null || content.isEmpty()) return null;
    return switch (role) {
      case "user" -> UserMessage.from(content);
      case "assistant" -> AiMessage.from(content);
      case "system" -> SystemMessage.from(content);
      default -> UserMessage.from(content);
    };
  }
}
