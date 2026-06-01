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

// Official Anthropic Java SDK — supports streaming + tool use natively.
extra["anthropicJavaVersion"] = "2.35.0"
// OpenInference annotation tracing — framework-agnostic, attached at runtime via ByteBuddy.
extra["openinferenceAnnotationVersion"] = "0.1.2"
extra["openTelemetryVersion"] = "1.50.0"

dependencies {
    // Spring Boot — Web MVC for the SSE chat endpoint, JSON product API.
    implementation("org.springframework.boot:spring-boot-starter-web")

    // Anthropic Java SDK — Claude client. The `client-okhttp` artifact pulls in the OkHttp
    // transport plus the `anthropic-java-core` model classes transitively.
    implementation("com.anthropic:anthropic-java-client-okhttp:${property("anthropicJavaVersion")}")

    // OpenInference annotation library + OpenTelemetry — Phoenix tracing.
    // `OpenInferenceAgentInstaller.install()` runs in App.main() before Spring loads any
    // annotated class; the runtime ByteBuddy agent then wraps every @Agent / @Chain / @LLM /
    // @Tool method in the matching OpenInference span. The tracer is registered into
    // `OpenInferenceAgent.register(...)` from Tracing.java once the OTel SDK is up.
    implementation("com.arize:openinference-instrumentation-annotation:${property("openinferenceAnnotationVersion")}")
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
