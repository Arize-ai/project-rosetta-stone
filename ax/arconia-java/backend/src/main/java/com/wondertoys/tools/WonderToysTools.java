package com.wondertoys.tools;

import com.wondertoys.chroma.ChromaClient;
import com.wondertoys.inventory.Order;
import com.wondertoys.inventory.OrderStore;
import com.wondertoys.inventory.Product;
import com.wondertoys.inventory.ProductRepository;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.ai.tool.annotation.ToolParam;
import org.springframework.stereotype.Component;

/**
 * The five Wonder Toys tools exposed to the Spring AI agent. Behaviourally identical to {@code
 * backend/tools.py} in the Python tier — the LLM-facing return shapes are preserved 1:1.
 *
 * <p>Methods are annotated with {@link Tool} (Spring AI) — when the Spring AI {@code ChatClient}
 * is built with {@code .tools(wonderToysTools)} it introspects these annotations and registers
 * them as tool callbacks. Each {@link ToolParam} surface description becomes the JSON-schema
 * {@code description} field for that argument.
 */
@Component
public class WonderToysTools {

  private final ProductRepository products;
  private final OrderStore orders;
  private final ChromaClient chroma;

  public WonderToysTools(ProductRepository products, OrderStore orders, ChromaClient chroma) {
    this.products = products;
    this.orders = orders;
    this.chroma = chroma;
  }

  // ---------------------------------------------------------------------------
  // 1. search-products
  // ---------------------------------------------------------------------------

  @Tool(
      name = "search-products",
      description =
          "Search the toy store inventory by text query, keywords, age range, or category."
              + " Use this when the user wants to find or browse products.")
  public Map<String, Object> searchProducts(
      @ToolParam(
              description = "Free-text search query to match against product names and descriptions",
              required = false)
          String query,
      @ToolParam(description = "Specific keywords to match against product keyword tags", required = false)
          List<String> keywords,
      @ToolParam(description = "Minimum age in years for the target child", required = false) Integer minAge,
      @ToolParam(description = "Maximum age in years for the target child", required = false) Integer maxAge,
      @ToolParam(description = "Product category to filter by", required = false) String category) {

    List<Product> filtered;

    if (query != null && !query.isBlank()) {
      Map<String, Object> where = buildChromaWhere(category, minAge, maxAge);
      List<String> vectorIds = chroma.vectorSearch(query, 20, where);

      if (!vectorIds.isEmpty()) {
        Set<String> idSet = new HashSet<>(vectorIds);
        Map<String, Integer> idOrder = new HashMap<>();
        for (int i = 0; i < vectorIds.size(); i++) idOrder.put(vectorIds.get(i), i);

        filtered =
            products.all().stream()
                .filter(p -> idSet.contains(p.id))
                .sorted(Comparator.comparingInt(p -> idOrder.getOrDefault(p.id, 0)))
                .collect(java.util.stream.Collectors.toCollection(ArrayList::new));

        // Apply keyword filter on top of vector results if provided.
        if (keywords != null && !keywords.isEmpty()) {
          List<String> kws = keywords.stream().map(String::toLowerCase).toList();
          filtered =
              filtered.stream()
                  .filter(
                      p ->
                          p.keywords.stream()
                              .anyMatch(
                                  pk -> kws.stream().anyMatch(kw -> pk.toLowerCase().contains(kw))))
                  .collect(java.util.stream.Collectors.toCollection(ArrayList::new));
        }

        return buildSearchResponse(filtered);
      }

      // Vector search unavailable or empty — fall through to keyword search.
      filtered = products.keywordSearch(query, keywords, minAge, maxAge, category);
    } else {
      filtered = products.keywordSearch(null, keywords, minAge, maxAge, category);
    }

    return buildSearchResponse(filtered);
  }

  private static Map<String, Object> buildChromaWhere(String category, Integer minAge, Integer maxAge) {
    List<Map<String, Object>> conditions = new ArrayList<>();
    if (category != null && !category.isBlank()) {
      conditions.add(Map.of("category", Map.of("$eq", category.toLowerCase())));
    }
    if (minAge != null) conditions.add(Map.of("ageMax", Map.of("$gte", minAge)));
    if (maxAge != null) conditions.add(Map.of("ageMin", Map.of("$lte", maxAge)));

    if (conditions.isEmpty()) return Map.of();
    if (conditions.size() == 1) return conditions.get(0);
    return Map.of("$and", conditions);
  }

  private static Map<String, Object> buildSearchResponse(List<Product> filtered) {
    List<Map<String, Object>> results = new ArrayList<>();
    for (int i = 0; i < Math.min(10, filtered.size()); i++) {
      results.add(toSearchResult(filtered.get(i)));
    }
    Map<String, Object> response = new LinkedHashMap<>();
    response.put("results", results);
    response.put("totalFound", filtered.size());
    return response;
  }

  private static Map<String, Object> toSearchResult(Product p) {
    Map<String, Object> m = new LinkedHashMap<>();
    m.put("id", p.id);
    m.put("name", p.name);
    m.put("description", p.description);
    m.put("price", p.price);
    m.put("ageRange", p.ageRange.min() + "-" + p.ageRange.max() + " years");
    m.put("category", p.category);
    m.put("inStock", p.inventory > 0);
    m.put("image", p.image);
    m.put("rating", p.rating);
    m.put("manufacturer", p.manufacturer);
    return m;
  }

  // ---------------------------------------------------------------------------
  // 2. get-product
  // ---------------------------------------------------------------------------

  @Tool(
      name = "get-product",
      description =
          "Get detailed information about a specific product by its ID."
              + " Use this when the user asks about a specific product or needs more details.")
  public Map<String, Object> getProduct(
      @ToolParam(description = "The product ID to look up, e.g. 'toy-001'") String productId) {
    Product p = products.findById(productId);
    if (p == null) return Map.of("found", false);

    Map<String, Object> detail = new LinkedHashMap<>();
    detail.put("id", p.id);
    detail.put("name", p.name);
    detail.put("description", p.description);
    detail.put("marketingCopy", p.marketingCopy);
    detail.put("keywords", p.keywords);
    detail.put("ageRange", p.ageRange.min() + "-" + p.ageRange.max() + " years");
    detail.put("price", p.price);
    detail.put("inventory", p.inventory);
    detail.put("category", p.category);
    detail.put("image", p.image);
    detail.put("rating", p.rating);
    detail.put("manufacturer", p.manufacturer);
    detail.put("dimensions", p.dimensions);
    detail.put("bestSellersRank", p.bestSellersRank);

    Map<String, Object> response = new LinkedHashMap<>();
    response.put("found", true);
    response.put("product", detail);
    return response;
  }

  // ---------------------------------------------------------------------------
  // 3. purchase-product
  // ---------------------------------------------------------------------------

  @Tool(
      name = "purchase-product",
      description =
          "Purchase one or more products. The user's credit card is on file, so only shipping"
              + " details are needed. Use this after the user has confirmed they want to buy and"
              + " has provided shipping information.")
  public Map<String, Object> purchaseProduct(
      @ToolParam(description = "The authenticated user's ID") String userId,
      @ToolParam(description = "List of products and quantities to purchase") List<PurchaseItem> items,
      @ToolParam(description = "Shipping address details") ShippingAddress shippingAddress) {

    // Validate every item first — don't deduct inventory until we know the whole order is good.
    List<Order.OrderItem> orderItems = new ArrayList<>();
    for (PurchaseItem item : items) {
      Product p = products.findById(item.productId());
      if (p == null) {
        return Map.of("success", false, "error", "Product " + item.productId() + " not found");
      }
      if (p.inventory < item.quantity()) {
        return Map.of(
            "success",
            false,
            "error",
            "Insufficient stock for " + p.name + ". Only " + p.inventory + " available.");
      }
      orderItems.add(new Order.OrderItem(p.id, p.name, item.quantity(), p.price));
    }

    // Deduct inventory.
    for (PurchaseItem item : items) {
      Product p = products.findById(item.productId());
      if (p != null) p.inventory -= item.quantity();
    }

    Map<String, String> addr = new LinkedHashMap<>();
    addr.put("name", shippingAddress.name());
    addr.put("street", shippingAddress.street());
    addr.put("city", shippingAddress.city());
    addr.put("state", shippingAddress.state());
    addr.put("zip", shippingAddress.zip());
    addr.put("country", shippingAddress.country());

    Order order = orders.create(userId, orderItems, addr);

    List<Map<String, Object>> responseItems = new ArrayList<>();
    for (Order.OrderItem oi : orderItems) {
      Map<String, Object> m = new LinkedHashMap<>();
      m.put("productName", oi.productName());
      m.put("quantity", oi.quantity());
      m.put("price", oi.price());
      responseItems.add(m);
    }

    Map<String, Object> response = new LinkedHashMap<>();
    response.put("success", true);
    response.put("orderId", order.id);
    response.put("total", order.total);
    response.put("items", responseItems);
    return response;
  }

  // ---------------------------------------------------------------------------
  // 4. check-order-status
  // ---------------------------------------------------------------------------

  @Tool(
      name = "check-order-status",
      description =
          "Check the status of an order by order ID, or search for orders by product name."
              + " Use this when users ask about their order status, shipping, or delivery.")
  public Map<String, Object> checkOrderStatus(
      @ToolParam(description = "The authenticated user's ID") String userId,
      @ToolParam(description = "Specific order ID to look up (e.g. 'A1B2C3D4')", required = false)
          String orderId,
      @ToolParam(
              description = "Search term to find orders by product name (e.g. 'puzzle' or 'train')",
              required = false)
          String productSearch) {

    List<Order> matched;
    if (orderId != null && !orderId.isBlank()) {
      Order o = orders.byId(orderId);
      matched = o == null ? List.of() : List.of(o);
    } else if (productSearch != null && !productSearch.isBlank()) {
      matched = orders.searchByProduct(userId, productSearch);
    } else {
      matched = orders.byUser(userId);
    }

    if (matched.isEmpty()) return Map.of("found", false, "orders", List.of());

    List<Map<String, Object>> orderDtos = new ArrayList<>();
    for (Order o : matched) {
      List<Map<String, Object>> items = new ArrayList<>();
      for (Order.OrderItem oi : o.items) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("productName", oi.productName());
        m.put("quantity", oi.quantity());
        m.put("price", oi.price());
        items.add(m);
      }

      Map<String, Object> dto = new LinkedHashMap<>();
      dto.put("orderId", o.id);
      dto.put("items", items);
      dto.put("total", o.total);
      dto.put("status", o.status);

      Map<String, Object> shipping = new LinkedHashMap<>();
      shipping.put("name", o.shippingAddress.get("name"));
      shipping.put("city", o.shippingAddress.get("city"));
      shipping.put("state", o.shippingAddress.get("state"));
      dto.put("shippingAddress", shipping);

      dto.put("createdAt", o.createdAt);
      orderDtos.add(dto);
    }

    Map<String, Object> response = new LinkedHashMap<>();
    response.put("found", true);
    response.put("orders", orderDtos);
    return response;
  }

  // ---------------------------------------------------------------------------
  // 5. cancel-order
  // ---------------------------------------------------------------------------

  @Tool(
      name = "cancel-order",
      description =
          "Cancel an order by its order ID. Only orders that are still processing or shipping"
              + " can be cancelled. Delivered orders cannot be cancelled.")
  public Map<String, Object> cancelOrder(
      @ToolParam(description = "The authenticated user's ID") String userId,
      @ToolParam(description = "The order ID to cancel (e.g. 'A1B2C3D4')") String orderId) {
    return orders.cancel(orderId, userId);
  }
}
