"use client";

import { useQuery } from "@tanstack/react-query";
import { orderRepository } from "@/infrastructure/db/order-repository";
import { httpClient } from "@/infrastructure/http/axios-client";
import type { Order } from "@/domain/models/order";

export const ORDERS_QUERY_KEY = ["orders"] as const;

async function fetchOrders(): Promise<Order[]> {
  try {
    const { data } = await httpClient.get<any>("/orders");
    const serverOrders = data.data || [];
    const mapped: Order[] = serverOrders.map((order: any) => ({
      id: order.id,
      tokenId: order.token_id,
      tableNumber: order.table_number,
      items: order.items.map((it: any) => ({
        itemId: it.item_id,
        name: it.name,
        price: it.price || 0,
        quantity: it.quantity || 0,
        note: it.note || "",
      })),
      createdAt: order.created_at,
      updatedAt: order.created_at,
      syncedAt: Date.now(),
    }));
    // Bulk write to Dexie cache
    await orderRepository.saveMany(mapped);
  } catch (e) {
    console.error("Fetch orders API error:", e);
  }

  // Always query Dexie cache as Single Source of Truth
  return orderRepository.findAll();
}

export function useOrders(options?: any) {
  return useQuery<Order[], Error>({
    queryKey: ORDERS_QUERY_KEY,
    queryFn: fetchOrders,
    staleTime: 1000 * 60 * 5, // 5 min default staleTime
    ...options,
  });
}
