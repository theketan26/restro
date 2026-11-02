"use client";

import { useState, useEffect } from "react";
import Modal from "../Modal";
import { Input } from "../Input";
import { BiLockAlt } from "react-icons/bi";

interface UpdatePasswordModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: { currentPassword?: string; newPassword: string; confirmPassword: string }) => Promise<void>;
  isLoading?: boolean;
}

export function UpdatePasswordModal({
  visible,
  onClose,
  onSubmit,
  isLoading = false,
}: UpdatePasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setError(null);
    }
  }, [visible]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!newPassword) {
      setError("Please enter a new password.");
      return;
    }

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    setError(null);

    try {
      await onSubmit({
        currentPassword,
        newPassword,
        confirmPassword,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to update password. Please try again.");
    }
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title="Update Password"
      subtitle="Enter your new password details below."
      icon={<BiLockAlt className="w-6 h-6 text-indigo-500" />}
      color="indigo"
      primaryButtonDetails={{
        label: isLoading ? "Updating..." : "Update Password",
        onClick: handleSubmit,
        color: "indigo",
      }}
      secondaryButtonDetails={{
        label: "Cancel",
        onClick: onClose,
        color: "gray",
      }}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Current Password"
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          placeholder="Enter current password (if set)"
          disabled={isLoading}
          variant="outlined"
          colorScheme="indigo"
        />

        <Input
          label="New Password"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="At least 6 characters"
          disabled={isLoading}
          variant="outlined"
          colorScheme="indigo"
          required
        />

        <Input
          label="Confirm New Password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Re-enter new password"
          disabled={isLoading}
          variant="outlined"
          colorScheme="indigo"
          required
        />

        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600 dark:bg-red-950/30 dark:border-red-900/50 dark:text-red-400 flex items-start gap-2">
            <svg className="w-4 h-4 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{error}</span>
          </div>
        )}
      </form>
    </Modal>
  );
}
