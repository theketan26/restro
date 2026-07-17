"use client";

import { useQuery } from "@tanstack/react-query";
import { orderTokenRepository } from "@/infrastructure/db/order-token-repository";
import { httpClient } from "@/infrastructure/http/axios-client";
import type { OrderToken } from "@/domain/models/order";

export const ORDER_TOKENS_QUERY_KEY = ["order-tokens"] as const;

async function fetchOrderTokens(): Promise<OrderToken[]> {
  try {
    const { data } = await httpClient.get<any>("/order-tokens");
    const serverTokens = data.data || [];
    const mapped: OrderToken[] = serverTokens.map((token: any) => ({
      id: token.id,
      tableNumber: token.table_number,
      status: token.status,
      paymentMethod: token.payment_method,
      amountPaid: token.amount_paid,
      createdAt: token.created_at,
      updatedAt: token.created_at,
      fulfilledAt: token.fulfilled_at,
      syncedAt: Date.now(),
      chefName: token.chef_name,
      chefStatus: token.chef_status,
    }));
    // Bulk write to Dexie cache
    await orderTokenRepository.saveMany(mapped);
  } catch (e) {
    console.error("Fetch order tokens API error:", e);
  }

  // Always query Dexie cache as Single Source of Truth
  return orderTokenRepository.findAll();
}

export function useOrderTokens(options?: any) {
  return useQuery<OrderToken[], Error>({
    queryKey: ORDER_TOKENS_QUERY_KEY,
    queryFn: fetchOrderTokens,
    staleTime: 1000 * 60 * 5, // 5 min default staleTime
    ...options,
  });
}
