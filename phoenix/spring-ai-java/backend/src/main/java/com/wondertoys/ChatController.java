package com.wondertoys;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.model.Generation;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Flux;

/**
 * Streams Spring AI agent responses as Server-Sent Events. Each event has the shape {@code
 * data: {"text":"<chunk>"}\n\n} (note the space after {@code data:} — matches the Python tier's
 * wire format byte-for-byte) and the stream ends with {@code data: [DONE]\n\n}.
 *
 * <p>Spring AI's {@code chatClient.prompt().stream().chatResponse()} returns a {@code
 * Flux<ChatResponse>}. Each emission's {@code Generation.getOutput()} is an {@link
 * AssistantMessage} that may contain text, tool calls, or both. Spring AI handles the tool round
 * trip itself; we just stream out whatever text appears.
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
   * How long we'll wait for the Spring AI agent to finish streaming before giving up. Long
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

    Flux<ChatResponse> stream;
    try {
      stream =
          agent
              .build(split.history(), split.latestUserMessage(), userId)
              .stream()
              .chatResponse();
    } catch (RuntimeException e) {
      log.error("Failed to build Spring AI stream", e);
      sendDone(writer);
      writer.flush();
      return;
    }

    // State shared between the Flux callbacks. `hadTextBefore` tracks whether any text has been
    // emitted yet; `sawToolCall` flips to true on a tool-call chunk and back to false when text
    // resumes (after we've injected a paragraph break).
    AtomicBoolean hadTextBefore = new AtomicBoolean(false);
    AtomicBoolean sawToolCall = new AtomicBoolean(false);
    CountDownLatch done = new CountDownLatch(1);

    stream.subscribe(
        chatResponse -> {
          if (chatResponse == null) return;
          Generation gen = chatResponse.getResult();
          if (gen == null) return;
          AssistantMessage out = gen.getOutput();
          if (out == null) return;

          if (out.hasToolCalls()) {
            sawToolCall.set(true);
          }

          String text = out.getText();
          if (text == null || text.isEmpty()) return;
          if (sawToolCall.get() && hadTextBefore.get()) {
            sendText(writer, "\n\n");
          }
          sawToolCall.set(false);
          hadTextBefore.set(true);
          sendText(writer, text);
        },
        error -> {
          log.error("Streaming chat failed", error);
          sendDone(writer);
          done.countDown();
        },
        () -> {
          sendDone(writer);
          done.countDown();
        });

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
