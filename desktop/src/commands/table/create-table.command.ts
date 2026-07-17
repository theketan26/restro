"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { v4 as uuidv4 } from "uuid";
import { tableRepository } from "@/infrastructure/db/table-repository";
import { httpClient } from "@/infrastructure/http/axios-client";
import type { CreateTableInput, RestaurantTable } from "@/domain/models/table";
import { TABLES_QUERY_KEY } from "@/queries/table/use-tables.query";

async function createTable(input: CreateTableInput): Promise<RestaurantTable> {
  const now = Date.now();
  const table: RestaurantTable = {
    id: uuidv4(),
    name: input.name,
    createdAt: now,
    updatedAt: now,
  };

  await tableRepository.save(table);

  // Background sync
  httpClient
    .post("/tables", {
      id: table.id,
      name: table.name,
      created_at: table.createdAt,
    })
    .then(async ({ data }) => {
      if (data.data) {
        await tableRepository.update(table.id, { syncedAt: Date.now() });
      }
    })
    .catch((err) => {
      console.error("Failed to sync created table", err);
    });

  return table;
}

export function useCreateTable() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTable,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TABLES_QUERY_KEY });
    },
  });
}
