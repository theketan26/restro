export interface RestaurantTable {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  syncedAt?: number;
}

export type CreateTableInput = Pick<RestaurantTable, "name">;
export type UpdateTableInput = { id: string; name: string };
