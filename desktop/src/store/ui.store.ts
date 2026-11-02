import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UIState {
  isSidebarOpen: boolean;
  theme: "light" | "dark";
  userRole: string;
  activeChefId: string | null;
  isSetupCompleted: boolean;
  masterName: string;
  toggleSidebar: () => void;
  setTheme: (theme: "light" | "dark") => void;
  setUserRole: (role: string) => void;
  setActiveChefId: (id: string | null) => void;
  setSetupCompleted: (completed: boolean) => void;
  setMasterName: (name: string) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      isSidebarOpen: true,
      theme: "dark",
      userRole: "admin",
      activeChefId: null,
      isSetupCompleted: false,
      masterName: "Stackrise Resto",
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
      setSetupCompleted: (isSetupCompleted) => set({ isSetupCompleted }),
      setMasterName: (masterName) => set({ masterName }),
    }),
    { name: "ui-store" }
  )
);
