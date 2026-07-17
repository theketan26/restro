import { UserRoles } from "@/types/userRoles";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRoles;
  active: boolean;
  createdAt: number;
  updatedAt: number;
  syncedAt?: number;
}

export type CreateUserInput = Pick<User, "name" | "email" | "role" | "active">;
export type UpdateUserInput = Partial<Pick<User, "name" | "email" | "role" | "active">> & {
  id: string;
};
