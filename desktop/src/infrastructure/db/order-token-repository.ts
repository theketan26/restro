import { db } from "./db";
import type { BaseRepository } from "./base-repository";
import type { OrderToken } from "@/domain/models/order";

class OrderTokenRepository implements BaseRepository<OrderToken, string> {
  async findAll(): Promise<OrderToken[]> {
    return db.orderTokens.orderBy("createdAt").reverse().toArray();
  }

  async findById(id: string): Promise<OrderToken | undefined> {
    return db.orderTokens.get(id);
  }

  async save(token: OrderToken): Promise<string> {
    await db.orderTokens.put(token);
    return token.id;
  }

  async saveMany(tokens: OrderToken[]): Promise<void> {
    await db.orderTokens.bulkPut(tokens);
  }

  async update(id: string, partial: Partial<OrderToken>): Promise<void> {
    await db.orderTokens.update(id, { ...partial, updatedAt: Date.now() });
  }

  async delete(id: string): Promise<void> {
    await db.orderTokens.delete(id);
  }

  async findActiveByTable(tableNumber: string): Promise<OrderToken | undefined> {
    return db.orderTokens
      .where("tableNumber")
      .equals(tableNumber)
      .filter((token) => token.status === "active")
      .first();
  }

  async findActive(): Promise<OrderToken[]> {
    return db.orderTokens
      .filter((token) => token.status === "active")
      .toArray();
  }

  async findUnsynced(): Promise<OrderToken[]> {
    return db.orderTokens
      .filter((token) => !token.syncedAt || token.updatedAt > token.syncedAt)
      .toArray();
  }
}

export const orderTokenRepository = new OrderTokenRepository();
