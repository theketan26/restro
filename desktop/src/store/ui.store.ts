import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UIState {
  isSidebarOpen: boolean;
  theme: "light" | "dark";
  userRole: string;
  activeChefId: string | null;
  toggleSidebar: () => void;
  setTheme: (theme: "light" | "dark") => void;
  setUserRole: (role: string) => void;
  setActiveChefId: (id: string | null) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      isSidebarOpen: true,
      theme: "dark",
      userRole: "admin",
      activeChefId: "default-chef-id",
      toggleSidebar: () =>
        set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
      setTheme: (theme) => set({ theme }),
      setUserRole: (userRole) => {
        if (typeof document !== "undefined") {
          document.cookie = `user-role=${userRole}; path=/; max-age=604800`;
        }
        set({ userRole });
      },
      setActiveChefId: (activeChefId) => set({ activeChefId }),
    }),
    { name: "ui-store" }
  )
);
