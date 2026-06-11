import http from './http.js';

export const getAll = () => http.get('/inventory');
export const create = (data) => http.post('/inventory', data);
export const update = (id, data) => http.put(`/inventory/${id}`, data);
export const remove = (id) => http.delete(`/inventory/${id}`);
