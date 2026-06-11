import http from './http.js';

export const getAll = () => http.get('/crop-cycles');
export const getById = (id) => http.get(`/crop-cycles/${id}`);
export const create = (data) => http.post('/crop-cycles', data);
export const update = (id, data) => http.put(`/crop-cycles/${id}`, data);
export const remove = (id) => http.delete(`/crop-cycles/${id}`);
export const updateStage = (id, data) => http.put(`/crop-cycles/${id}/stage`, data);
export const addReminder = (id, data) => http.post(`/crop-cycles/${id}/reminders`, data);
export const toggleReminder = (id, reminderId) => http.put(`/crop-cycles/${id}/reminders/${reminderId}`);

