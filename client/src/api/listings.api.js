import http from './http.js';

export const getAll = () => http.get('/listings');
export const getById = (id) => http.get(`/listings/${id}`);
export const create = (data) => http.post('/listings', data);
export const update = (id, data) => http.put(`/listings/${id}`, data);
export const remove = (id) => http.delete(`/listings/${id}`);
export const publish = (id) => http.post(`/listings/${id}/publish`);
export const unpublish = (id) => http.post(`/listings/${id}/unpublish`);
