package com.wondertoys;

import dev.langchain4j.service.TokenStream;
import dev.langchain4j.service.UserMessage;

/**
 * LangChain4j AI service interface for the Wonder Toys shopping assistant. A new instance is built
 * per HTTP request — the system message (including the authenticated user ID) is injected via
 * {@code AiServices.systemMessageProvider} when the service is constructed.
 */
public interface Assistant {

  TokenStream chat(@UserMessage String message);
}
