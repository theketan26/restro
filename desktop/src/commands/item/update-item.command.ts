"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { itemRepository } from "@/infrastructure/db/item-repository";
import { httpClient } from "@/infrastructure/http/axios-client";
import type { UpdateItemInput, Item } from "@/domain/models/item";
import { ITEMS_QUERY_KEY } from "@/queries/item/use-items.query";

async function updateItem(input: UpdateItemInput): Promise<Item> {
  const { id, ...data } = input;
  await itemRepository.update(id, data);

  // Await PUT request sync (with catch to fallback to offline mode)
  try {
    const response = await httpClient.put<any>(`/items/${id}`, data);
    const serverItem = response.data?.data;
    if (serverItem) {
      await itemRepository.update(id, {
        syncedAt: Date.now(),
        name: serverItem.name || data.name,
        description: serverItem.description || data.description,
        price: serverItem.price !== undefined ? serverItem.price : data.price,
        category: serverItem.category || data.category,
        available: serverItem.available !== undefined ? serverItem.available : data.available,
        image: serverItem.image || data.image,
        taste_profile: serverItem.taste_profile || data.taste_profile,
        ingredients: serverItem.ingredients || data.ingredients,
        diet: serverItem.diet || data.diet,
      });
    } else {
      await itemRepository.update(id, { syncedAt: Date.now() });
    }
  } catch (err) {
    console.error("Failed to sync update item", err);
  }

  const item = await itemRepository.findById(id);
  if (!item) throw new Error("Item not found");
  return item;
}

export function useUpdateItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateItem,
    onSuccess: () => {
      // Refetch
      queryClient.invalidateQueries({ queryKey: ITEMS_QUERY_KEY });
    },
  });
}
