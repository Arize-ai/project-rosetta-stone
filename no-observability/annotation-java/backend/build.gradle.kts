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

dependencies {
    // Spring Boot — Web MVC for the SSE chat endpoint, JSON product API.
    implementation("org.springframework.boot:spring-boot-starter-web")

    // Anthropic Java SDK — Claude client. The `client-okhttp` artifact pulls in the OkHttp
    // transport plus the `anthropic-java-core` model classes transitively.
    implementation("com.anthropic:anthropic-java-client-okhttp:${property("anthropicJavaVersion")}")

    // Logging — keep Spring Boot's default Logback but quiet down by default.
    implementation("org.slf4j:slf4j-api:2.0.16")
}

springBoot {
    mainClass = "com.wondertoys.App"
}

tasks.named<Test>("test") {
    useJUnitPlatform()
}
