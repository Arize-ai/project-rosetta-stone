package com.wondertoys.inventory;

import java.util.List;
import java.util.Map;

/**
 * An order placed by a user. Mutable on {@link #status} only — the order store mutates status on
 * every check ({@code processing} → {@code shipping} → {@code delivered}) to mirror the Python
 * tier's behaviour.
 */
public final class Order {
  public String id;
  public String userId;
  public List<OrderItem> items;
  public double total;
  public Map<String, String> shippingAddress;
  /** One of {@code processing}, {@code shipping}, {@code delivered}, {@code cancelled}. */
  public String status;
  public String createdAt;

  public record OrderItem(String productId, String productName, int quantity, double price) {}
}
