import { create } from 'zustand';
import * as notificationsApi from '../api/notifications.api.js';

export const useNotificationStore = create((set, get) => ({
  unreadCount: 0,

  fetchUnreadCount: async () => {
    try {
      const res = await notificationsApi.getUnreadCount();
      set({ unreadCount: res.data?.count ?? 0 });
    } catch {
      // silently fail
    }
  },

  setUnreadCount: (count) => set({ unreadCount: count }),

  increment: () => set((state) => ({ unreadCount: state.unreadCount + 1 })),
}));
