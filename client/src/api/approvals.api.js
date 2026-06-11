import http from './http.js';

export const getPending = () => http.get('/approvals/pending');
export const getByTransaction = (transactionId) => http.get(`/approvals/transaction/${transactionId}`);
