"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { userRepository } from "@/infrastructure/db/user-repository";
import { httpClient } from "@/infrastructure/http/axios-client";
import { USERS_QUERY_KEY } from "@/queries/user/use-users.query";

async function deleteUser(id: string): Promise<string> {
  await userRepository.delete(id);

  // Await DELETE request sync (with catch to fallback to offline mode)
  try {
    await httpClient.delete(`/users/${id}`);
  } catch (err) {
    console.error("Failed to sync delete user", err);
  }

  return id;
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      // Refetch
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
    },
  });
}
