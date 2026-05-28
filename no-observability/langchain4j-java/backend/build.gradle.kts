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

// LangChain4j 1.12.0 is the floor: openinference-instrumentation-langchain4j
// 0.1.8 references `dev.langchain4j.observability.api.listener.AiServiceRequestIssuedListener`
// which first appears in langchain4j-core 1.12.0. Anything older NoClassDefFounds.
extra["langchain4jVersion"] = "1.12.2"
extra["langchain4jAnthropicVersion"] = "1.12.2"

dependencies {
    // Spring Boot — Web MVC for the SSE chat endpoint, JSON product API.
    implementation("org.springframework.boot:spring-boot-starter-web")

    // LangChain4j — agent + tools + Anthropic provider.
    implementation("dev.langchain4j:langchain4j:${property("langchain4jVersion")}")
    implementation("dev.langchain4j:langchain4j-anthropic:${property("langchain4jAnthropicVersion")}")

    // Logging — keep Spring Boot's default Logback but quiet down by default.
    implementation("org.slf4j:slf4j-api:2.0.16")
}

springBoot {
    mainClass = "com.wondertoys.App"
}

tasks.named<Test>("test") {
    useJUnitPlatform()
}
