import { db } from "./db";
import type { BaseRepository } from "./base-repository";
import type { Item } from "@/domain/models/item";

class ItemRepository implements BaseRepository<Item, string> {
  async findAll(): Promise<Item[]> {
    return db.items.orderBy("createdAt").reverse().toArray();
  }

  async findById(id: string): Promise<Item | undefined> {
    return db.items.get(id);
  }

  async save(item: Item): Promise<string> {
    await db.items.put(item);
    return item.id;
  }

  async saveMany(items: Item[]): Promise<void> {
    await db.items.bulkPut(items);
  }

  async update(id: string, partial: Partial<Item>): Promise<void> {
    await db.items.update(id, { ...partial, updatedAt: Date.now() });
  }

  async delete(id: string): Promise<void> {
    await db.items.delete(id);
  }

  async findUnsynced(): Promise<Item[]> {
    return db.items
      .filter((item) => !item.syncedAt || item.updatedAt > item.syncedAt)
      .toArray();
  }
}

export const itemRepository = new ItemRepository();
