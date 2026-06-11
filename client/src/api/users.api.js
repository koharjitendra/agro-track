import http from './http.js';

export const getProfile = () => http.get('/users/profile');
export const getProfileById = (id) => http.get(`/users/profile/${id}`);
export const updateProfile = (data) => http.put('/users/profile', data);
export const searchUsers = (params) => http.get('/users/search', { params });
