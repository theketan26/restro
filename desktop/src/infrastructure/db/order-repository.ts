import { db } from "./db";
import type { BaseRepository } from "./base-repository";
import type { Order } from "@/domain/models/order";

class OrderRepository implements BaseRepository<Order, string> {
  async findAll(): Promise<Order[]> {
    return db.orders.orderBy("createdAt").reverse().toArray();
  }

  async findById(id: string): Promise<Order | undefined> {
    return db.orders.get(id);
  }

  async save(order: Order): Promise<string> {
    await db.orders.put(order);
    return order.id;
  }

  async saveMany(orders: Order[]): Promise<void> {
    await db.orders.bulkPut(orders);
  }

  async update(id: string, partial: Partial<Order>): Promise<void> {
    await db.orders.update(id, { ...partial, updatedAt: Date.now() });
  }

  async delete(id: string): Promise<void> {
    await db.orders.delete(id);
  }

  async findByToken(tokenId: string): Promise<Order[]> {
    return db.orders.where("tokenId").equals(tokenId).toArray();
  }

  async findUnsynced(): Promise<Order[]> {
    return db.orders
      .filter((order) => !order.syncedAt || order.updatedAt > order.syncedAt)
      .toArray();
  }
}

export const orderRepository = new OrderRepository();
