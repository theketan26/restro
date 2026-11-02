import { create } from "zustand";
import { UserRoles } from "@/types/userRoles";
import { useUIStore } from "@/store/ui.store";
import { userRepository } from "@/infrastructure/db/user-repository";
import { httpClient } from "@/infrastructure/http/axios-client";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRoles;
}

interface AuthState {
  isAuthenticated: boolean;
  authUser: AuthUser | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  clearError: () => void;
  updateAuthUser: (updates: Partial<AuthUser>) => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  // Memory-only auth state: Defaults to false on every application start/reload
  isAuthenticated: false,
  authUser: null,
  isLoading: false,
  error: null,

  clearError: () => set({ error: null }),

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedPassword) {
      const errorMsg = "Email and password are required.";
      set({ isLoading: false, error: errorMsg });
      return { success: false, error: errorMsg };
    }

    try {
      let matchedUser: AuthUser | null = null;

      // 1. Attempt API login
      try {
        const response = await httpClient.post("/auth/login", {
          email: trimmedEmail,
          password: trimmedPassword,
        });
        if (response.data?.data?.user) {
          const u = response.data.data.user;
          matchedUser = {
            id: u.id,
            name: u.name,
            email: u.email,
            role: u.role || UserRoles.admin,
          };
          if (response.data.data.token && typeof window !== "undefined") {
            localStorage.setItem("token", response.data.data.token);
          }
        }
      } catch (_apiErr) {
        // API endpoint may not exist yet or offline; fallback to local DB & pre-configured accounts
      }

      // 2. Fallback to local Dexie user database
      if (!matchedUser) {
        const allUsers = await userRepository.findAll();
        const found = allUsers.find(
          (u) => u.email.toLowerCase() === trimmedEmail && u.active !== false
        );

        if (found) {
          if (found.password && found.password !== trimmedPassword) {
            const errorMsg = "Invalid password. Please check your credentials and try again.";
            set({ isLoading: false, error: errorMsg });
            return { success: false, error: errorMsg };
          }

          matchedUser = {
            id: found.id,
            name: found.name,
            email: found.email,
            role: found.role,
          };
        }
      }

      // If user is not found in API or local DB, deny access
      if (!matchedUser) {
        const errorMsg = "Account not found. Only users added by an administrator can log in to the application.";
        set({ isLoading: false, error: errorMsg });
        return { success: false, error: errorMsg };
      }

      // 5. Successful login
      useUIStore.getState().setUserRole(matchedUser.role);
      if (typeof document !== "undefined") {
        document.cookie = `user-role=${matchedUser.role}; path=/; max-age=604800`;
      }

      set({
        isAuthenticated: true,
        authUser: matchedUser,
        isLoading: false,
        error: null,
      });

      return { success: true };
    } catch (err: any) {
      const errorMsg = err?.message || "An error occurred during login. Please try again.";
      set({ isLoading: false, error: errorMsg });
      return { success: false, error: errorMsg };
    }
  },

  logout: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
    }
    if (typeof document !== "undefined") {
      document.cookie = "user-role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }
    set({
      isAuthenticated: false,
      authUser: null,
      error: null,
    });
  },

  updateAuthUser: (updates: Partial<AuthUser>) => {
    set((state) => ({
      authUser: state.authUser ? { ...state.authUser, ...updates } : null,
    }));
  },
}));
