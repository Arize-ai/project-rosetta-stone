package com.wondertoys;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.List;
import java.util.Map;
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
 * Streams the hand-rolled agent's responses as Server-Sent Events. Each event has the shape
 * {@code data: {"text":"<chunk>"}\n\n} (note the space after {@code data:} — matches the Python
 * tier's wire format byte-for-byte) and the stream ends with {@code data: [DONE]\n\n}.
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

    // hadTextBefore tracks whether any text has been emitted yet (so we know whether to insert
    // a leading paragraph break); inToolCall flips to true when a tool is dispatched and back to
    // false when text resumes after the tool result is fed back into Claude.
    AtomicBoolean hadTextBefore = new AtomicBoolean(false);
    AtomicBoolean inToolCall = new AtomicBoolean(false);

    try {
      agent.chat(
          split.history(),
          split.latestUserMessage(),
          userId,
          chunk -> {
            if (chunk == null || chunk.isEmpty()) return;
            if (inToolCall.get() && hadTextBefore.get()) {
              sendText(writer, "\n\n");
            }
            inToolCall.set(false);
            hadTextBefore.set(true);
            sendText(writer, chunk);
          },
          () -> inToolCall.set(true));
    } catch (RuntimeException e) {
      log.error("Agent loop failed", e);
    }

    sendDone(writer);
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
