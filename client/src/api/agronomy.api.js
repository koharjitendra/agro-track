import http from './http.js';

export const getWeatherRecommendations = (params) => http.get('/agronomy/weather-recommendations', { params });
export const getMarketPrices = () => http.get('/agronomy/market-prices');
export const getLiveWeather = () => http.get('/agronomy/weather');
export const getMarketTrends = () => http.get('/agronomy/market-trends');
export const getDecisionInsights = () => http.get('/agronomy/insights');
export const getYieldPrediction = (cropCycleId) => http.get(`/agronomy/crop-cycles/${cropCycleId}/predict-yield`);
export const chatAI = (data) => http.post('/agronomy/ai/chat', data);
export const detectDisease = (data) => http.post('/agronomy/ai/disease-detect', data);
