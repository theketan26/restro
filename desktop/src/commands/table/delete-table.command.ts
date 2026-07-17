"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { tableRepository } from "@/infrastructure/db/table-repository";
import { httpClient } from "@/infrastructure/http/axios-client";
import { TABLES_QUERY_KEY } from "@/queries/table/use-tables.query";

async function deleteTable(id: string): Promise<void> {
  await tableRepository.delete(id);

  // Background sync
  httpClient
    .delete(`/tables/${id}`)
    .catch((err) => {
      console.error("Failed to sync deleted table", err);
    });
}

export function useDeleteTable() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteTable,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TABLES_QUERY_KEY });
    },
  });
}
