import http from './http.js';

export const submitReport = (data) => http.post('/reports', data);
export const getMyReports = (page = 1) => http.get('/reports/mine', { params: { page } });
export const getReportById = (id) => http.get(`/reports/${id}`);
