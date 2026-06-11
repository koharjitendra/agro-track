import http from './http.js';

export const getAll = (params) => http.get('/notifications', { params });
export const getUnreadCount = () => http.get('/notifications/unread-count');
export const markAsRead = (id) => http.put(`/notifications/${id}/read`);
export const markAllAsRead = () => http.put('/notifications/read-all');
