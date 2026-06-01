package com.wondertoys;

import com.anthropic.client.AnthropicClient;
import com.anthropic.client.okhttp.AnthropicOkHttpClient;
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
   * The official Anthropic Java SDK client. A single instance is shared across requests; the agent
   * loop in {@link ShoppingAgent} threads per-request state (history, user id) through method
   * arguments instead of per-instance fields.
   *
   * <p>This tier has no observability — no listeners, no exporters, just the raw SDK calling
   * {@code https://api.anthropic.com}.
   */
  @Bean
  AnthropicClient anthropicClient(@Value("${wondertoys.anthropic.api-key}") String apiKey) {
    if (apiKey == null || apiKey.isBlank()) {
      throw new IllegalStateException("ANTHROPIC_API_KEY is not set — required for the Anthropic Java SDK");
    }
    return AnthropicOkHttpClient.builder().apiKey(apiKey).build();
  }
}
