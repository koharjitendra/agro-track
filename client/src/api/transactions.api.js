import http from './http.js';

export const getAll = (params) => http.get('/transactions', { params });
export const getById = (id) => http.get(`/transactions/${id}`);
export const create = (data) => http.post('/transactions', data);
export const update = (id, data) => http.put(`/transactions/${id}`, data);
export const approve = (id) => http.post(`/transactions/${id}/approve`);
export const reject = (id, comment) => http.post(`/transactions/${id}/reject`, { comment });
export const requestChanges = (id, comment) => http.post(`/transactions/${id}/request-changes`, { comment });
export const revise = (id, data) => http.post(`/transactions/${id}/revise`, data);
export const rate = (id, data) => http.post(`/transactions/${id}/rate`, data);
export const remind = (id) => http.post(`/transactions/${id}/remind`);
