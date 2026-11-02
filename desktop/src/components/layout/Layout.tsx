"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";
import { useUIStore } from "@/store/ui.store";
import { useAuthStore } from "@/store/auth.store";
import LoginPage from "@/components/auth/LoginPage";
import SetupPage from "@/components/auth/SetupPage";
import { userRepository } from "@/infrastructure/db/user-repository";
import { httpClient } from "@/infrastructure/http/axios-client";
import { BiHome, BiFoodMenu, BiReceipt, BiDevices, BiLogOut, BiUserCircle } from "react-icons/bi";
import { CiHome, CiSettings, CiUser } from "react-icons/ci";
import { Text } from "../Text";
import { Button } from "../Button";
import { UserRoles } from "@/types/userRoles";
import { useUsers } from "@/queries/user/use-users.query";

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

const transition = { duration: 0.2, ease: "easeInOut" as const };

const NAV_LINKS = [
  { href: "/", label: "Home", icon: <CiHome className="h-full w-full" /> },
  { href: "/items", label: "Menu Items", icon: <BiFoodMenu className="h-full w-full" /> },
  { href: "/orders", label: "Orders", icon: <BiReceipt className="h-full w-full" /> },
  { href: "/devices", label: "Devices", icon: <BiDevices className="h-full w-full" /> },
  { href: "/users", label: "Users", icon: <CiUser className="h-full w-full" /> },
  { href: "/account", label: "Account", icon: <BiUserCircle className="h-full w-full" /> },
  { href: "/settings", label: "Settings", icon: <CiSettings className="h-full w-full" /> },
];

export default function Layout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const {
    isSidebarOpen,
    toggleSidebar,
    theme,
    setTheme,
    userRole,
    setUserRole,
    activeChefId,
    setActiveChefId,
    isSetupCompleted,
    setSetupCompleted,
    masterName,
    setMasterName
  } = useUIStore();

  const { isAuthenticated, authUser, logout } = useAuthStore();

  const { data: chefsData } = useUsers(
    { role: "chef", status: "active" },
    { enabled: userRole === UserRoles.chef }
  );
  const chefs = chefsData?.users || [];

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  // Non-blocking background sync for setup status & master name with server
  useEffect(() => {
    let active = true;
    httpClient
      .get("/setup/status", { timeout: 3000 })
      .then(({ data }) => {
        if (!active || !data?.data) return;
        if (data.data.master_name) {
          setMasterName(data.data.master_name);
        }
        const serverComplete = Boolean(data.data.setup_completed && data.data.has_admin);
        setSetupCompleted(serverComplete);
      })
      .catch(() => { });

    return () => {
      active = false;
    };
  }, []);

  // Sync cookie with store state on mount/hydration
  useEffect(() => {
    const activeRole = !userRole || userRole === "undefined" || userRole === "null" ? "admin" : userRole;
    document.cookie = `user-role=${activeRole}; path=/; max-age=604800`;
  }, [userRole]);

  // If application is not set up, display Setup screen immediately
  if (!isSetupCompleted) {
    return (
      <SetupPage
        onSetupComplete={(newMasterName) => {
          setMasterName(newMasterName);
          setSetupCompleted(true);
        }}
      />
    );
  }

  // If user is not authenticated, display the login screen
  if (!isAuthenticated) {
    return <LoginPage masterName={masterName} />;
  }

  const getCurrentPageLabel = () => {
    const currentLink = NAV_LINKS.find((link) => link.href === pathname);
    return currentLink ? currentLink.label : "Page";
  };

  return (
    <div
      className={`flex h-screen overflow-hidden transition-colors duration-200 bg-tertiary-100 text-primary-900 dark:bg-primary-950 dark:text-tertiary-100 ${theme === "dark" ? "dark" : ""}`}
    >
      {/* Sidebar */}
      <motion.aside
        animate={{ width: isSidebarOpen ? 240 : 60 }}
        transition={transition}
        className="overflow-hidden transition-colors duration-200 bg-tertiary-50 text-primary-900 border-r border-tertiary-200/50 dark:bg-primary-900 dark:text-tertiary-100 dark:border-primary-800/40 flex-shrink-0 flex flex-col justify-between"
      >
        <nav className="p-4 space-y-3 w-full">
          <div className="flex items-center justify-between mb-8">
            {
              isSidebarOpen &&
              <span className="pl-3 font-semibold text-lg text-primary-900 dark:text-tertiary-100 truncate">
                {masterName}
              </span>
            }

            {/* Hamburger toggle */}
            <Button
              onClick={toggleSidebar}
              variant="ghost"
              className="p-1.5 rounded-lg"
              aria-label="Toggle sidebar"
            >
              <span className="block w-4 h-0.5 bg-current mb-1" />
              <span className="block w-4 h-0.5 bg-current mb-1" />
              <span className="block w-4 h-0.5 bg-current" />
            </Button>
          </div>
          {NAV_LINKS.filter(({ href }) => {
            const activeRole = !userRole || userRole === "undefined" || userRole === "null" ? "admin" : userRole;
            if (href === "/users") {
              return activeRole === "admin" || activeRole === "manager";
            }
            if (href === "/items") {
              return activeRole === "admin" || activeRole === "manager" || activeRole === "chef";
            }
            if (href === "/orders") {
              return activeRole === "admin" || activeRole === "manager" || activeRole === "chef" || activeRole === "waiter";
            }
            return true;
          }).map(({ href, label, icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2 rounded-xl text-sm transition-colors ${pathname === href
                ? "bg-tertiary-200/70 text-primary-900 dark:bg-primary-800 dark:text-tertiary-100"
                : "text-primary-700 hover:bg-tertiary-100/80 dark:text-primary-300 dark:hover:bg-primary-800/60 dark:hover:text-tertiary-100"
                } ${isSidebarOpen ? "px-3 py-2.5" : "p-1.5"
                }`}
            >
              <div className="h-5 w-5">
                {icon}
              </div>
              {
                isSidebarOpen &&
                <span>
                  {label}
                </span>
              }
            </Link>
          ))}

          {/* Theme toggle */}
          {/* <div className="pt-4 border-t border-tertiary-200/50 dark:border-primary-800/40">
            <Button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              variant="secondary"
              className="w-full text-xs px-2.5 py-2 flex items-center justify-center gap-1.5 font-medium border border-primary-300/50 dark:border-primary-800/80"
            >
              {theme === "dark" ? "☀️ Light" : "🌙 Dark"}
            </Button>
          </div> */}
        </nav>

        {/* Sidebar Footer / User Account */}
        <div className="p-3 border-t border-tertiary-200/50 dark:border-primary-800/40 bg-tertiary-100/40 dark:bg-primary-950/40">
          <div className="flex items-center justify-between gap-2">
            {isSidebarOpen ? (
              <Link href="/account" className="flex items-center gap-2 min-w-0 hover:opacity-80 transition-opacity">
                <BiUserCircle className="w-7 h-7 text-indigo-500 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold truncate text-neutral-800 dark:text-neutral-200">
                    {authUser?.name || "User"}
                  </p>
                  <p className="text-[10px] text-neutral-500 dark:text-neutral-400 capitalize truncate">
                    {authUser?.role || userRole}
                  </p>
                </div>
              </Link>
            ) : null}
            <button
              onClick={logout}
              title="Sign Out"
              className="p-2 rounded-xl text-red-500 hover:bg-red-500/10 transition-colors flex items-center justify-center shrink-0"
            >
              <BiLogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </motion.aside>

      {/* Main area */}
      <div className="flex flex-col flex-1 min-w-0">
        <header className="border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between px-6 py-4 flex-shrink-0 bg-transparent">
          <Text className="font-semibold text-lg">
            {getCurrentPageLabel()}
          </Text>
          <div className="flex items-center gap-3">
            {userRole === UserRoles.chef && (
              <>
                <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Chef Profile:</span>
                <select
                  value={activeChefId || ""}
                  onChange={(e) => setActiveChefId(e.target.value || null)}
                  className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3 py-1.5 text-xs text-neutral-800 dark:text-neutral-200 font-medium outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">-- Select Chef --</option>
                  {chefs.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </>
            )}
          </div>

          {/* Theme toggle */}
          <div className="">
            <Button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              variant="secondary"
              className="w-full text-xs px-2.5 py-2 flex items-center justify-center gap-1.5 font-medium border border-primary-300/50 dark:border-primary-800/80"
            >
              {theme === "dark" ? "☀️ Light" : "🌙 Dark"}
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-transparent">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={transition}
              className="h-full p-6"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

