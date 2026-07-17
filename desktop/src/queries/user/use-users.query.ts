"use client";

import { useQuery } from "@tanstack/react-query";
import { userRepository } from "@/infrastructure/db/user-repository";
import { httpClient } from "@/infrastructure/http/axios-client";
import type { User } from "@/domain/models/user";
import { UserRoles } from "@/types/userRoles";

export const USERS_QUERY_KEY = ["users"] as const;

export interface FetchUsersParams {
  search?: string;
  role?: string;
  page?: number;
  limit?: number;
  status?: string;
}

export const usersQueryKeys = {
  all: USERS_QUERY_KEY,
  list: (params: FetchUsersParams) => [...USERS_QUERY_KEY, "list", params] as const,
};

/**
 * Query side of CQRS:
 *  1. Serve from remote API with parameters (search, role, page, limit).
 *  2. Save results to local Dexie cache.
 *  3. Fallback to local Dexie cache querying (offline-first).
 */
async function fetchUsers(params: FetchUsersParams): Promise<{ users: User[]; total: number; totalUnfiltered: number }> {
  try {
    const { data } = await httpClient.get<any>("/users", { params });
    const { users: usersList } = data.data || { users: [] };
    const mapped: User[] = usersList.map((item: any) => ({
      id: item.id,
      name: item.name,
      email: item.email,
      role: item.role || UserRoles.customer,
      active: item.active !== false,
      createdAt: item.created_at ? Date.parse(item.created_at) : Date.now(),
      updatedAt: item.updated_at ? Date.parse(item.updated_at) : (item.created_at ? Date.parse(item.created_at) : Date.now()),
      syncedAt: Date.now(),
    }));
    // Bulk write to Dexie cache
    await userRepository.saveMany(mapped);
  } catch (e) {
    console.error("Fetch users API error:", e);
  }

  // Always query Dexie cache as Single Source of Truth
  const cached = await userRepository.findAll();
  let filtered = [...cached];
  
  if (params.role && params.role !== "all") {
    filtered = filtered.filter(u => (u.role || "").toLowerCase() === params.role!.toLowerCase());
  }

  const statusFilter = params.status || "active";
  if (statusFilter !== "all") {
    const isTargetActive = statusFilter === "active";
    filtered = filtered.filter(u => (u.active !== false) === isTargetActive);
  }
  
  if (params.search) {
    const searchLower = params.search.toLowerCase();
    filtered = filtered.filter(u => 
      (u.name || "").toLowerCase().includes(searchLower) || 
      (u.email || "").toLowerCase().includes(searchLower)
    );
  }
  
  const total = filtered.length;
  const page = params.page || 1;
  const limit = params.limit || 20;
  const start = (page - 1) * limit;
  const paginated = filtered.slice(start, start + limit);

  return { users: paginated, total, totalUnfiltered: cached.length };
}

export function useUsers(params: FetchUsersParams = {}, options?: any) {
  return useQuery<{ users: User[]; total: number; totalUnfiltered: number }, Error>({
    queryKey: usersQueryKeys.list(params),
    queryFn: () => fetchUsers(params),
    staleTime: 1000 * 60 * 5, // 5 min default staleTime
    ...options,
  });
}
