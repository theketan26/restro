export interface Item {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  available: boolean;
  createdAt: number;
  updatedAt: number;
  syncedAt?: number;
  image?: string;
  taste_profile?: string;
  ingredients?: string;
  diet?: string;
}

export type CreateItemInput = Pick<Item, "name" | "description" | "price" | "category" | "available" | "image" | "taste_profile" | "ingredients" | "diet">;
export type UpdateItemInput = Partial<CreateItemInput> & { id: string };
