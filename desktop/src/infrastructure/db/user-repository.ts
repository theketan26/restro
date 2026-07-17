import { db } from "./db";
import type { BaseRepository } from "./base-repository";
import type { User } from "@/domain/models/user";

class UserRepository implements BaseRepository<User, string> {
  async findAll(): Promise<User[]> {
    return db.users.orderBy("createdAt").reverse().toArray();
  }

  async findById(id: string): Promise<User | undefined> {
    return db.users.get(id);
  }

  async save(user: User): Promise<string> {
    await db.users.put(user);
    return user.id;
  }

  async saveMany(users: User[]): Promise<void> {
    await db.users.bulkPut(users);
  }

  async update(id: string, partial: Partial<User>): Promise<void> {
    await db.users.update(id, { ...partial, updatedAt: Date.now() });
  }

  async delete(id: string): Promise<void> {
    await db.users.delete(id);
  }

  // Domain-specific query: records written locally but not yet confirmed by the server
  async findUnsynced(): Promise<User[]> {
    return db.users
      .filter((u) => !u.syncedAt || u.updatedAt > u.syncedAt)
      .toArray();
  }
}

export const userRepository = new UserRepository();
