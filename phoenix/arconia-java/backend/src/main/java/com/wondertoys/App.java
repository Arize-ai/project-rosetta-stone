package com.wondertoys;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

/**
 * Spring Boot entry point for the Arconia + Spring AI Wonder Toys tier.
 *
 * <p>Spring AI's {@code spring-ai-starter-model-anthropic} starter auto-configures an
 * {@code AnthropicChatModel} bean from {@code spring.ai.anthropic.*} properties, and Spring AI's
 * client-chat module exposes a {@code ChatClient.Builder} bean on top of it. There's no manual
 * model bean to declare here — the per-request {@link ShoppingAgent} simply injects the
 * auto-configured {@code ChatClient.Builder}.
 *
 * <p>Tracing is wired up by Arconia's OpenTelemetry Spring Boot starter from the
 * {@code arconia.otel.*} properties in {@code application.yml} — there is no
 * {@code Tracing.java} @Configuration class in this tier (the Spring AI tier has one).
 */
@SpringBootApplication
public class App {

  public static void main(String[] args) {
    SpringApplication.run(App.class, args);
  }

  /**
   * Spring Boot 4 no longer auto-creates a default {@link ObjectMapper} bean for non-web users of
   * Jackson (the web starter still wires Jackson into the message converter chain but doesn't
   * expose the mapper as a top-level bean). We need one for {@code ProductRepository}, so declare
   * it explicitly.
   */
  @Bean
  ObjectMapper objectMapper() {
    return new ObjectMapper();
  }
}
