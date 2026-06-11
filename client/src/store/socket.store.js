import { create } from 'zustand';
import { io } from 'socket.io-client';
import { useAuthStore } from './auth.store.js';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:8080';

export const useSocketStore = create((set, get) => ({
  socket: null,
  connected: false,

  connect: () => {
    const { socket } = get();
    if (socket?.connected) return;

    const newSocket = io(SOCKET_URL, {
      withCredentials: true, // sends httpOnly cookie
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      set({ connected: true });
    });

    newSocket.on('disconnect', () => {
      set({ connected: false });
    });

    newSocket.on('connect_error', (err) => {
      console.warn('[Socket] Connection error:', err.message);
      set({ connected: false });
    });

    set({ socket: newSocket });
    return newSocket;
  },

  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null, connected: false });
    }
  },

  /**
   * Subscribe to an event. Returns an unsubscribe function.
   */
  on: (event, callback) => {
    const { socket } = get();
    if (!socket) return () => {};
    socket.on(event, callback);
    return () => socket.off(event, callback);
  },
}));
