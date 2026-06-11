import { create } from 'zustand';
import * as authApi from '../api/auth.api.js';

function readUser() {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    localStorage.removeItem('user');
    return null;
  }
}

export const useAuthStore = create((set, get) => ({
  user: readUser(),
  isAuthenticated: false,
  hydrated: false,

  setAuth: (user) => {
    localStorage.setItem('user', JSON.stringify(user));
    set({ user, isAuthenticated: true });
  },

  logout: async ({ callApi = true } = {}) => {
    if (callApi) {
      try {
        await authApi.logout();
      } catch {
        // ignore network errors on logout
      }
    }
    localStorage.removeItem('user');
    set({ user: null, isAuthenticated: false });
  },

  hydrate: async () => {
    const cachedUser = readUser();
    if (cachedUser) {
      set({ user: cachedUser, isAuthenticated: true });
    }
    try {
      const response = await authApi.getMe();
      localStorage.setItem('user', JSON.stringify(response.data));
      set({ user: response.data, isAuthenticated: true, hydrated: true });
    } catch {
      localStorage.removeItem('user');
      set({ user: null, isAuthenticated: false, hydrated: true });
    }
  },

  updateUser: (updatedUser) => {
    const user = { ...(get().user || {}), ...updatedUser };
    localStorage.setItem('user', JSON.stringify(user));
    set({ user });
  },
}));
