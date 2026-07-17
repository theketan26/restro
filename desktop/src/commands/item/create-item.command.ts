"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { v4 as uuidv4 } from "uuid";
import { itemRepository } from "@/infrastructure/db/item-repository";
import { httpClient } from "@/infrastructure/http/axios-client";
import type { CreateItemInput, Item } from "@/domain/models/item";
import { ITEMS_QUERY_KEY } from "@/queries/item/use-items.query";

async function createItem(input: CreateItemInput): Promise<Item> {
  const now = Date.now();
  const item: Item = {
    id: uuidv4(),
    ...input,
    createdAt: now,
    updatedAt: now,
  };

  await itemRepository.save(item);

  // Best-effort background sync — does not block the command
  httpClient
    .post<any>("/items", {
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category,
      available: item.available,
      image: item.image,
      taste_profile: item.taste_profile,
      ingredients: item.ingredients,
      diet: item.diet,
    })
    .then(async ({ data }) => {
      const serverItem = data.data;
      if (!serverItem) throw new Error("No item returned from server");

      // Delete the local temporary item
      await itemRepository.delete(item.id);
      // Save the server confirmed item with server ID and converted timestamp
      await itemRepository.save({
        id: serverItem.id,
        name: serverItem.name,
        description: serverItem.description || "",
        price: serverItem.price || 0,
        category: serverItem.category || "General",
        available: serverItem.available !== undefined ? serverItem.available : true,
        createdAt: serverItem.created_at ? Date.parse(serverItem.created_at) : now,
        updatedAt: serverItem.created_at ? Date.parse(serverItem.created_at) : now,
        syncedAt: Date.now(),
        image: serverItem.image,
        taste_profile: serverItem.taste_profile,
        ingredients: serverItem.ingredients,
        diet: serverItem.diet || "veg",
      });
    })
    .catch((err) => {
      console.error("Failed to sync created item", err);
    });

  return item;
}

export function useCreateItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createItem,
    onSuccess: () => {
      // Force database reload from server to sync state
      queryClient.invalidateQueries({ queryKey: ITEMS_QUERY_KEY });
    },
  });
}
