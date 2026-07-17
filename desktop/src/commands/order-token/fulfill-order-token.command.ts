"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { v4 as uuidv4 } from "uuid";
import { orderTokenRepository } from "@/infrastructure/db/order-token-repository";
import { httpClient } from "@/infrastructure/http/axios-client";
import type { FulfillTokenInput, OrderToken } from "@/domain/models/order";
import { ORDERS_QUERY_KEY } from "@/queries/order/use-orders.query";
import { ORDER_TOKENS_QUERY_KEY } from "@/queries/order-token/use-order-tokens.query";

async function fulfillOrderToken(input: FulfillTokenInput): Promise<OrderToken> {
  const { tokenId, paymentMethod, amountPaid } = input;
  const now = Date.now();

  const token = await orderTokenRepository.findById(tokenId);
  if (!token) throw new Error("Order token not found");

  const tableNumber = token.tableNumber;

  // 1. Update existing token status to fulfilled
  const updatedToken: OrderToken = {
    ...token,
    status: "fulfilled",
    paymentMethod,
    amountPaid,
    fulfilledAt: now,
    updatedAt: now,
  };

  await orderTokenRepository.save(updatedToken);

  // Sync token fulfillment to server in background
  httpClient
    .post(`/order-tokens/${tokenId}/fulfill`, {
      payment_method: paymentMethod,
      amount_paid: amountPaid,
    })
    .then(async ({ data }) => {
      const serverToken = data.data;
      if (serverToken) {
        await orderTokenRepository.update(tokenId, { syncedAt: Date.now() });
      }
    })
    .catch((err) => {
      console.error("Failed to sync fulfilled token", err);
    });

  // 2. Automatically create a *new active token* for the same table immediately after fulfilling
  const newToken: OrderToken = {
    id: uuidv4(),
    tableNumber,
    status: "active",
    createdAt: now + 1,
    updatedAt: now + 1,
  };

  await orderTokenRepository.save(newToken);

  // Sync new token to server in background
  httpClient
    .post("/order-tokens", {
      id: newToken.id,
      table_number: newToken.tableNumber,
      status: newToken.status,
      created_at: newToken.createdAt,
    })
    .then(async ({ data }) => {
      const serverToken = data.data;
      if (serverToken) {
        await orderTokenRepository.update(newToken.id, { syncedAt: Date.now() });
      }
    })
    .catch((err) => {
      console.error("Failed to sync new token after fulfillment", err);
    });

  return updatedToken;
}

export function useFulfillOrderToken() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: fulfillOrderToken,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ORDERS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ORDER_TOKENS_QUERY_KEY });
    },
  });
}
