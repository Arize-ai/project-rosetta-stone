package com.wondertoys;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Spring Boot entry point for the Spring AI Wonder Toys tier.
 *
 * <p>Spring AI's {@code spring-ai-starter-model-anthropic} starter auto-configures an
 * {@code AnthropicChatModel} bean from {@code spring.ai.anthropic.*} properties, and Spring AI's
 * client-chat module exposes a {@code ChatClient.Builder} bean on top of it. There's no manual
 * model bean to declare here — the per-request {@link ShoppingAgent} simply injects the
 * auto-configured {@code ChatClient.Builder}.
 */
@SpringBootApplication
public class App {

  public static void main(String[] args) {
    SpringApplication.run(App.class, args);
  }
}
