import { create } from 'zustand';

export const useUiStore = create((set) => ({
  sidebarOpen: window.innerWidth > 1024,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  closeSidebar: () => set({ sidebarOpen: false }),
  openSidebar: () => set({ sidebarOpen: true }),
}));
