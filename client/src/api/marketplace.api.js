import axiosInstance from './http.js';

export const getMarketplaceCrops = (params) => axiosInstance.get('/marketplace', { params });
