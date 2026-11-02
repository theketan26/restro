import Dexie, { type Table } from "dexie";
import type { User } from "@/domain/models/user";
import type { Item } from "@/domain/models/item";
import type { Order, OrderToken } from "@/domain/models/order";
import type { RestaurantTable } from "@/domain/models/table";

export class AppDatabase extends Dexie {
  users!: Table<User, string>;
  items!: Table<Item, string>;
  orders!: Table<Order, string>;
  orderTokens!: Table<OrderToken, string>;
  restaurantTables!: Table<RestaurantTable, string>;

  constructor() {
    super("AppDatabase");
    this.version(7).stores({
      // & prefix = unique primary key; remaining = indexed fields
      users: "&id, email, active, createdAt, updatedAt, syncedAt",
      items: "&id, name, category, available, createdAt, updatedAt, syncedAt, taste_profile, ingredients, diet",
      orders: "&id, tokenId, tableNumber, createdAt, updatedAt, syncedAt",
      orderTokens: "&id, tableNumber, status, createdAt, updatedAt, syncedAt",
      tables: "&id, name, createdAt, updatedAt, syncedAt",
    });
  }
}

export const db = new AppDatabase();

export async function clearAllLocalData(): Promise<void> {
  try {
    await Promise.all([
      db.users.clear(),
      db.items.clear(),
      db.orders.clear(),
      db.orderTokens.clear(),
      db.table("tables").clear(),
    ]);
  } catch (err) {
    console.warn("Error clearing local Dexie tables:", err);
  }
}

