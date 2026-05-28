plugins {
    id("java")
    id("org.springframework.boot") version "4.0.6"
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
    maven { url = uri("https://repo.spring.io/milestone") }
}

// Spring AI 2.0.0-M8 (milestone) — required by Arconia 0.27 + Spring Boot 4.0. Pulls in
// `spring-ai-anthropic` + the auto-config that exposes `ChatClient.Builder`.
extra["springAiVersion"] = "2.0.0-M8"
// Arconia 0.27.0 — auto-configures OTel SDK + OTLP exporter from `arconia.otel.*` properties
// and emits OpenInference-conventioned spans from Spring AI's micrometer observations. The AX
// tier uses gRPC transport to `otlp.arize.com:443`.
extra["arconiaVersion"] = "0.27.0"

dependencyManagement {
    imports {
        mavenBom("org.springframework.ai:spring-ai-bom:${property("springAiVersion")}")
        mavenBom("io.arconia:arconia-bom:${property("arconiaVersion")}")
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

    // Arconia — auto-configures OpenTelemetry SDK from `arconia.otel.*` properties.
    implementation("io.arconia:arconia-opentelemetry-spring-boot-starter")
    // OpenInference AI semantic conventions — turns Spring AI's micrometer observations into
    // spans that carry `openinference.*` attributes (input/output values, token counts, model
    // metadata) so AX can render them with the right shape.
    implementation("io.arconia:arconia-openinference-ai-semantic-conventions")
    // gRPC sender for OTLP — AX expects spans on `otlp.arize.com:443` over gRPC, not HTTP.
    implementation("io.opentelemetry:opentelemetry-exporter-sender-okhttp:1.61.0")

    // Logging — keep Spring Boot's default Logback but quiet down by default.
    implementation("org.slf4j:slf4j-api:2.0.16")
}

springBoot {
    mainClass = "com.wondertoys.App"
}

tasks.named<Test>("test") {
    useJUnitPlatform()
}
