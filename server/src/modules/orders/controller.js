import * as ordersService from './service.js';
import { success } from '../../utils/apiResponse.js';

// ── Shared ────────────────────────────────────────────────────────────────────

export const getOrders = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const result = await ordersService.getOrders({
      userId: req.user.id,
      role: req.user.role,
      status: req.query.status,
      page,
      limit,
    });
    return success(res, result, 'Orders fetched successfully');
  } catch (err) {
    next(err);
  }
};

export const getOrderById = async (req, res, next) => {
  try {
    const order = await ordersService.getOrderById(req.params.id, req.user.id, req.user.role);
    return success(res, order, 'Order fetched successfully');
  } catch (err) {
    next(err);
  }
};

export const previewCheckout = async (req, res, next) => {
  try {
    const { listingId, quantity } = req.query;
    if (!listingId || !quantity) {
      const err = new Error('listingId and quantity are required.');
      err.statusCode = 400;
      throw err;
    }
    const preview = await ordersService.previewCheckout(listingId, Number(quantity));
    return success(res, preview, 'Checkout preview calculated');
  } catch (err) {
    next(err);
  }
};

// ── Buyer actions ─────────────────────────────────────────────────────────────

export const createOrder = async (req, res, next) => {
  try {
    const order = await ordersService.createOrder(req.user.id, req.body);
    return success(res, order, 'Order placed successfully', 201);
  } catch (err) {
    next(err);
  }
};

export const cancelOrder = async (req, res, next) => {
  try {
    const order = await ordersService.cancelOrder(req.params.id, req.user.id);
    return success(res, order, 'Order cancelled successfully');
  } catch (err) {
    next(err);
  }
};

export const getBuyerDeliveryCode = async (req, res, next) => {
  try {
    const result = await ordersService.getBuyerDeliveryCode(req.params.id, req.user.id);
    return success(res, result, 'Delivery code fetched');
  } catch (err) {
    next(err);
  }
};

// ── Farmer actions ────────────────────────────────────────────────────────────

export const acceptOrder = async (req, res, next) => {
  try {
    const order = await ordersService.acceptOrder(req.params.id, req.user.id);
    return success(res, order, 'Order accepted successfully');
  } catch (err) {
    next(err);
  }
};

export const rejectOrder = async (req, res, next) => {
  try {
    const { rejectionReason } = req.body;
    const order = await ordersService.rejectOrder(req.params.id, req.user.id, rejectionReason);
    return success(res, order, 'Order rejected');
  } catch (err) {
    next(err);
  }
};

export const markOutForDelivery = async (req, res, next) => {
  try {
    const order = await ordersService.markOutForDelivery(req.params.id, req.user.id);
    return success(res, order, 'Order marked as out for delivery');
  } catch (err) {
    next(err);
  }
};

export const verifyDeliveryCode = async (req, res, next) => {
  try {
    const { deliveryCode } = req.body;
    if (!deliveryCode) {
      const err = new Error('deliveryCode is required.');
      err.statusCode = 400;
      throw err;
    }
    const order = await ordersService.verifyDeliveryCode(
      req.params.id,
      req.user.id,
      deliveryCode
    );
    return success(res, order, 'Delivery verified. Order completed!');
  } catch (err) {
    next(err);
  }
};
