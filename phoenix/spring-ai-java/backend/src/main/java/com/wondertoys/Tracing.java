package com.wondertoys;

import com.arize.instrumentation.OITracer;
import com.arize.instrumentation.TraceConfig;
import com.arize.instrumentation.springAI.SpringAIInstrumentor;
import io.micrometer.observation.ObservationRegistry;
import io.opentelemetry.api.common.AttributeKey;
import io.opentelemetry.api.common.Attributes;
import io.opentelemetry.api.trace.propagation.W3CTraceContextPropagator;
import io.opentelemetry.context.propagation.ContextPropagators;
import io.opentelemetry.exporter.otlp.http.trace.OtlpHttpSpanExporter;
import io.opentelemetry.exporter.otlp.http.trace.OtlpHttpSpanExporterBuilder;
import io.opentelemetry.sdk.OpenTelemetrySdk;
import io.opentelemetry.sdk.resources.Resource;
import io.opentelemetry.sdk.trace.SdkTracerProvider;
import io.opentelemetry.sdk.trace.export.BatchSpanProcessor;
import io.opentelemetry.semconv.ServiceAttributes;
import jakarta.annotation.PreDestroy;
import java.time.Duration;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Phoenix tracing for the Spring AI Java tier.
 *
 * <p>Wires up an OpenTelemetry SDK with an OTLP/HTTP+protobuf exporter pointed at Phoenix (local
 * on {@code :6006/v1/traces} by default, or Phoenix Cloud via {@code PHOENIX_COLLECTOR_ENDPOINT}).
 * The {@code openinference.project.name} resource attribute tells Phoenix which project to route
 * spans into.
 *
 * <p>Spring AI's auto-config picks up the {@link ObservationRegistry} bean exposed here via
 * {@code ObjectProvider<ObservationRegistry>} and wires it onto {@code AnthropicChatModel}. The
 * {@link SpringAIInstrumentor} we register on that registry turns Spring AI's micrometer
 * observation events into OpenInference spans against the {@link OITracer} we hand it.
 */
@Configuration
public class Tracing {

  private static final Logger log = LoggerFactory.getLogger(Tracing.class);
  private static final AttributeKey<String> OPENINFERENCE_PROJECT_NAME =
      AttributeKey.stringKey("openinference.project.name");

  private SdkTracerProvider tracerProvider;

  @Bean
  ObservationRegistry observationRegistry(
      @Value("${wondertoys.phoenix.endpoint}") String endpoint,
      @Value("${wondertoys.phoenix.api-key:}") String apiKey,
      @Value("${wondertoys.phoenix.project-name}") String projectName) {

    String collectorUrl = ensureTracesPath(endpoint);

    OtlpHttpSpanExporterBuilder exporterBuilder =
        OtlpHttpSpanExporter.builder().setEndpoint(collectorUrl).setTimeout(Duration.ofSeconds(10));
    if (!apiKey.isBlank()) {
      // Phoenix Cloud expects `authorization: Bearer <key>`.
      exporterBuilder.addHeader("authorization", "Bearer " + apiKey);
    }

    Resource resource =
        Resource.getDefault()
            .merge(
                Resource.create(
                    Attributes.builder()
                        .put(ServiceAttributes.SERVICE_NAME, projectName)
                        .put(OPENINFERENCE_PROJECT_NAME, projectName)
                        .build()));

    tracerProvider =
        SdkTracerProvider.builder()
            .addSpanProcessor(BatchSpanProcessor.builder(exporterBuilder.build()).build())
            .setResource(resource)
            .build();

    OpenTelemetrySdk.builder()
        .setTracerProvider(tracerProvider)
        .setPropagators(ContextPropagators.create(W3CTraceContextPropagator.getInstance()))
        .buildAndRegisterGlobal();

    log.info(
        "Phoenix tracing initialised — endpoint={} project={} (auth={})",
        collectorUrl,
        projectName,
        apiKey.isBlank() ? "anonymous" : "bearer");

    // SpringAIInstrumentor is an ObservationHandler — register it on a registry that Spring AI's
    // auto-config will pick up via ObjectProvider<ObservationRegistry>.
    OITracer tracer =
        new OITracer(tracerProvider.get("com.arize.spring-ai"), TraceConfig.getDefault());

    ObservationRegistry registry = ObservationRegistry.create();
    registry.observationConfig().observationHandler(new SpringAIInstrumentor(tracer));
    return registry;
  }

  /** Phoenix expects {@code /v1/traces} at the end of the OTLP HTTP endpoint. */
  private static String ensureTracesPath(String endpoint) {
    String trimmed = endpoint.endsWith("/") ? endpoint.substring(0, endpoint.length() - 1) : endpoint;
    return trimmed.endsWith("/v1/traces") ? trimmed : trimmed + "/v1/traces";
  }

  @PreDestroy
  void flushAndShutdown() {
    if (tracerProvider != null) {
      log.info("Flushing tracer provider on shutdown");
      tracerProvider.forceFlush().join(5, java.util.concurrent.TimeUnit.SECONDS);
      tracerProvider.shutdown().join(5, java.util.concurrent.TimeUnit.SECONDS);
    }
  }
}
