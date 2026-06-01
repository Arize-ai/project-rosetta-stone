package com.wondertoys.inventory;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import org.springframework.stereotype.Component;

/**
 * In-memory order store. Resets on restart. Mirrors {@code backend/orders.py} from the Python
 * tier — including the never-called {@link #randomStatus()} helper that exists for parity.
 */
@Component
public class OrderStore {

  private static final List<String> STATUSES = List.of("processing", "shipping", "delivered");

  private final ConcurrentMap<String, Order> orders = new ConcurrentHashMap<>();
  private final Random random = new Random();
  private final ProductRepository products;

  public OrderStore(ProductRepository products) {
    this.products = products;
  }

  /** Generate a random 8-char uppercase hex ID matching the Python tier's {@code uuid4().hex[:8].upper()}. */
  private String newOrderId() {
    UUID uuid = UUID.randomUUID();
    return HexFormat.of().withUpperCase().formatHex(toBytes(uuid)).substring(0, 8);
  }

  private static byte[] toBytes(UUID uuid) {
    long msb = uuid.getMostSignificantBits();
    long lsb = uuid.getLeastSignificantBits();
    byte[] buf = new byte[16];
    for (int i = 0; i < 8; i++) buf[i] = (byte) (msb >>> (8 * (7 - i)));
    for (int i = 0; i < 8; i++) buf[8 + i] = (byte) (lsb >>> (8 * (7 - i)));
    return buf;
  }

  /** Available for parity with the Python tier but not invoked by any tool today. */
  public String randomStatus() {
    return STATUSES.get(random.nextInt(STATUSES.size()));
  }

  public Order create(String userId, List<Order.OrderItem> items, Map<String, String> shippingAddress) {
    Order o = new Order();
    o.id = newOrderId();
    o.userId = userId;
    o.items = List.copyOf(items);
    o.total = items.stream().mapToDouble(i -> i.price() * i.quantity()).sum();
    o.shippingAddress = Map.copyOf(shippingAddress);
    o.status = "processing";
    o.createdAt = Instant.now().toString();
    orders.put(o.id, o);
    return o;
  }

  public Order byId(String orderId) {
    if (orderId == null) return null;
    return orders.get(orderId.toUpperCase());
  }

  public List<Order> byUser(String userId) {
    List<Order> out = new ArrayList<>();
    for (Order o : orders.values()) {
      if (o.userId.equals(userId)) out.add(o);
    }
    return out;
  }

  public List<Order> searchByProduct(String userId, String searchTerm) {
    String term = searchTerm == null ? "" : searchTerm.toLowerCase();
    List<Order> out = new ArrayList<>();
    for (Order o : byUser(userId)) {
      for (Order.OrderItem item : o.items) {
        if (item.productName().toLowerCase().contains(term)
            || item.productId().toLowerCase().contains(term)) {
          out.add(o);
          break;
        }
      }
    }
    return out;
  }

  /**
   * Cancel an order belonging to {@code userId}. Restores inventory unless the order is already
   * delivered or cancelled. Returns a result map matching the Python tier's shape.
   */
  public Map<String, Object> cancel(String orderId, String userId) {
    Order o = byId(orderId);
    if (o == null) return Map.of("success", false, "error", "Order not found");
    if (!o.userId.equals(userId)) return Map.of("success", false, "error", "Order not found");
    if ("cancelled".equals(o.status)) return Map.of("success", false, "error", "Order is already cancelled");
    if ("delivered".equals(o.status)) return Map.of("success", false, "error", "Cannot cancel a delivered order");

    o.status = "cancelled";
    for (Order.OrderItem item : o.items) {
      Product p = products.findById(item.productId());
      if (p != null) p.inventory += item.quantity();
    }
    return Map.of("success", true);
  }
}
