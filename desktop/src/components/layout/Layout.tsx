"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode, useEffect } from "react";
import { useUIStore } from "@/store/ui.store";
import { BiHome, BiFoodMenu, BiReceipt } from "react-icons/bi";
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
  { href: "/users", label: "Users", icon: <CiUser className="h-full w-full" /> },
  { href: "/settings", label: "Settings", icon: <CiSettings className="h-full w-full" /> },
];

export default function Layout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { isSidebarOpen, toggleSidebar, theme, setTheme, userRole, setUserRole, activeChefId, setActiveChefId } = useUIStore();

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

  // Sync cookie with store state on mount/hydration
  useEffect(() => {
    const activeRole = !userRole || userRole === "undefined" || userRole === "null" ? "admin" : userRole;
    document.cookie = `user-role=${activeRole}; path=/; max-age=604800`;
  }, [userRole]);

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
        className="overflow-hidden transition-colors duration-200 bg-tertiary-50 text-primary-900 border-r border-tertiary-200/50 dark:bg-primary-900 dark:text-tertiary-100 dark:border-primary-800/40 flex-shrink-0"
      >
        <nav className="p-4 space-y-3 w-full">
          <div className="flex items-center justify-between mb-8">
            {
              isSidebarOpen &&
              <span className="pl-3 font-semibold text-lg text-primary-900 dark:text-tertiary-100">
                Restro
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
          <div className="pt-4 border-t border-tertiary-200/50 dark:border-primary-800/40">
            <Button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              variant="secondary"
              className="w-full text-xs px-2.5 py-2 flex items-center justify-center gap-1.5 font-medium border border-primary-300/50 dark:border-primary-800/80"
            >
              {theme === "dark" ? "☀️ Light" : "🌙 Dark"}
            </Button>
          </div>
        </nav>
      </motion.aside>

      {/* Main area */}
      <div className="flex flex-col flex-1 min-w-0">
        <header className="border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between px-6 py-4 flex-shrink-0 bg-transparent">
          <Text className="font-semibold text-lg">
            {getCurrentPageLabel()}
          </Text>
          <div className="flex items-center gap-2">
            {userRole === UserRoles.chef && (
              <>
                <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Chef Profile:</span>
                <select
                  value={activeChefId || ""}
                  onChange={(e) => setActiveChefId(e.target.value || null)}
                  className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3 py-1.5 text-xs text-neutral-800 dark:text-neutral-200 font-medium outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 mr-2"
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
            <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Active Role:</span>
            <select
              value={!userRole || userRole === "undefined" || userRole === "null" ? "admin" : userRole}
              onChange={(e) => setUserRole(e.target.value)}
              className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3 py-1.5 text-xs text-neutral-800 dark:text-neutral-200 font-medium outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value={UserRoles.admin}>Admin</option>
              <option value={UserRoles.manager}>Manager</option>
              <option value={UserRoles.chef}>Chef</option>
              <option value={UserRoles.waiter}>Waiter</option>
              <option value={UserRoles.customer}>Customer</option>
            </select>
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
