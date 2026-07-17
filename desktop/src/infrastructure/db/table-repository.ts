import { db } from "./db";
import type { BaseRepository } from "./base-repository";
import type { RestaurantTable } from "@/domain/models/table";

class TableRepository implements BaseRepository<RestaurantTable, string> {
  private get tableStore() {
    return db.table<RestaurantTable, string>("tables");
  }

  async findAll(): Promise<RestaurantTable[]> {
    return this.tableStore.orderBy("createdAt").toArray();
  }

  async findById(id: string): Promise<RestaurantTable | undefined> {
    return this.tableStore.get(id);
  }

  async save(table: RestaurantTable): Promise<string> {
    await this.tableStore.put(table);
    return table.id;
  }

  async saveMany(tables: RestaurantTable[]): Promise<void> {
    await this.tableStore.bulkPut(tables);
  }

  async update(id: string, partial: Partial<RestaurantTable>): Promise<void> {
    await this.tableStore.update(id, { ...partial, updatedAt: Date.now() });
  }

  async delete(id: string): Promise<void> {
    await this.tableStore.delete(id);
  }

  async findUnsynced(): Promise<RestaurantTable[]> {
    return this.tableStore
      .filter((table) => !table.syncedAt || table.updatedAt > table.syncedAt)
      .toArray();
  }
}

export const tableRepository = new TableRepository();
