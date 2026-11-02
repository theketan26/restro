import { UserRoles } from "@/types/userRoles";

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRoles;
  active: boolean;
  createdAt: number;
  updatedAt: number;
  syncedAt?: number;
}

export type CreateUserInput = Pick<User, "name" | "email" | "role" | "active"> & { password?: string };
export type UpdateUserInput = Partial<Pick<User, "name" | "email" | "role" | "active" | "password">> & {
  id: string;
};
