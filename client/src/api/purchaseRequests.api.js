import axiosInstance from './http.js';

export const create = (data) => axiosInstance.post('/purchase-requests', data);
export const getAll = (params) => axiosInstance.get('/purchase-requests', { params });
export const updateStatus = (id, status) => axiosInstance.patch(`/purchase-requests/${id}/status`, { status });
