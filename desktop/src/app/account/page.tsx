"use client";

import { useState, useEffect } from "react";
import { useUser } from "@/hooks/useUser";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { Text } from "@/components/Text";
import { UpdatePasswordModal } from "@/components/Modals/UpdatePasswordModal";
import { BiUserCircle, BiKey, BiShieldQuarter, BiCheckCircle } from "react-icons/bi";

export default function AccountPage() {
  const {
    user,
    updateProfile,
    isUpdatingProfile,
    isPasswordModalOpen,
    openPasswordModal,
    closePasswordModal,
    updatePassword,
    isUpdatingPassword,
  } = useUser();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
    }
  }, [user]);

  const handleSubmitProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      await updateProfile({ name, email });
    } catch (err: any) {
      setError(err?.message || "Failed to update profile details.");
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Text className="text-neutral-500">Loading account details...</Text>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header card */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-2xl uppercase shadow-inner">
            {user.name ? user.name.charAt(0) : <BiUserCircle className="w-10 h-10" />}
          </div>
          <div>
            <h1 className="text-xl font-bold text-neutral-900 dark:text-white">
              {user.name}
            </h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              {user.email}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800">
                <BiShieldQuarter className="w-3.5 h-3.5 mr-1" />
                {user.role}
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/50">
                <BiCheckCircle className="w-3.5 h-3.5 mr-1 text-emerald-500" />
                Active Account
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Personal details form */}
        <div className="lg:col-span-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-sm space-y-6">
          <div>
            <h2 className="text-base font-bold text-neutral-900 dark:text-white">
              Personal Information
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Update your account display name and contact email.
            </p>
          </div>

          <form onSubmit={handleSubmitProfile} className="space-y-4">
            <Input
              label="Full Name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Jane Doe"
              disabled={isUpdatingProfile}
              variant="outlined"
              colorScheme="indigo"
              required
            />

            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="username@example.com"
              disabled={isUpdatingProfile}
              variant="outlined"
              colorScheme="indigo"
              required
            />

            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                Role
              </label>
              <input
                type="text"
                value={user.role}
                disabled
                className="w-full rounded-xl border border-neutral-200 bg-neutral-100 px-4 py-2.5 text-sm font-medium text-neutral-600 dark:border-neutral-800 dark:bg-neutral-800/60 dark:text-neutral-400 capitalize cursor-not-allowed"
              />
              <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-1">
                Roles can only be altered by an administrator in the Users section.
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600 dark:bg-red-950/30 dark:border-red-900/50 dark:text-red-400">
                {error}
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <Button
                type="submit"
                disabled={isUpdatingProfile}
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-5 py-2.5 text-sm font-medium transition shadow-sm"
              >
                {isUpdatingProfile ? "Saving..." : "Save Profile Details"}
              </Button>
            </div>
          </form>
        </div>

        {/* Security / Password section */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between space-y-6">
          <div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-4">
              <BiKey className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-neutral-900 dark:text-white">
              Security & Credentials
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed">
              Keep your account secure by using a strong password and updating it periodically.
            </p>
          </div>

          <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800">
            <Button
              onClick={openPasswordModal}
              variant="secondary"
              className="w-full flex items-center justify-center gap-2 border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200 rounded-xl py-2.5 text-sm font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800 transition"
            >
              <BiKey className="w-4 h-4 text-indigo-500" />
              Change Password
            </Button>
          </div>
        </div>
      </div>

      {/* Password Update Modal */}
      <UpdatePasswordModal
        visible={isPasswordModalOpen}
        onClose={closePasswordModal}
        onSubmit={updatePassword}
        isLoading={isUpdatingPassword}
      />
    </div>
  );
}
