import http from './http.js';

export const getByCropCycle = (cropCycleId) => http.get(`/expenses/crop-cycle/${cropCycleId}`);
export const create = (data) => http.post('/expenses', data);
export const update = (id, data) => http.put(`/expenses/${id}`, data);
export const remove = (id) => http.delete(`/expenses/${id}`);
