"use client";

import { useQuery } from "@tanstack/react-query";
import { tableRepository } from "@/infrastructure/db/table-repository";
import { httpClient } from "@/infrastructure/http/axios-client";
import type { RestaurantTable } from "@/domain/models/table";

export const TABLES_QUERY_KEY = ["tables"] as const;

async function fetchTables(): Promise<RestaurantTable[]> {
  try {
    const { data } = await httpClient.get<any>("/tables");
    const serverTables = data.data || [];
    const mapped: RestaurantTable[] = serverTables.map((t: any) => ({
      id: t.id,
      name: t.name,
      createdAt: t.created_at,
      updatedAt: t.created_at,
      syncedAt: Date.now(),
    }));
    // Bulk write to Dexie cache
    await tableRepository.saveMany(mapped);
  } catch (e) {
    console.error("Fetch tables API error:", e);
  }

  // Always query Dexie cache as Single Source of Truth
  return tableRepository.findAll();
}

export function useTables(options?: any) {
  return useQuery<RestaurantTable[], Error>({
    queryKey: TABLES_QUERY_KEY,
    queryFn: fetchTables,
    staleTime: 1000 * 60 * 5, // 5 min default staleTime
    ...options,
  });
}
