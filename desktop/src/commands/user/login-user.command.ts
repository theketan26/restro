"use client";

import { useMutation } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth.store";

export interface LoginCredentials {
  email: string;
  password: string;
}

export function useLoginUser() {
  const login = useAuthStore((state) => state.login);

  return useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const result = await login(credentials.email, credentials.password);
      if (!result.success) {
        throw new Error(result.error || "Login failed");
      }
      return result;
    },
  });
}
