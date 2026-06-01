package com.wondertoys;

import com.anthropic.client.AnthropicClient;
import com.anthropic.client.okhttp.AnthropicOkHttpClient;
import com.arize.instrumentation.annotation.OpenInferenceAgentInstaller;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

/**
 * Phoenix-tier entry point.
 *
 * <p>Critical ordering: {@link OpenInferenceAgentInstaller#install()} attaches the ByteBuddy
 * Java agent at runtime, which retransforms every class that declares an {@code @Agent} /
 * {@code @Chain} / {@code @LLM} / {@code @Tool} method. It must run <strong>before</strong>
 * Spring loads any of those classes — once a class has been resolved into the JVM, Spring's
 * reflective access keeps a reference to the original (un-instrumented) form. So the
 * {@code install()} call goes first, then {@code SpringApplication.run(...)}.
 *
 * <p>The OTel SDK is initialised inside {@link Tracing} (a {@code @Configuration} bean), so
 * spans created in Spring beans pick up the right tracer. {@link OpenInferenceAgentInstaller}
 * tolerates the tracer being registered after the agent installs — the {@code TraceAdvice}
 * code reads {@code OpenInferenceAgent.getTracer()} on every method invocation and no-ops if
 * the tracer hasn't been wired up yet.
 */
@SpringBootApplication
public class App {

  public static void main(String[] args) {
    // 1. Attach the ByteBuddy agent BEFORE any annotated class is loaded.
    OpenInferenceAgentInstaller.install();
    // 2. Boot Spring. Tracing.java will then build the OTel SDK + register the OITracer.
    SpringApplication.run(App.class, args);
  }

  /**
   * The official Anthropic Java SDK client. A single instance is shared across requests; the
   * agent loop in {@link ShoppingAgent} threads per-request state (history, user id) through
   * method arguments instead of per-instance fields.
   */
  @Bean
  AnthropicClient anthropicClient(@Value("${wondertoys.anthropic.api-key}") String apiKey) {
    if (apiKey == null || apiKey.isBlank()) {
      throw new IllegalStateException("ANTHROPIC_API_KEY is not set — required for the Anthropic Java SDK");
    }
    return AnthropicOkHttpClient.builder().apiKey(apiKey).build();
  }
}
