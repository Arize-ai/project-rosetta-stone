package com.wondertoys;

import com.arize.instrumentation.OITracer;
import com.arize.instrumentation.TraceConfig;
import com.arize.instrumentation.springAI.SpringAIInstrumentor;
import io.micrometer.observation.ObservationRegistry;
import io.opentelemetry.api.common.AttributeKey;
import io.opentelemetry.api.common.Attributes;
import io.opentelemetry.api.trace.propagation.W3CTraceContextPropagator;
import io.opentelemetry.context.propagation.ContextPropagators;
import io.opentelemetry.exporter.otlp.trace.OtlpGrpcSpanExporter;
import io.opentelemetry.exporter.otlp.trace.OtlpGrpcSpanExporterBuilder;
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
 * Arize AX tracing for the Spring AI Java tier.
 *
 * <p>Wires up an OpenTelemetry SDK with an OTLP gRPC exporter pointed at {@code
 * otlp.arize.com:443}. The {@code openinference.project.name} resource attribute tells AX which
 * project to route spans into. AX expects {@code space_id} and {@code api_key} headers rather
 * than {@code authorization: Bearer …}.
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
      @Value("${wondertoys.arize.endpoint}") String endpoint,
      @Value("${wondertoys.arize.space-id}") String spaceId,
      @Value("${wondertoys.arize.api-key}") String apiKey,
      @Value("${wondertoys.arize.project-name}") String projectName) {

    if (spaceId.isBlank() || apiKey.isBlank()) {
      log.warn(
          "ARIZE_SPACE_ID or ARIZE_API_KEY not set — AX tracing will be initialised but spans"
              + " will be rejected at the OTLP collector");
    }

    OtlpGrpcSpanExporterBuilder exporterBuilder =
        OtlpGrpcSpanExporter.builder()
            .setEndpoint(endpoint)
            .addHeader("arize-space-id", spaceId)
            .addHeader("arize-api-key", apiKey)
            .setTimeout(Duration.ofSeconds(10));

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

    log.info("Arize AX tracing initialised — endpoint={} project={}", endpoint, projectName);

    OITracer tracer =
        new OITracer(tracerProvider.get("com.arize.spring-ai"), TraceConfig.getDefault());

    ObservationRegistry registry = ObservationRegistry.create();
    registry.observationConfig().observationHandler(new SpringAIInstrumentor(tracer));
    return registry;
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
