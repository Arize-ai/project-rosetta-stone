package com.wondertoys;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/**
 * Streams LangChain4j agent responses as Server-Sent Events. Each event has the shape {@code
 * data: {"text":"<chunk>"}\n\n} (note the space after {@code data:} — matches the Python tier's
 * wire format byte-for-byte) and the stream ends with {@code data: [DONE]\n\n}.
 *
 * <p>Mirrors {@code stream_agent} in the Python tier — including the {@code \n\n} paragraph break
 * injected between a tool call and any text that follows it, so pre- and post-tool text don't run
 * together in the chat UI.
 *
 * <p>We bypass Spring's {@code SseEmitter} because it emits {@code data:<payload>} without the
 * conventional space after the colon, and our frontend's hand-rolled SSE parser checks {@code
 * startsWith("data: ")}. Writing the bytes directly is simpler than wedging in a custom converter.
 */
@RestController
public class ChatController {

  private static final Logger log = LoggerFactory.getLogger(ChatController.class);

  /**
   * How long we'll wait for the LangChain4j agent to finish streaming before giving up. Long
   * enough for slow Claude responses with multiple tool calls.
   */
  private static final long STREAM_TIMEOUT_MS = 10 * 60 * 1000L; // 10 minutes

  private final ShoppingAgent agent;
  private final ObjectMapper mapper;
  private final String backendSecret;

  public ChatController(
      ShoppingAgent agent,
      ObjectMapper mapper,
      @Value("${wondertoys.backend.secret}") String backendSecret) {
    this.agent = agent;
    this.mapper = mapper;
    this.backendSecret = backendSecret == null ? "" : backendSecret;
  }

  @PostMapping(value = "/chat", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
  public void chat(
      @RequestHeader(value = "x-api-key", required = false) String apiKey,
      @RequestHeader(value = "x-user-id", required = false) String userIdHeader,
      @RequestBody ChatRequest body,
      HttpServletResponse resp)
      throws IOException {

    verifyApiKey(apiKey);

    String userId = (userIdHeader == null || userIdHeader.isBlank()) ? "anonymous" : userIdHeader;
    List<Map<String, String>> messages =
        body == null || body.messages() == null ? List.of() : body.messages();

    // Prepare the response for SSE streaming. Tomcat would otherwise buffer the whole response.
    resp.setStatus(HttpStatus.OK.value());
    resp.setContentType(MediaType.TEXT_EVENT_STREAM_VALUE);
    resp.setCharacterEncoding("UTF-8");
    resp.setHeader("Cache-Control", "no-cache");
    resp.setHeader("Connection", "keep-alive");
    resp.setHeader("X-Accel-Buffering", "no");

    PrintWriter writer = resp.getWriter();

    ShoppingAgent.Split split = ShoppingAgent.splitHistory(messages);
    if (split.latestUserMessage().isBlank()) {
      sendDone(writer);
      writer.flush();
      return;
    }

    Assistant assistant;
    try {
      assistant = agent.build(split.history(), userId);
    } catch (RuntimeException e) {
      log.error("Failed to build assistant", e);
      sendDone(writer);
      writer.flush();
      return;
    }

    // State shared between the streaming callbacks. {@code hadTextBefore} tracks whether any text
    // has been emitted yet; {@code inToolCall} flips to true on tool execution and back to false
    // when text resumes (after injecting a paragraph break).
    AtomicBoolean hadTextBefore = new AtomicBoolean(false);
    AtomicBoolean inToolCall = new AtomicBoolean(false);
    CountDownLatch done = new CountDownLatch(1);
    CompletableFuture<Throwable> errorFuture = new CompletableFuture<>();

    try {
      assistant
          .chat(split.latestUserMessage())
          .onPartialResponse(
              chunk -> {
                if (chunk == null || chunk.isEmpty()) return;
                if (inToolCall.get() && hadTextBefore.get()) {
                  sendText(writer, "\n\n");
                }
                inToolCall.set(false);
                hadTextBefore.set(true);
                sendText(writer, chunk);
              })
          .onToolExecuted(execution -> inToolCall.set(true))
          .onCompleteResponse(
              response -> {
                sendDone(writer);
                done.countDown();
              })
          .onError(
              error -> {
                log.error("Streaming chat failed", error);
                sendDone(writer);
                errorFuture.complete(error);
                done.countDown();
              })
          .start();
    } catch (RuntimeException e) {
      // {@code TokenStream.start()} can throw synchronously (e.g. auth failure surfaced before
      // any callback fires). Surface it the same way as an async error.
      log.error("Streaming chat failed synchronously", e);
      sendDone(writer);
      writer.flush();
      return;
    }

    try {
      if (!done.await(STREAM_TIMEOUT_MS, TimeUnit.MILLISECONDS)) {
        log.warn("Streaming chat timed out after {} ms — sending [DONE]", STREAM_TIMEOUT_MS);
        sendDone(writer);
      }
    } catch (InterruptedException e) {
      Thread.currentThread().interrupt();
      log.warn("Streaming chat interrupted");
      sendDone(writer);
    }

    writer.flush();
  }

  private void verifyApiKey(String apiKey) {
    if (backendSecret.isBlank()) return; // dev mode: no secret configured
    if (!backendSecret.equals(apiKey)) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Invalid API key");
    }
  }

  /** Write a {@code data: {"text":"<chunk>"}\n\n} SSE event. */
  private void sendText(PrintWriter writer, String text) {
    try {
      String payload = mapper.writeValueAsString(Map.of("text", text));
      synchronized (writer) {
        writer.write("data: ");
        writer.write(payload);
        writer.write("\n\n");
        writer.flush();
      }
    } catch (Exception e) {
      log.debug("SSE write failed (client likely disconnected): {}", e.getMessage());
    }
  }

  /** Write the terminating {@code data: [DONE]\n\n} event. */
  private void sendDone(PrintWriter writer) {
    try {
      synchronized (writer) {
        writer.write("data: [DONE]\n\n");
        writer.flush();
      }
    } catch (Exception e) {
      log.debug("SSE write failed (client likely disconnected): {}", e.getMessage());
    }
  }

  /** Request body for {@code POST /chat}. */
  public record ChatRequest(List<Map<String, String>> messages) {}
}
