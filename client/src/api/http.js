import axios from 'axios';
import { useAuthStore } from '../store/auth.store.js';

const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

http.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const isBlockedError = error.response?.status === 403 && 
      (error.response?.data?.message?.toLowerCase().includes('block') || 
       error.response?.data?.message?.toLowerCase().includes('blocked'));

    if (error.response?.status === 401 || isBlockedError) {
      useAuthStore.getState().logout({ callApi: false });
      const path = window.location.pathname;
      if (!path.includes('/login') && !path.includes('/register')) {
        window.location.href = '/login';
      }
    }
    const message = error.response?.data?.message || 'Something went wrong. Please try again.';
    const customError = new Error(message);
    customError.response = error.response;
    customError.errors = error.response?.data?.errors;
    return Promise.reject(customError);
  }
);

export default http;
