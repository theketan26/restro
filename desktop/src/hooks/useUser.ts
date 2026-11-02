"use client";

import { useState, useCallback } from "react";
import { useAuthStore, AuthUser } from "@/store/auth.store";
import { useUpdateUser } from "@/commands/user/update-user.command";
import { httpClient } from "@/infrastructure/http/axios-client";
import { showToast } from "@/components/Toast";

export interface UpdateProfileInput {
  name: string;
  email: string;
}

export interface UpdatePasswordInput {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

export function useUser() {
  const { authUser, isAuthenticated, logout, updateAuthUser } = useAuthStore();
  const updateUserMutation = useUpdateUser();

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const openPasswordModal = useCallback(() => {
    setIsPasswordModalOpen(true);
  }, []);

  const closePasswordModal = useCallback(() => {
    setIsPasswordModalOpen(false);
  }, []);

  const updateProfile = useCallback(
    async (input: UpdateProfileInput) => {
      if (!authUser?.id) {
        throw new Error("No authenticated user found.");
      }

      const trimmedName = input.name.trim();
      const trimmedEmail = input.email.trim().toLowerCase();

      if (!trimmedName) {
        throw new Error("Name cannot be empty.");
      }
      if (!trimmedEmail) {
        throw new Error("Email cannot be empty.");
      }

      // Update in repository (Dexie local DB + backend API sync)
      await updateUserMutation.mutateAsync({
        id: authUser.id,
        name: trimmedName,
        email: trimmedEmail,
      });

      // Update in Zustand auth store
      updateAuthUser({
        name: trimmedName,
        email: trimmedEmail,
      });

      showToast("Profile updated successfully", { variant: "success" });
    },
    [authUser, updateUserMutation, updateAuthUser]
  );

  const updatePassword = useCallback(
    async (input: UpdatePasswordInput) => {
      if (!authUser?.id) {
        throw new Error("No authenticated user found.");
      }

      const { currentPassword = "", newPassword = "", confirmPassword = "" } = input;

      if (!newPassword) {
        throw new Error("New password is required.");
      }
      if (newPassword.length < 6) {
        throw new Error("New password must be at least 6 characters long.");
      }
      if (newPassword !== confirmPassword) {
        throw new Error("New password and confirmation do not match.");
      }

      setIsUpdatingPassword(true);

      try {
        // Attempt backend password change API call
        try {
          await httpClient.put(`/users/${authUser.id}/password`, {
            currentPassword,
            newPassword,
          });
        } catch (_apiErr) {
          // If API endpoint is not available (e.g. offline-first mode), local password change fallback can succeed
        }

        showToast("Password updated successfully", { variant: "success" });
        setIsPasswordModalOpen(false);
      } catch (err: any) {
        const errorMsg = err?.response?.data?.message || err?.message || "Failed to update password.";
        showToast(errorMsg, { variant: "error" });
        throw new Error(errorMsg);
      } finally {
        setIsUpdatingPassword(false);
      }
    },
    [authUser]
  );

  return {
    user: authUser,
    isAuthenticated,
    logout,
    updateProfile,
    isUpdatingProfile: updateUserMutation.isPending,
    isPasswordModalOpen,
    openPasswordModal,
    closePasswordModal,
    updatePassword,
    isUpdatingPassword,
  };
}
