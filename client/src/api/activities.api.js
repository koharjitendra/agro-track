import http from './http.js';

export const getByCropCycle = (cropCycleId) => http.get(`/crop-cycles/${cropCycleId}/activities`);
export const create = (cropCycleId, data) => http.post(`/crop-cycles/${cropCycleId}/activities`, data);
export const update = (activityId, data) => http.put(`/activities/${activityId}`, data);
export const remove = (activityId) => http.delete(`/activities/${activityId}`);
