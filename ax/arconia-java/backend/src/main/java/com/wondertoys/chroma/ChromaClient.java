package com.wondertoys.chroma;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Thin HTTP client for the local ChromaDB server. Mirrors {@code backend/chroma_client.py} from
 * the Python tier — pings {@code /api/v2/heartbeat} once at startup, then issues queries against
 * the {@code products} collection on {@code default_tenant/default_database}.
 *
 * <p>If Chroma is unreachable at startup, {@link #healthy} stays {@code false} and {@link
 * #vectorSearch} returns an empty list so callers can fall back to keyword search.
 */
@Component
public class ChromaClient {

  private static final Logger log = LoggerFactory.getLogger(ChromaClient.class);
  private static final String COLLECTION = "products";
  private static final String QUERY_PATH =
      "/api/v2/tenants/default_tenant/databases/default_database/collections/" + COLLECTION + "/query";

  private final String baseUrl;
  private final HttpClient http;
  private final ObjectMapper mapper;
  private volatile boolean healthy = false;

  public ChromaClient(@Value("${wondertoys.chroma.url}") String baseUrl, ObjectMapper mapper) {
    // Strip any trailing slash so path concatenation is clean.
    this.baseUrl = baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
    this.mapper = mapper;
    this.http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(2)).build();
  }

  @PostConstruct
  void ping() {
    try {
      HttpRequest req =
          HttpRequest.newBuilder()
              .uri(URI.create(baseUrl + "/api/v2/heartbeat"))
              .timeout(Duration.ofSeconds(2))
              .GET()
              .build();
      HttpResponse<String> resp = http.send(req, HttpResponse.BodyHandlers.ofString());
      if (resp.statusCode() / 100 == 2) {
        healthy = true;
        log.info("ChromaDB reachable at {}", baseUrl);
      } else {
        log.warn("ChromaDB heartbeat returned HTTP {}, falling back to keyword search", resp.statusCode());
      }
    } catch (Exception e) {
      log.warn(
          "ChromaDB unavailable at {} ({}), falling back to keyword search", baseUrl, e.getMessage());
    }
  }

  public boolean isHealthy() {
    return healthy;
  }

  /**
   * Query the {@code products} collection by text. Returns an ordered list of product IDs (vector
   * distance ascending). Returns an empty list if Chroma is unhealthy or the query fails.
   *
   * @param query the natural-language query
   * @param nResults the max number of IDs to return
   * @param where optional ChromaDB metadata filter; pass {@code null} to skip
   */
  public List<String> vectorSearch(String query, int nResults, Map<String, Object> where) {
    if (!healthy) return List.of();
    if (query == null || query.isBlank()) return List.of();

    Map<String, Object> payload = new LinkedHashMap<>();
    payload.put("query_texts", List.of(query));
    payload.put("n_results", nResults);
    if (where != null && !where.isEmpty()) payload.put("where", where);

    try {
      String body = mapper.writeValueAsString(payload);
      HttpRequest req =
          HttpRequest.newBuilder()
              .uri(URI.create(baseUrl + QUERY_PATH))
              .timeout(Duration.ofSeconds(10))
              .header("Content-Type", "application/json")
              .POST(HttpRequest.BodyPublishers.ofString(body))
              .build();
      HttpResponse<String> resp = http.send(req, HttpResponse.BodyHandlers.ofString());
      if (resp.statusCode() / 100 != 2) {
        log.warn("ChromaDB query returned HTTP {}: {}", resp.statusCode(), resp.body());
        return List.of();
      }
      JsonNode root = mapper.readTree(resp.body());
      JsonNode ids = root.path("ids");
      if (!ids.isArray() || ids.isEmpty()) return List.of();
      JsonNode firstRow = ids.get(0);
      if (!firstRow.isArray()) return List.of();
      List<String> out = new ArrayList<>(firstRow.size());
      for (JsonNode id : firstRow) out.add(id.asText());
      return out;
    } catch (Exception e) {
      log.warn("ChromaDB query failed, falling back to keyword search: {}", e.getMessage());
      return List.of();
    }
  }
}
