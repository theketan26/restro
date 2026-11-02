"use client";

import Link from "next/link";
import { 
  BiFoodMenu, 
  BiReceipt, 
  BiDevices, 
  BiUser, 
  BiCog,
  BiChevronRight
} from "react-icons/bi";

export default function HomePage() {
  const dashboardLinks = [
    {
      href: "/orders",
      label: "Active Orders",
      description: "Manage incoming customer orders, assign chefs, and track order fulfillment status.",
      icon: <BiReceipt className="w-6 h-6 text-indigo-500" />,
      color: "border-indigo-100 hover:border-indigo-300 dark:border-indigo-950 dark:hover:border-indigo-900/60"
    },
    {
      href: "/items",
      label: "Menu Items",
      description: "View, update, and manage your restaurant menu listings, prices, and availability.",
      icon: <BiFoodMenu className="w-6 h-6 text-emerald-500" />,
      color: "border-emerald-100 hover:border-emerald-305 dark:border-emerald-950 dark:hover:border-emerald-900/60"
    },
    {
      href: "/devices",
      label: "Devices",
      description: "Discover, authorize, and view connection status of local network companion devices.",
      icon: <BiDevices className="w-6 h-6 text-amber-500" />,
      color: "border-amber-100 hover:border-amber-305 dark:border-amber-950 dark:hover:border-amber-900/60"
    },
    {
      href: "/users",
      label: "Users & Staff",
      description: "Manage system access, active profiles, and staff assignments for different roles.",
      icon: <BiUser className="w-6 h-6 text-purple-500" />,
      color: "border-purple-100 hover:border-purple-305 dark:border-purple-950 dark:hover:border-purple-900/60"
    }
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8 py-4">
      {/* Welcome Hero banner */}
      <div className="rounded-3xl border border-neutral-200 bg-white p-8 dark:border-neutral-800 dark:bg-neutral-950 relative overflow-hidden transition-all duration-200 shadow-sm">
        <div className="relative z-10 max-w-xl">
          <h1 className="text-3xl font-extrabold text-neutral-900 dark:text-white sm:text-4xl tracking-tight">
            Resto Dashboard
          </h1>
          <p className="mt-4 text-base text-neutral-500 dark:text-neutral-400 leading-relaxed">
            Welcome to the central management dashboard. We have initialized your system. Feel free to explore the available modules using the sidebar navigation.
          </p>
        </div>
        
        {/* Abstract decorative graphic elements */}
        <div className="absolute right-0 bottom-0 top-0 w-1/3 bg-gradient-to-l from-indigo-500/10 to-transparent dark:from-indigo-550/5 pointer-events-none hidden md:block" />
      </div>

      {/* Quick Navigation grid */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-neutral-800 dark:text-neutral-200 pl-1">
          Quick Access
        </h2>
        
        <div className="grid gap-6 sm:grid-cols-2">
          {dashboardLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-2xl border bg-white p-6 dark:bg-neutral-950 transition-all duration-200 hover:shadow-md flex items-start gap-4 group cursor-pointer ${link.color}`}
            >
              <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900 group-hover:scale-105 transition-transform duration-200">
                {link.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-neutral-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {link.label}
                  </h3>
                  <BiChevronRight className="w-5 h-5 text-neutral-400 group-hover:translate-x-1 transition-transform duration-200" />
                </div>
                <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
                  {link.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
