import http from './http.js';

export const getStats = () => http.get('/admin/stats');
export const getReports = (params) => http.get('/admin/reports', { params });
export const respondToReport = (id, data) => http.post(`/admin/reports/${id}/respond`, data);
export const editReport = (id, data) => http.put(`/admin/reports/${id}`, data);
export const deleteReport = (id) => http.delete(`/admin/reports/${id}`);

export const getUsers = (params) => http.get('/admin/users', { params });
export const getUserProfileDetails = (id) => http.get(`/admin/users/${id}`);
export const updateUserProfile = (id, data) => http.put(`/admin/users/${id}`, data);
export const blockUser = (id) => http.post(`/admin/users/${id}/block`);
export const unblockUser = (id) => http.post(`/admin/users/${id}/unblock`);
export const deleteUser = (id) => http.delete(`/admin/users/${id}`);

export const getAuditLogs = (page = 1) => http.get('/admin/audit-logs', { params: { page } });
