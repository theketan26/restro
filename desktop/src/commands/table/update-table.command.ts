"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { tableRepository } from "@/infrastructure/db/table-repository";
import { httpClient } from "@/infrastructure/http/axios-client";
import type { UpdateTableInput } from "@/domain/models/table";
import { TABLES_QUERY_KEY } from "@/queries/table/use-tables.query";

async function updateTable(input: UpdateTableInput): Promise<void> {
  const { id, name } = input;

  await tableRepository.update(id, { name });

  // Background sync
  httpClient
    .put(`/tables/${id}`, { name })
    .then(async ({ data }) => {
      if (data.data) {
        await tableRepository.update(id, { syncedAt: Date.now() });
      }
    })
    .catch((err) => {
      console.error("Failed to sync updated table", err);
    });
}

export function useUpdateTable() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateTable,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TABLES_QUERY_KEY });
    },
  });
}
