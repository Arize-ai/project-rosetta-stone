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
import org.springframework.stereotype.Component;

/**
 * The five Wonder Toys tools, exposed as plain Java methods. Behaviourally identical to {@code
 * backend/tools.py} in the Python tier — the LLM-facing return shapes are preserved 1:1.
 *
 * <p>Unlike the LangChain4j sibling, this tier doesn't use a framework agent abstraction. The agent
 * loop in {@link com.wondertoys.ShoppingAgent} dispatches Claude's tool-use blocks by name via
 * {@link #dispatch(String, Map, String)}; the tool schemas are exposed via {@link #toolSpecs()} so
 * the agent can pass them to the Anthropic API on each request.
 *
 * <p>In the no-observability tier these methods are unadorned. The phoenix/ax tiers add the
 * {@code @Tool} annotation from {@code com.arize.instrumentation.annotation} on each tool method so
 * the runtime ByteBuddy agent wraps them in TOOL spans.
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
  // Tool dispatch — called by the agent loop with a Claude tool-use input map.
  // The userId comes from the ChatController's `x-user-id` header (separate from
  // any userId the LLM may have included in its tool args, which we ignore).
  // ---------------------------------------------------------------------------

  public Object dispatch(String toolName, Map<String, Object> input, String userId) {
    return switch (toolName) {
      case "search-products" -> searchProducts(
          (String) input.get("query"),
          castList(input.get("keywords")),
          castInt(input.get("minAge")),
          castInt(input.get("maxAge")),
          (String) input.get("category"));
      case "get-product" -> getProduct((String) input.get("productId"));
      case "purchase-product" -> purchaseProduct(
          userId,
          parsePurchaseItems(input.get("items")),
          parseShippingAddress(input.get("shippingAddress")));
      case "check-order-status" -> checkOrderStatus(
          userId, (String) input.get("orderId"), (String) input.get("productSearch"));
      case "cancel-order" -> cancelOrder(userId, (String) input.get("orderId"));
      default -> Map.of("error", "Unknown tool: " + toolName);
    };
  }

  /** JSON-schema-style specs the agent loop hands to the Anthropic API on each request. */
  public List<ToolSpec> toolSpecs() {
    List<ToolSpec> specs = new ArrayList<>();

    specs.add(new ToolSpec(
        "search-products",
        "Search the toy store inventory by text query, keywords, age range, or category. Use this when the user wants to find or browse products.",
        Map.of(
            "type", "object",
            "properties", Map.of(
                "query", Map.of("type", "string", "description", "Free-text search query to match against product names and descriptions"),
                "keywords", Map.of("type", "array", "items", Map.of("type", "string"), "description", "Specific keywords to match against product keyword tags"),
                "minAge", Map.of("type", "integer", "description", "Minimum age in years for the target child"),
                "maxAge", Map.of("type", "integer", "description", "Maximum age in years for the target child"),
                "category", Map.of("type", "string", "description", "Product category to filter by")),
            "required", List.of())));

    specs.add(new ToolSpec(
        "get-product",
        "Get detailed information about a specific product by its ID. Use this when the user asks about a specific product or needs more details.",
        Map.of(
            "type", "object",
            "properties", Map.of(
                "productId", Map.of("type", "string", "description", "The product ID to look up, e.g. 'toy-001'")),
            "required", List.of("productId"))));

    specs.add(new ToolSpec(
        "purchase-product",
        "Purchase one or more products. The user's credit card is on file, so only shipping details are needed. Use this after the user has confirmed they want to buy and has provided shipping information.",
        Map.of(
            "type", "object",
            "properties", Map.of(
                "items", Map.of(
                    "type", "array",
                    "description", "List of products and quantities to purchase",
                    "items", Map.of(
                        "type", "object",
                        "properties", Map.of(
                            "productId", Map.of("type", "string"),
                            "quantity", Map.of("type", "integer")),
                        "required", List.of("productId", "quantity"))),
                "shippingAddress", Map.of(
                    "type", "object",
                    "description", "Shipping address details",
                    "properties", Map.of(
                        "name", Map.of("type", "string"),
                        "street", Map.of("type", "string"),
                        "city", Map.of("type", "string"),
                        "state", Map.of("type", "string"),
                        "zip", Map.of("type", "string"),
                        "country", Map.of("type", "string")),
                    "required", List.of("name", "street", "city", "state", "zip", "country"))),
            "required", List.of("items", "shippingAddress"))));

    specs.add(new ToolSpec(
        "check-order-status",
        "Check the status of an order by order ID, or search for orders by product name. Use this when users ask about their order status, shipping, or delivery.",
        Map.of(
            "type", "object",
            "properties", Map.of(
                "orderId", Map.of("type", "string", "description", "Specific order ID to look up (e.g. 'A1B2C3D4')"),
                "productSearch", Map.of("type", "string", "description", "Search term to find orders by product name (e.g. 'puzzle' or 'train')")),
            "required", List.of())));

    specs.add(new ToolSpec(
        "cancel-order",
        "Cancel an order by its order ID. Only orders that are still processing or shipping can be cancelled. Delivered orders cannot be cancelled.",
        Map.of(
            "type", "object",
            "properties", Map.of(
                "orderId", Map.of("type", "string", "description", "The order ID to cancel (e.g. 'A1B2C3D4')")),
            "required", List.of("orderId"))));

    return specs;
  }

  /** Tool descriptor handed to the Anthropic API. */
  public record ToolSpec(String name, String description, Map<String, Object> inputSchema) {}

  // ---------------------------------------------------------------------------
  // 1. search-products
  // ---------------------------------------------------------------------------

  public Map<String, Object> searchProducts(
      String query, List<String> keywords, Integer minAge, Integer maxAge, String category) {

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

  public Map<String, Object> getProduct(String productId) {
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

  public Map<String, Object> purchaseProduct(
      String userId, List<PurchaseItem> items, ShippingAddress shippingAddress) {

    if (items == null || items.isEmpty()) {
      return Map.of("success", false, "error", "No items provided");
    }
    if (shippingAddress == null) {
      return Map.of("success", false, "error", "No shipping address provided");
    }

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

  public Map<String, Object> checkOrderStatus(String userId, String orderId, String productSearch) {

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

  public Map<String, Object> cancelOrder(String userId, String orderId) {
    return orders.cancel(orderId, userId);
  }

  // ---------------------------------------------------------------------------
  // Helpers for parsing Claude's tool input maps into the typed records the
  // tool methods expect.
  // ---------------------------------------------------------------------------

  @SuppressWarnings("unchecked")
  private static List<PurchaseItem> parsePurchaseItems(Object raw) {
    if (!(raw instanceof List<?> rawList)) return List.of();
    List<PurchaseItem> out = new ArrayList<>();
    for (Object e : rawList) {
      if (e instanceof Map<?, ?> m) {
        String pid = (String) m.get("productId");
        Integer qty = castInt(m.get("quantity"));
        if (pid != null && qty != null) {
          out.add(new PurchaseItem(pid, qty));
        }
      }
    }
    return out;
  }

  @SuppressWarnings("unchecked")
  private static ShippingAddress parseShippingAddress(Object raw) {
    if (!(raw instanceof Map<?, ?> m)) return null;
    return new ShippingAddress(
        str(m.get("name")),
        str(m.get("street")),
        str(m.get("city")),
        str(m.get("state")),
        str(m.get("zip")),
        str(m.get("country")));
  }

  private static String str(Object o) {
    return o == null ? null : o.toString();
  }

  @SuppressWarnings("unchecked")
  private static List<String> castList(Object o) {
    if (o instanceof List<?> l) {
      List<String> out = new ArrayList<>();
      for (Object e : l) if (e != null) out.add(e.toString());
      return out;
    }
    return null;
  }

  private static Integer castInt(Object o) {
    if (o instanceof Integer i) return i;
    if (o instanceof Number n) return n.intValue();
    if (o instanceof String s) {
      try {
        return Integer.parseInt(s);
      } catch (NumberFormatException e) {
        return null;
      }
    }
    return null;
  }
}
