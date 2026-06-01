package com.wondertoys.inventory;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeSet;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

/**
 * Loads the 200-product canonical dataset from {@code products.json} (on the classpath) at startup
 * and exposes lookup / search / inventory-mutation helpers. Mirrors {@code
 * backend/inventory.py} from the Python tier.
 */
@Component
public class ProductRepository {

  private static final Logger log = LoggerFactory.getLogger(ProductRepository.class);

  private final ObjectMapper mapper;
  private List<Product> products = List.of();
  private Map<String, Product> byId = Map.of();

  public ProductRepository(ObjectMapper mapper) {
    this.mapper = mapper;
  }

  @PostConstruct
  void load() {
    try (InputStream in = new ClassPathResource("products.json").getInputStream()) {
      List<Product> loaded = mapper.readValue(in, new TypeReference<List<Product>>() {});
      this.products = new ArrayList<>(loaded);
      this.byId = new HashMap<>();
      for (Product p : loaded) {
        byId.put(p.id, p);
      }
      log.info("Loaded {} products from classpath", products.size());
    } catch (Exception e) {
      throw new IllegalStateException("Failed to load products.json from classpath", e);
    }
  }

  public List<Product> all() {
    return Collections.unmodifiableList(products);
  }

  public Product findById(String id) {
    if (id == null) return null;
    return byId.get(id);
  }

  /** Top 5 products by best-seller rank (ascending). */
  public List<Product> featured() {
    return products.stream()
        .sorted(Comparator.comparingInt(p -> p.bestSellersRank))
        .limit(5)
        .toList();
  }

  /** All categories, sorted alphabetically. */
  public List<String> allCategories() {
    TreeSet<String> set = new TreeSet<>();
    for (Product p : products) set.add(p.category);
    return new ArrayList<>(set);
  }

  /**
   * Keyword-based fallback search. Returns up to {@code Integer.MAX_VALUE} matches — caller is
   * expected to slice. Matches Python's filter order: free-text query → keyword tags → age range →
   * category.
   */
  public List<Product> keywordSearch(
      String query,
      List<String> keywords,
      Integer minAge,
      Integer maxAge,
      String category) {
    List<Product> filtered = new ArrayList<>(products);

    if (query != null && !query.isBlank()) {
      String q = query.toLowerCase();
      filtered =
          filtered.stream()
              .filter(
                  p ->
                      p.name.toLowerCase().contains(q)
                          || p.description.toLowerCase().contains(q))
              .toList();
      filtered = new ArrayList<>(filtered);
    }

    if (keywords != null && !keywords.isEmpty()) {
      List<String> kws = keywords.stream().map(String::toLowerCase).toList();
      filtered =
          filtered.stream()
              .filter(
                  p ->
                      p.keywords.stream()
                          .anyMatch(pk -> kws.stream().anyMatch(kw -> pk.toLowerCase().contains(kw))))
              .toList();
      filtered = new ArrayList<>(filtered);
    }

    if (minAge != null) {
      filtered = filtered.stream().filter(p -> p.ageRange.max() >= minAge).toList();
      filtered = new ArrayList<>(filtered);
    }

    if (maxAge != null) {
      filtered = filtered.stream().filter(p -> p.ageRange.min() <= maxAge).toList();
      filtered = new ArrayList<>(filtered);
    }

    if (category != null && !category.isBlank()) {
      String cat = category.toLowerCase();
      filtered = filtered.stream().filter(p -> p.category.toLowerCase().contains(cat)).toList();
      filtered = new ArrayList<>(filtered);
    }

    return filtered;
  }
}
