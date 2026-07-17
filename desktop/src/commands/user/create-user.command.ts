"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { v4 as uuidv4 } from "uuid";
import { userRepository } from "@/infrastructure/db/user-repository";
import { httpClient } from "@/infrastructure/http/axios-client";
import type { CreateUserInput, User } from "@/domain/models/user";
import { USERS_QUERY_KEY } from "@/queries/user/use-users.query";

/**
 * Command side of CQRS:
 *  1. Write to local Dexie immediately so the UI responds without network.
 *  2. Fire background sync to the API; mark syncedAt on success.
 *  3. Failed syncs are left with syncedAt=undefined for a background sweep.
 */
async function createUser(input: CreateUserInput): Promise<User> {
  const now = Date.now();
  const user: User = {
    id: uuidv4(),
    ...input,
    active: input.active !== false,
    createdAt: now,
    updatedAt: now,
  };

  await userRepository.save(user);

  // Best-effort background sync — does not block the command
  httpClient
    .post<any>("/users", { name: user.name, email: user.email, role: user.role, active: user.active })
    .then(async ({ data }) => {
      const serverUser = data.data;
      if (!serverUser) throw new Error("No user returned from server");

      // Delete the local temporary user
      await userRepository.delete(user.id);
      // Save the server confirmed user with server ID and converted timestamp
      await userRepository.save({
        id: serverUser.id,
        name: serverUser.name,
        email: serverUser.email,
        role: serverUser.role,
        active: serverUser.active !== false,
        createdAt: serverUser.created_at ? Date.parse(serverUser.created_at) : now,
        updatedAt: serverUser.created_at ? Date.parse(serverUser.created_at) : now,
        syncedAt: Date.now(),
      });
    })
    .catch((err) => {
      console.error("Failed to sync created user", err);
    });

  return user;
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      // Force database reload from server to sync state
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
    },
  });
}
