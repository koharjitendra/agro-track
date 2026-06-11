import http from './http.js';

// ── Shared ────────────────────────────────────────────────────────────────────
export const getAll = (params) => http.get('/orders', { params });
export const getById = (id) => http.get(`/orders/${id}`);
export const previewCheckout = (listingId, quantity) =>
  http.get('/orders/checkout-preview', { params: { listingId, quantity } });

// ── Buyer ─────────────────────────────────────────────────────────────────────
export const placeOrder = (data) => http.post('/orders', data);
export const cancelOrder = (id) => http.post(`/orders/${id}/cancel`);
export const getDeliveryCode = (id) => http.get(`/orders/${id}/delivery-code`);

// ── Farmer ────────────────────────────────────────────────────────────────────
export const acceptOrder = (id) => http.post(`/orders/${id}/accept`);
export const rejectOrder = (id, rejectionReason) =>
  http.post(`/orders/${id}/reject`, { rejectionReason });
export const markOutForDelivery = (id) => http.post(`/orders/${id}/out-for-delivery`);
export const verifyDeliveryCode = (id, deliveryCode) =>
  http.post(`/orders/${id}/verify-delivery`, { deliveryCode });
