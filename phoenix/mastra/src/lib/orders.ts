import { v4 as uuidv4 } from "uuid";

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  total: number;
  shippingAddress: {
    name: string;
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  status: "processing" | "shipping" | "delivered";
  createdAt: string;
}

// In-memory order store (per-process, resets on restart)
const orders: Map<string, Order> = new Map();

function randomStatus(): Order["status"] {
  const statuses: Order["status"][] = ["processing", "shipping", "delivered"];
  return statuses[Math.floor(Math.random() * statuses.length)];
}

export function createOrder(
  userId: string,
  items: OrderItem[],
  shippingAddress: Order["shippingAddress"]
): Order {
  const order: Order = {
    id: uuidv4().slice(0, 8).toUpperCase(),
    userId,
    items,
    total: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    shippingAddress,
    status: "processing",
    createdAt: new Date().toISOString(),
  };
  orders.set(order.id, order);
  return order;
}

export function getOrderById(orderId: string): Order | undefined {
  return orders.get(orderId.toUpperCase());
}

export function getOrdersByUser(userId: string): Order[] {
  return Array.from(orders.values()).filter((o) => o.userId === userId);
}

export function getOrderStatus(orderId: string): string | undefined {
  const order = orders.get(orderId.toUpperCase());
  if (!order) return undefined;
  // Simulate status progression: randomly advance status on each check
  order.status = randomStatus();
  return order.status;
}

export function searchOrdersByProduct(
  userId: string,
  searchTerm: string
): Order[] {
  const term = searchTerm.toLowerCase();
  return getOrdersByUser(userId).filter((order) =>
    order.items.some(
      (item) =>
        item.productName.toLowerCase().includes(term) ||
        item.productId.toLowerCase().includes(term)
    )
  );
}
