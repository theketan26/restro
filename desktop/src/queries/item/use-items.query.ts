"use client";

import { useQuery } from "@tanstack/react-query";
import { itemRepository } from "@/infrastructure/db/item-repository";
import { httpClient } from "@/infrastructure/http/axios-client";
import type { Item } from "@/domain/models/item";

export const ITEMS_QUERY_KEY = ["items"] as const;

export interface FetchItemsParams {
  search?: string;
  category?: string;
  page?: number;
  limit?: number;
  diet?: string;
}

export const itemsQueryKeys = {
  all: ITEMS_QUERY_KEY,
  list: (params: FetchItemsParams) => [...ITEMS_QUERY_KEY, "list", params] as const,
};

async function fetchItems(params: FetchItemsParams): Promise<{ items: Item[]; total: number; totalUnfiltered: number }> {
  try {
    const { data } = await httpClient.get<any>("/items", { params });
    const { items: itemsList } = data.data || { items: [] };
    const mapped: Item[] = itemsList.map((item: any) => ({
      id: item.id,
      name: item.name,
      description: item.description || "",
      price: item.price || 0,
      category: item.category || "General",
      available: item.available !== undefined ? item.available : true,
      createdAt: item.created_at ? Date.parse(item.created_at) : Date.now(),
      updatedAt: item.updated_at ? Date.parse(item.updated_at) : (item.created_at ? Date.parse(item.created_at) : Date.now()),
      syncedAt: Date.now(),
      image: item.image,
      taste_profile: item.taste_profile,
      ingredients: item.ingredients,
      diet: item.diet || "veg",
    }));
    // Bulk write to Dexie cache
    await itemRepository.saveMany(mapped);
  } catch (e) {
    console.error("Fetch items API error:", e);
  }

  // Always query Dexie cache as Single Source of Truth
  const cached = await itemRepository.findAll();
  let filtered = [...cached];
  
  if (params.category && params.category !== "all") {
    filtered = filtered.filter(item => (item.category || "").toLowerCase() === params.category!.toLowerCase());
  }

  if (params.diet && params.diet !== "all") {
    filtered = filtered.filter(item => (item.diet || "veg").toLowerCase() === params.diet!.toLowerCase());
  }
  
  if (params.search) {
    const searchLower = params.search.toLowerCase();
    filtered = filtered.filter(item => 
      (item.name || "").toLowerCase().includes(searchLower) || 
      (item.description || "").toLowerCase().includes(searchLower) ||
      (item.taste_profile && item.taste_profile.toLowerCase().includes(searchLower)) ||
      (item.ingredients && item.ingredients.toLowerCase().includes(searchLower))
    );
  }
  
  const total = filtered.length;
  const page = params.page || 1;
  const limit = params.limit || 20;
  const start = (page - 1) * limit;
  const paginated = filtered.slice(start, start + limit);

  return { items: paginated, total, totalUnfiltered: cached.length };
}

export function useItems(params: FetchItemsParams = {}, options?: any) {
  return useQuery<{ items: Item[]; total: number; totalUnfiltered: number }, Error>({
    queryKey: itemsQueryKeys.list(params),
    queryFn: () => fetchItems(params),
    staleTime: 1000 * 60 * 5, // 5 min default staleTime
    ...options,
  });
}
