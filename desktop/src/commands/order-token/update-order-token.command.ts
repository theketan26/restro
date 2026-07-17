"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { orderTokenRepository } from "@/infrastructure/db/order-token-repository";
import { httpClient } from "@/infrastructure/http/axios-client";
import type { OrderToken } from "@/domain/models/order";
import { ORDER_TOKENS_QUERY_KEY } from "@/queries/order-token/use-order-tokens.query";

export interface UpdateOrderTokenChefInput {
  tokenId: string;
  chefName: string | null;
  chefStatus: "starting" | "cooking" | "completed" | null;
}

async function updateOrderTokenChef(input: UpdateOrderTokenChefInput): Promise<OrderToken> {
  const { tokenId, chefName, chefStatus } = input;

  const token = await orderTokenRepository.findById(tokenId);
  if (!token) throw new Error("Order token not found");

  const updatedToken: OrderToken = {
    ...token,
    chefName: chefName ?? undefined,
    chefStatus: chefStatus ?? undefined,
    updatedAt: Date.now(),
  };

  await orderTokenRepository.save(updatedToken);

  // Sync to server in background
  httpClient
    .put(`/order-tokens/${tokenId}`, {
      chef_name: chefName,
      chef_status: chefStatus,
    })
    .then(async ({ data }) => {
      const serverToken = data.data;
      if (serverToken) {
        await orderTokenRepository.update(tokenId, { syncedAt: Date.now() });
      }
    })
    .catch((err) => {
      console.error("Failed to sync updated token", err);
    });

  return updatedToken;
}

export function useUpdateOrderTokenChef() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateOrderTokenChef,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ORDER_TOKENS_QUERY_KEY });
    },
  });
}
