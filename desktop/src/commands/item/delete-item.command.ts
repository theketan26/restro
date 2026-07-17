"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { itemRepository } from "@/infrastructure/db/item-repository";
import { httpClient } from "@/infrastructure/http/axios-client";
import { ITEMS_QUERY_KEY } from "@/queries/item/use-items.query";

async function deleteItem(id: string): Promise<string> {
  await itemRepository.delete(id);

  // Await DELETE request sync (with catch to fallback to offline mode)
  try {
    await httpClient.delete(`/items/${id}`);
  } catch (err) {
    console.error("Failed to sync delete item", err);
  }

  return id;
}

export function useDeleteItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteItem,
    onSuccess: () => {
      // Refetch
      queryClient.invalidateQueries({ queryKey: ITEMS_QUERY_KEY });
    },
  });
}
