"use client";

import React, { useState } from "react";
import { useAuthStore } from "@/store/auth.store";
import { useUIStore } from "@/store/ui.store";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { 
  BiEnvelope, 
  BiLockAlt, 
  BiRestaurant,
  BiErrorCircle,
  BiSun,
  BiMoon
} from "react-icons/bi";

export default function LoginPage({ masterName }: { masterName?: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  const { login, isLoading, error, clearError } = useAuthStore();
  const { theme, setTheme } = useUIStore();

  React.useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  const validate = () => {
    const errors: { email?: string; password?: string } = {};
    if (!email.trim()) {
      errors.email = "Email address is required";
    } else if (!/\S+@\S+\.\S+/.test(email.trim())) {
      errors.email = "Please enter a valid email address";
    }

    if (!password) {
      errors.password = "Password is required";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!validate()) return;

    await login(email, password);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 p-4 relative overflow-hidden select-none transition-colors duration-200">
      {/* Background aesthetics */}
      <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-indigo-600/10 dark:bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-5%] w-96 h-96 bg-purple-600/10 dark:bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

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

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-white/90 dark:bg-neutral-950/80 backdrop-blur-xl border border-neutral-200 dark:border-neutral-800 rounded-3xl p-8 shadow-2xl relative z-10 space-y-6 transition-colors duration-200">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 mb-2">
            <BiRestaurant className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
            {masterName || "Stackrise Desktop"}
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Sign in to access restaurant management
          </p>
        </div>

        {/* Global Error Alert */}
        {error && (
          <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-300 text-xs animate-fadeIn">
            <BiErrorCircle className="w-5 h-5 shrink-0 text-red-500 dark:text-red-400 mt-0.5" />
            <div className="leading-relaxed">{error}</div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Input
              label="Email Address"
              type="email"
              placeholder="e.g. user@resto.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: undefined }));
              }}
              leftIcon={<BiEnvelope className="w-5 h-5 text-neutral-400" />}
              error={fieldErrors.email}
              autoComplete="email"
              autoFocus
              className="!bg-neutral-50 dark:!bg-neutral-900/90 !border-neutral-200 dark:!border-neutral-800 focus:!border-indigo-500 !text-neutral-900 dark:!text-white text-sm"
            />
          </div>

          <div className="space-y-1">
            <Input
              label="Password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: undefined }));
              }}
              leftIcon={<BiLockAlt className="w-5 h-5 text-neutral-400" />}
              error={fieldErrors.password}
              autoComplete="current-password"
              className="!bg-neutral-50 dark:!bg-neutral-900/90 !border-neutral-200 dark:!border-neutral-800 focus:!border-indigo-500 !text-neutral-900 dark:!text-white text-sm"
            />
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold shadow-lg shadow-indigo-600/25 transition-all duration-200 flex items-center justify-center gap-2 mt-2"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Authenticating...</span>
              </>
            ) : (
              <span>Sign In to Desktop</span>
            )}
          </Button>
        </form>

        {/* Footer Note */}
        <div className="text-center text-[11px] text-neutral-500 dark:text-neutral-400 pt-2 border-t border-neutral-200 dark:border-neutral-800/60">
          Resto Application Security System &bull; Requires Login Every Launch
        </div>
      </div>
    </div>
  );
}


