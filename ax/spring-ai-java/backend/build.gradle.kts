plugins {
    id("java")
    id("org.springframework.boot") version "3.5.0"
    id("io.spring.dependency-management") version "1.1.7"
}

group = "com.wondertoys"
version = "0.1.0"

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(21)
    }
}

repositories {
    mavenCentral()
}

// Spring AI 1.0.7 — current GA. The Anthropic starter pulls in `spring-ai-anthropic` +
// `spring-ai-autoconfigure-model-anthropic` which exposes `ChatClient.Builder` automatically.
extra["springAiVersion"] = "1.0.7"
extra["openinferenceSpringAiVersion"] = "0.1.9"
extra["openTelemetryVersion"] = "1.50.0"

dependencyManagement {
    imports {
        mavenBom("org.springframework.ai:spring-ai-bom:${property("springAiVersion")}")
    }
}

dependencies {
    // Spring Boot — Web MVC for the SSE chat endpoint, JSON product API.
    implementation("org.springframework.boot:spring-boot-starter-web")
    // Webflux is needed because Spring AI's streaming API returns Project Reactor `Flux<ChatResponse>`.
    // We don't host any reactive endpoints — just consume the Flux from inside an MVC controller.
    implementation("org.springframework.boot:spring-boot-starter-webflux")

    // Spring AI — Anthropic provider + auto-configured ChatClient.Builder.
    implementation("org.springframework.ai:spring-ai-starter-model-anthropic")

    // OpenInference Spring AI instrumentation. The artifactId uses camelCase `springAI`, not
    // `spring-ai`. It plugs into Spring AI's existing micrometer `ObservationRegistry` as an
    // `ObservationHandler`, so we expose a single `ObservationRegistry` bean below and Spring AI's
    // auto-config picks it up via `ObjectProvider<ObservationRegistry>`.
    implementation("com.arize:openinference-instrumentation-springAI:${property("openinferenceSpringAiVersion")}")
    // Bridge that lets Micrometer's `Observation` produce spans for Brave-shaped tracers; pulled
    // in by openinference-instrumentation-springAI's runtime deps and required at compile time
    // for the ObservationHandler chain.
    implementation("io.micrometer:micrometer-tracing-bridge-brave:1.5.1")

    // OpenTelemetry SDK + OTLP HTTP exporter for Phoenix.
    implementation("io.opentelemetry:opentelemetry-sdk:${property("openTelemetryVersion")}")
    implementation("io.opentelemetry:opentelemetry-exporter-otlp:${property("openTelemetryVersion")}")
    implementation("io.opentelemetry.semconv:opentelemetry-semconv:1.30.0")

    // Logging — keep Spring Boot's default Logback but quiet down by default.
    implementation("org.slf4j:slf4j-api:2.0.16")
}

springBoot {
    mainClass = "com.wondertoys.App"
}

tasks.named<Test>("test") {
    useJUnitPlatform()
}
