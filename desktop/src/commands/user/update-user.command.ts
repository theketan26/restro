"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { userRepository } from "@/infrastructure/db/user-repository";
import { httpClient } from "@/infrastructure/http/axios-client";
import type { UpdateUserInput, User } from "@/domain/models/user";
import { USERS_QUERY_KEY } from "@/queries/user/use-users.query";

async function updateUser(input: UpdateUserInput): Promise<User> {
  const { id, ...data } = input;
  await userRepository.update(id, data);

  // Await PUT request sync (with catch to fallback to offline mode)
  try {
    const response = await httpClient.put<any>(`/users/${id}`, data);
    const serverUser = response.data?.data;
    if (serverUser) {
      await userRepository.update(id, {
        syncedAt: Date.now(),
        name: serverUser.name || data.name,
        email: serverUser.email || data.email,
        role: serverUser.role || data.role,
        active: serverUser.active !== undefined ? serverUser.active : data.active,
      });
    } else {
      await userRepository.update(id, { syncedAt: Date.now() });
    }
  } catch (err) {
    console.error("Failed to sync update user", err);
  }

  const user = await userRepository.findById(id);
  if (!user) throw new Error("User not found");
  return user;
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateUser,
    onSuccess: () => {
      // Refetch
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
    },
  });
}
