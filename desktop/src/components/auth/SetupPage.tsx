"use client";

import React, { useState } from "react";
import { useAuthStore } from "@/store/auth.store";
import { useUIStore } from "@/store/ui.store";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { userRepository } from "@/infrastructure/db/user-repository";
import { httpClient } from "@/infrastructure/http/axios-client";
import { UserRoles } from "@/types/userRoles";
import { v4 as uuidv4 } from "uuid";
import { 
  BiEnvelope, 
  BiLockAlt, 
  BiRestaurant,
  BiErrorCircle,
  BiSun,
  BiMoon,
  BiUser,
  BiStore
} from "react-icons/bi";

import { clearAllLocalData } from "@/infrastructure/db/db";

interface SetupPageProps {
  onSetupComplete: (masterName: string) => void;
}

export default function SetupPage({ onSetupComplete }: SetupPageProps) {
  const [masterName, setMasterName] = useState("");
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const { theme, setTheme, setUserRole, setSetupCompleted, setMasterName: storeSetMasterName } = useUIStore();

  React.useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  const validate = () => {
    const errors: Record<string, string> = {};

    if (!masterName.trim()) {
      errors.masterName = "Master Name / Business Name is required";
    }

    if (!adminName.trim()) {
      errors.adminName = "Admin Full Name is required";
    }

    if (!adminEmail.trim()) {
      errors.adminEmail = "Admin Email is required";
    } else if (!/\S+@\S+\.\S+/.test(adminEmail.trim())) {
      errors.adminEmail = "Please enter a valid email address";
    }

    if (!password) {
      errors.password = "Password is required";
    } else if (password.length < 4) {
      errors.password = "Password must be at least 4 characters long";
    }

    if (password !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validate()) return;

    setIsSubmitting(true);

    const cleanMasterName = masterName.trim();
    const cleanAdminName = adminName.trim();
    const cleanAdminEmail = adminEmail.trim().toLowerCase();

    try {
      // 0. Wipe old local data from previous runs/seeding
      await clearAllLocalData();

      let createdUserId = uuidv4();

      // 1. Attempt API Setup call
      try {
        const { data } = await httpClient.post("/setup", {
          master_name: cleanMasterName,
          admin_name: cleanAdminName,
          admin_email: cleanAdminEmail,
          admin_password: password,
        });

        if (data?.data?.id) {
          createdUserId = data.data.id;
        }
      } catch (apiErr) {
        console.warn("API setup endpoint unavailable, completing offline setup in Dexie cache...", apiErr);
        try {
          await httpClient.post("/settings/master-name", { master_name: cleanMasterName });
        } catch (_) {}
      }

      // 2. Save Admin user to local Dexie database with password
      const now = Date.now();
      const adminUser = {
        id: createdUserId,
        name: cleanAdminName,
        email: cleanAdminEmail,
        password: password,
        role: UserRoles.admin,
        active: true,
        createdAt: now,
        updatedAt: now,
        syncedAt: now,
      };
      await userRepository.save(adminUser);

      // 3. Set UI Store state and Auth state
      storeSetMasterName(cleanMasterName);
      setSetupCompleted(true);
      setUserRole(UserRoles.admin);

      useAuthStore.setState({
        isAuthenticated: true,
        authUser: {
          id: adminUser.id,
          name: adminUser.name,
          email: adminUser.email,
          role: UserRoles.admin,
        },
        isLoading: false,
        error: null,
      });

      onSetupComplete(cleanMasterName);
    } catch (err: any) {
      setError(err?.message || "Failed to complete setup. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 p-4 relative overflow-hidden select-none transition-colors duration-200">
      {/* Background aesthetics */}
      <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-indigo-600/10 dark:bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-5%] w-96 h-96 bg-emerald-600/10 dark:bg-emerald-600/20 rounded-full blur-3xl pointer-events-none" />

      {/* Theme Toggle Button */}
      <div className="absolute top-6 right-6">
        <Button
          type="button"
          variant="secondary"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="!bg-white/80 hover:!bg-neutral-100 dark:!bg-neutral-800/80 dark:hover:!bg-neutral-700/80 border border-neutral-300/60 dark:border-neutral-700/60 text-xs px-3 py-2 flex items-center gap-2 rounded-xl text-neutral-800 dark:text-neutral-300 transition-colors duration-200"
        >
          {theme === "dark" ? <BiSun className="w-4 h-4 text-amber-500" /> : <BiMoon className="w-4 h-4 text-indigo-500" />}
          <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
        </Button>
      </div>

      {/* Main Setup Card */}
      <div className="w-full max-w-lg bg-white/90 dark:bg-neutral-950/80 backdrop-blur-xl border border-neutral-200 dark:border-neutral-800 rounded-3xl p-8 shadow-2xl relative z-10 space-y-6 transition-colors duration-200">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 mb-2">
            <BiRestaurant className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
            First-Time Setup
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto">
            Configure your application master name and register your primary Administrator account.
          </p>
        </div>

        {/* Global Error Alert */}
        {error && (
          <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-300 text-xs animate-fadeIn">
            <BiErrorCircle className="w-5 h-5 shrink-0 text-red-500 dark:text-red-400 mt-0.5" />
            <div className="leading-relaxed">{error}</div>
          </div>
        )}

        {/* Setup Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Master Name */}
          <div className="space-y-1">
            <Input
              label="Master Name / Restaurant Name"
              type="text"
              placeholder="e.g. Royal Restaurant & Bar"
              value={masterName}
              onChange={(e) => {
                setMasterName(e.target.value);
                if (fieldErrors.masterName) setFieldErrors((prev) => ({ ...prev, masterName: "" }));
              }}
              leftIcon={<BiStore className="w-5 h-5 text-neutral-400" />}
              error={fieldErrors.masterName}
              autoFocus
              className="!bg-neutral-50 dark:!bg-neutral-900/90 !border-neutral-200 dark:!border-neutral-800 focus:!border-indigo-500 !text-neutral-900 dark:!text-white text-sm"
            />
          </div>

          {/* Admin Name */}
          <div className="space-y-1">
            <Input
              label="Admin Full Name"
              type="text"
              placeholder="e.g. John Doe"
              value={adminName}
              onChange={(e) => {
                setAdminName(e.target.value);
                if (fieldErrors.adminName) setFieldErrors((prev) => ({ ...prev, adminName: "" }));
              }}
              leftIcon={<BiUser className="w-5 h-5 text-neutral-400" />}
              error={fieldErrors.adminName}
              className="!bg-neutral-50 dark:!bg-neutral-900/90 !border-neutral-200 dark:!border-neutral-800 focus:!border-indigo-500 !text-neutral-900 dark:!text-white text-sm"
            />
          </div>

          {/* Admin Email */}
          <div className="space-y-1">
            <Input
              label="Admin Email Address"
              type="email"
              placeholder="e.g. admin@restaurant.com"
              value={adminEmail}
              onChange={(e) => {
                setAdminEmail(e.target.value);
                if (fieldErrors.adminEmail) setFieldErrors((prev) => ({ ...prev, adminEmail: "" }));
              }}
              leftIcon={<BiEnvelope className="w-5 h-5 text-neutral-400" />}
              error={fieldErrors.adminEmail}
              className="!bg-neutral-50 dark:!bg-neutral-900/90 !border-neutral-200 dark:!border-neutral-800 focus:!border-indigo-500 !text-neutral-900 dark:!text-white text-sm"
            />
          </div>

          {/* Password & Confirm Password */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Admin Password"
              type="password"
              placeholder="Min 4 characters"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: "" }));
              }}
              leftIcon={<BiLockAlt className="w-5 h-5 text-neutral-400" />}
              error={fieldErrors.password}
              className="!bg-neutral-50 dark:!bg-neutral-900/90 !border-neutral-200 dark:!border-neutral-800 focus:!border-indigo-500 !text-neutral-900 dark:!text-white text-sm"
            />

            <Input
              label="Confirm Password"
              type="password"
              placeholder="Repeat password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (fieldErrors.confirmPassword) setFieldErrors((prev) => ({ ...prev, confirmPassword: "" }));
              }}
              leftIcon={<BiLockAlt className="w-5 h-5 text-neutral-400" />}
              error={fieldErrors.confirmPassword}
              className="!bg-neutral-50 dark:!bg-neutral-900/90 !border-neutral-200 dark:!border-neutral-800 focus:!border-indigo-500 !text-neutral-900 dark:!text-white text-sm"
            />
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold shadow-lg shadow-indigo-600/25 transition-all duration-200 flex items-center justify-center gap-2 mt-4"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Initializing System...</span>
              </>
            ) : (
              <span>Complete Setup & Launch Application</span>
            )}
          </Button>
        </form>

        {/* Footer Note */}
        <div className="text-center text-[11px] text-neutral-500 dark:text-neutral-400 pt-2 border-t border-neutral-200 dark:border-neutral-800/60">
          Stackrise Enterprise &bull; System Initialization Step
        </div>
      </div>
    </div>
  );
}
