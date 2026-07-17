"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { v4 as uuidv4 } from "uuid";
import { orderRepository } from "@/infrastructure/db/order-repository";
import { orderTokenRepository } from "@/infrastructure/db/order-token-repository";
import { httpClient } from "@/infrastructure/http/axios-client";
import type { CreateOrderInput, Order, OrderToken } from "@/domain/models/order";
import { ORDERS_QUERY_KEY } from "@/queries/order/use-orders.query";
import { ORDER_TOKENS_QUERY_KEY } from "@/queries/order-token/use-order-tokens.query";

async function createOrder(input: CreateOrderInput): Promise<Order> {
  const now = Date.now();
  const { tableNumber, items } = input;

  // 1. Find or create an active token for this table
  let activeToken = await orderTokenRepository.findActiveByTable(tableNumber);
  let tokenId = "";

  if (activeToken) {
    tokenId = activeToken.id;
  } else {
    // Create new token
    const token: OrderToken = {
      id: uuidv4(),
      tableNumber,
      status: "active",
      createdAt: now,
      updatedAt: now,
    };
    tokenId = token.id;
    await orderTokenRepository.save(token);

    // Sync token to server in background
    httpClient
      .post("/order-tokens", {
        id: token.id,
        table_number: token.tableNumber,
        status: token.status,
        created_at: token.createdAt,
      })
      .then(async ({ data }) => {
        const serverToken = data.data;
        if (serverToken) {
          await orderTokenRepository.update(token.id, { syncedAt: Date.now() });
        }
      })
      .catch((err) => {
        console.error("Failed to sync created token", err);
      });
  }

  // 2. Create and save the Order linked to the token
  const order: Order = {
    id: uuidv4(),
    tokenId,
    tableNumber,
    items,
    createdAt: now,
    updatedAt: now,
  };

  await orderRepository.save(order);

  // Sync order to server in background
  httpClient
    .post("/orders", {
      id: order.id,
      token_id: order.tokenId,
      table_number: order.tableNumber,
      items: order.items.map((it) => ({
        item_id: it.itemId,
        name: it.name,
        price: it.price,
        quantity: it.quantity,
        note: it.note || "",
      })),
      created_at: order.createdAt,
    })
    .then(async ({ data }) => {
      const serverOrder = data.data;
      if (serverOrder) {
        await orderRepository.update(order.id, { syncedAt: Date.now() });
      }
    })
    .catch((err) => {
      console.error("Failed to sync created order", err);
    });

  return order;
}

export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ORDERS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ORDER_TOKENS_QUERY_KEY });
    },
  });
}
