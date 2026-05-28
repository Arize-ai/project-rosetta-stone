package com.wondertoys;

import dev.langchain4j.model.anthropic.AnthropicStreamingChatModel;
import dev.langchain4j.model.chat.StreamingChatModel;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class App {

  public static void main(String[] args) {
    SpringApplication.run(App.class, args);
  }

  /**
   * The Anthropic streaming chat model used by the LangChain4j agent. A single instance is shared
   * across requests; per-request state (chat history, user id) lives on the per-request {@code
   * Assistant} built in {@link ShoppingAgent}.
   */
  @Bean
  StreamingChatModel anthropicStreamingModel(
      @Value("${wondertoys.anthropic.api-key}") String apiKey,
      @Value("${wondertoys.anthropic.model}") String modelName) {
    if (apiKey == null || apiKey.isBlank()) {
      throw new IllegalStateException(
          "ANTHROPIC_API_KEY is not set — required for the LangChain4j Anthropic provider");
    }
    return AnthropicStreamingChatModel.builder()
        .apiKey(apiKey)
        .modelName(modelName)
        // Claude defaults to a small max_tokens; bump so tool-heavy responses can finish.
        .maxTokens(4096)
        .build();
  }
}
