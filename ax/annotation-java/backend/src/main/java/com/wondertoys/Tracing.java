package com.wondertoys;

import com.arize.instrumentation.OITracer;
import com.arize.instrumentation.OpenInferenceAgent;
import com.arize.instrumentation.TraceConfig;
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
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import java.time.Duration;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

/**
 * Arize AX tracing for the OpenInference annotation Java tier.
 *
 * <p>Three-step wiring (per https://arize.com/docs/ax/integrations/java/annotation/annotation-tracing):
 *
 * <ol>
 *   <li>{@link com.arize.instrumentation.annotation.OpenInferenceAgentInstaller#install()} — called
 *       from {@link App#main(String[])} <em>before</em> Spring loads any annotated class.
 *   <li>Build an OpenTelemetry SDK + tracer provider with an OTLP gRPC exporter pointed at
 *       {@code otlp.arize.com:443}. The {@code openinference.project.name} resource attribute
 *       tells AX which project to route spans into. AX expects {@code space_id} and
 *       {@code api_key} headers (not {@code authorization: Bearer …}).
 *   <li>Wrap the OTel tracer in an {@link OITracer} and register it via
 *       {@link OpenInferenceAgent#register(OITracer)}. Spans created by the {@code @Agent} /
 *       {@code @Chain} / {@code @LLM} / {@code @Tool} interception now land in AX.
 * </ol>
 *
 * <p>The {@link PostConstruct} initialiser runs after Spring has booted but before the first chat
 * request lands, so the first request already produces fully-traced spans.
 */
@Configuration
public class Tracing {

  private static final Logger log = LoggerFactory.getLogger(Tracing.class);
  private static final AttributeKey<String> OPENINFERENCE_PROJECT_NAME =
      AttributeKey.stringKey("openinference.project.name");

  private final String endpoint;
  private final String spaceId;
  private final String apiKey;
  private final String projectName;

  private SdkTracerProvider tracerProvider;

  public Tracing(
      @Value("${wondertoys.arize.endpoint}") String endpoint,
      @Value("${wondertoys.arize.space-id}") String spaceId,
      @Value("${wondertoys.arize.api-key}") String apiKey,
      @Value("${wondertoys.arize.project-name}") String projectName) {
    this.endpoint = endpoint;
    this.spaceId = spaceId;
    this.apiKey = apiKey;
    this.projectName = projectName;
  }

  @PostConstruct
  void init() {
    if (spaceId.isBlank() || apiKey.isBlank()) {
      log.warn(
          "ARIZE_SPACE_ID or ARIZE_API_KEY not set — AX tracing will be initialised but spans"
              + " will be rejected at the OTLP collector");
    }

    OtlpGrpcSpanExporterBuilder exporterBuilder =
        OtlpGrpcSpanExporter.builder()
            .setEndpoint(endpoint)
            .addHeader("space_id", spaceId)
            .addHeader("api_key", apiKey)
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

    // Build the OITracer and hand it to OpenInferenceAgent so the ByteBuddy advice on
    // @Agent/@Chain/@LLM/@Tool methods has a tracer to emit through.
    OITracer oiTracer =
        new OITracer(tracerProvider.get("openinference.annotation"), TraceConfig.getDefault());
    OpenInferenceAgent.register(oiTracer);

    log.info("Arize AX tracing initialised — endpoint={} project={}", endpoint, projectName);
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
