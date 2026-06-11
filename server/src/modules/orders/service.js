import crypto from 'crypto';
import mongoose from 'mongoose';
import Order from '../../models/Order.model.js';
import Listing from '../../models/Listing.model.js';
import Notification from '../../models/Notification.model.js';
import { ORDER_STATUSES, VALID_TRANSITIONS } from '../../constants/orderStatuses.js';
import { getDeliveryConfig, calculateCheckout } from '../../utils/checkout.js';
import { createAndEmit } from '../notifications/service.js';
import { emitToUser } from '../../utils/socket.js';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Generate a cryptographically random 6-digit delivery code.
 */
const generateDeliveryCode = () => {
  const buf = crypto.randomBytes(4);
  const num = buf.readUInt32BE(0) % 1000000;
  return num.toString().padStart(6, '0');
};

/**
 * Enforce order status transition rules.
 */
const assertTransition = (currentStatus, newStatus) => {
  const allowed = VALID_TRANSITIONS[currentStatus] || [];
  if (!allowed.includes(newStatus)) {
    const err = new Error(
      `Invalid status transition: ${currentStatus} → ${newStatus}. Allowed next statuses: ${allowed.join(', ') || 'none'}.`
    );
    err.statusCode = 400;
    throw err;
  }
};

/**
 * Emit the appropriate socket event when order status changes.
 */
const emitOrderEvent = (order, newStatus) => {
  const statusEventMap = {
    [ORDER_STATUSES.ACCEPTED]: { buyer: 'order:accepted', farmer: null },
    [ORDER_STATUSES.REJECTED]: { buyer: 'order:rejected', farmer: null },
    [ORDER_STATUSES.OUT_FOR_DELIVERY]: { buyer: 'order:out_for_delivery', farmer: null },
    [ORDER_STATUSES.DELIVERED]: { buyer: 'order:delivered', farmer: null },
    [ORDER_STATUSES.COMPLETED]: { buyer: 'order:completed', farmer: 'delivery:verified' },
    [ORDER_STATUSES.CANCELLED]: { buyer: null, farmer: 'order:cancelled' },
  };

  const events = statusEventMap[newStatus];
  if (!events) return;

  const payload = {
    orderId: order._id.toString(),
    status: newStatus,
    message: `Order ${newStatus.toLowerCase().replace(/_/g, ' ')}`,
  };

  if (events.buyer) {
    emitToUser(order.buyerId.toString(), events.buyer, payload);
  }
  if (events.farmer) {
    emitToUser(order.farmerId.toString(), events.farmer, payload);
  }
};

// ─── Service functions ────────────────────────────────────────────────────────

/**
 * TASK 1 + 2 + 3 + 4: Place a new order.
 * Validates stock, computes charges server-side, generates delivery code.
 */
export const createOrder = async (buyerId, data) => {
  const listing = await Listing.findById(data.listingId);
  if (!listing) {
    const err = new Error('Listing not found.');
    err.statusCode = 404;
    throw err;
  }
  if (listing.status !== 'ACTIVE') {
    const err = new Error('This listing is no longer active.');
    err.statusCode = 400;
    throw err;
  }

  // Stock validation (Task 6)
  if (listing.quantity < data.quantity) {
    const err = new Error(`Insufficient stock. Available: ${listing.quantity} ${listing.unit}.`);
    err.statusCode = 400;
    throw err;
  }

  // Min/max quantity validation
  if (listing.minimumOrderQuantity && data.quantity < listing.minimumOrderQuantity) {
    const err = new Error(
      `Minimum order quantity is ${listing.minimumOrderQuantity} ${listing.unit}.`
    );
    err.statusCode = 400;
    throw err;
  }
  if (listing.maximumOrderQuantity && data.quantity > listing.maximumOrderQuantity) {
    const err = new Error(
      `Maximum order quantity is ${listing.maximumOrderQuantity} ${listing.unit}.`
    );
    err.statusCode = 400;
    throw err;
  }

  // Server-side price calculation (Task 4)
  const cfg = await getDeliveryConfig();
  const items = [{
    finalPrice: listing.finalPrice || listing.price,
    basePrice: listing.basePrice || listing.price,
    quantity: data.quantity,
    unit: listing.unit,
  }];
  const breakdown = calculateCheckout(items, cfg);

  // Delivery address snapshot (Task 3)
  const addr = data.deliveryAddress || {};
  const addressLine = [addr.addressLine1, addr.addressLine2].filter(Boolean).join(', ');

  // Generate 6-digit delivery code (Task 2)
  const deliveryCode = generateDeliveryCode();

  const order = await Order.create({
    buyerId,
    farmerId: listing.farmerId,
    listingId: listing._id,
    productName: listing.productName,
    quantity: data.quantity,
    unit: listing.unit,
    totalWeight: breakdown.totalWeightKg,

    pricePerUnit: listing.finalPrice || listing.price,
    subtotal: breakdown.subtotal,
    discountAmount: breakdown.discountAmount,
    deliveryCharge: breakdown.deliveryCharge,
    handlingCharge: breakdown.handlingCharge,
    grandTotal: breakdown.grandTotal,

    // Address snapshot
    deliveryName: addr.fullName || addr.deliveryName || '',
    deliveryPhone: addr.phone || addr.deliveryPhone || '',
    deliveryAddress: addressLine || addr.deliveryAddress || '',
    deliveryVillage: addr.village || '',
    deliveryCity: addr.city || '',
    deliveryDistrict: addr.district || '',
    deliveryState: addr.state || '',
    deliveryCountry: addr.country || '',
    deliveryPostalCode: addr.postalCode || '',

    deliveryCode,
    deliveryCodeVerified: false,
    verificationAttempts: 0,

    status: ORDER_STATUSES.PENDING,
    message: data.message || '',
    isCartOrder: data.isCartOrder || false,
  });

  // Notify farmer (Task 8)
  await createAndEmit({
    userId: listing.farmerId,
    type: 'ORDER_CREATED',
    title: `New order: ${listing.productName}`,
    message: `${addr.fullName || 'A buyer'} ordered ${data.quantity} ${listing.unit} of ${listing.productName} (₹${breakdown.grandTotal.toFixed(2)} total).`,
    relatedId: order._id,
  });

  // Emit socket event to farmer's room
  emitToUser(listing.farmerId.toString(), 'order:new', {
    orderId: order._id.toString(),
    status: ORDER_STATUSES.PENDING,
    message: 'New order received',
  });

  // Return without deliveryCode (model strips it in toJSON)
  return order.toJSON();
};

/**
 * Get orders for a user (paginated).
 * Farmers see their orders; buyers see their orders.
 */
export const getOrders = async ({ userId, role, status, page = 1, limit = 20 }) => {
  const filter = {};
  if (role === 'FARMER') filter.farmerId = userId;
  else if (role === 'BUYER') filter.buyerId = userId;

  if (status && status !== 'ALL') filter.status = status;

  const skip = (page - 1) * limit;
  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate('buyerId', 'name email phone')
      .populate('farmerId', 'name email')
      .populate('listingId', 'productName basePrice discountPercentage finalPrice unit quantity images')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Order.countDocuments(filter),
  ]);

  return {
    orders,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get a single order by ID with role-based access.
 */
export const getOrderById = async (orderId, userId, role) => {
  const order = await Order.findById(orderId)
    .populate('buyerId', 'name email phone')
    .populate('farmerId', 'name email')
    .populate('listingId', 'productName basePrice finalPrice unit images');

  if (!order) {
    const err = new Error('Order not found.');
    err.statusCode = 404;
    throw err;
  }

  // Role-based access: must be buyer or farmer on this order
  const isBuyer = order.buyerId._id.toString() === userId.toString();
  const isFarmer = order.farmerId._id.toString() === userId.toString();
  if (!isBuyer && !isFarmer) {
    const err = new Error('Access denied.');
    err.statusCode = 403;
    throw err;
  }

  return order.toJSON();
};

/**
 * Buyer: get delivery code for their own order (ONLY when order is pending or accepted).
 */
export const getBuyerDeliveryCode = async (orderId, buyerId) => {
  const order = await Order.findOne({ _id: orderId, buyerId }).select('+deliveryCode');
  if (!order) {
    const err = new Error('Order not found.');
    err.statusCode = 404;
    throw err;
  }
  return {
    orderId: order._id,
    deliveryCode: order.deliveryCode,
    status: order.status,
  };
};

/**
 * Buyer: cancel their own order (only when PENDING).
 */
export const cancelOrder = async (orderId, buyerId) => {
  const order = await Order.findOne({ _id: orderId, buyerId });
  if (!order) {
    const err = new Error('Order not found.');
    err.statusCode = 404;
    throw err;
  }

  assertTransition(order.status, ORDER_STATUSES.CANCELLED);

  order.status = ORDER_STATUSES.CANCELLED;
  order.cancelledAt = new Date();
  await order.save();

  // Notify farmer
  await createAndEmit({
    userId: order.farmerId,
    type: 'ORDER_CREATED', // reuse as general
    title: 'Order cancelled',
    message: `Buyer cancelled order for ${order.productName}.`,
    relatedId: order._id,
  });

  emitOrderEvent(order, ORDER_STATUSES.CANCELLED);
  return order.toJSON();
};

/**
 * Farmer: accept an order (PENDING → ACCEPTED).
 */
export const acceptOrder = async (orderId, farmerId) => {
  const order = await Order.findOne({ _id: orderId, farmerId });
  if (!order) {
    const err = new Error('Order not found.');
    err.statusCode = 404;
    throw err;
  }

  assertTransition(order.status, ORDER_STATUSES.ACCEPTED);

  order.status = ORDER_STATUSES.ACCEPTED;
  order.acceptedAt = new Date();
  await order.save();

  await createAndEmit({
    userId: order.buyerId,
    type: 'ORDER_ACCEPTED',
    title: 'Order accepted',
    message: `Your order for ${order.productName} has been accepted by the farmer!`,
    relatedId: order._id,
  });

  emitOrderEvent(order, ORDER_STATUSES.ACCEPTED);
  return order.toJSON();
};

/**
 * Farmer: reject an order (PENDING → REJECTED).
 */
export const rejectOrder = async (orderId, farmerId, rejectionReason) => {
  if (!rejectionReason || !rejectionReason.trim()) {
    const err = new Error('Rejection reason is required.');
    err.statusCode = 400;
    throw err;
  }

  const order = await Order.findOne({ _id: orderId, farmerId });
  if (!order) {
    const err = new Error('Order not found.');
    err.statusCode = 404;
    throw err;
  }

  assertTransition(order.status, ORDER_STATUSES.REJECTED);

  order.status = ORDER_STATUSES.REJECTED;
  order.rejectionReason = rejectionReason.trim();
  order.rejectedAt = new Date();
  await order.save();

  await createAndEmit({
    userId: order.buyerId,
    type: 'ORDER_REJECTED',
    title: 'Order rejected',
    message: `Your order for ${order.productName} was rejected. Reason: ${rejectionReason}`,
    relatedId: order._id,
  });

  emitOrderEvent(order, ORDER_STATUSES.REJECTED);
  return order.toJSON();
};

/**
 * Farmer: mark order as out for delivery (ACCEPTED → OUT_FOR_DELIVERY).
 */
export const markOutForDelivery = async (orderId, farmerId) => {
  const order = await Order.findOne({ _id: orderId, farmerId });
  if (!order) {
    const err = new Error('Order not found.');
    err.statusCode = 404;
    throw err;
  }

  assertTransition(order.status, ORDER_STATUSES.OUT_FOR_DELIVERY);

  order.status = ORDER_STATUSES.OUT_FOR_DELIVERY;
  order.outForDeliveryAt = new Date();
  await order.save();

  await createAndEmit({
    userId: order.buyerId,
    type: 'OUT_FOR_DELIVERY',
    title: 'Out for delivery',
    message: `Your order for ${order.productName} is out for delivery. Your code: show it to the farmer upon receipt.`,
    relatedId: order._id,
  });

  emitOrderEvent(order, ORDER_STATUSES.OUT_FOR_DELIVERY);
  return order.toJSON();
};

/**
 * Farmer: verify delivery code.
 * On match: OUT_FOR_DELIVERY → DELIVERED → COMPLETED (immediate) + inventory decrement.
 * On mismatch: increment verificationAttempts, return error.
 */
export const verifyDeliveryCode = async (orderId, farmerId, submittedCode) => {
  // Must select deliveryCode explicitly (stripped in toJSON)
  const order = await Order.findOne({ _id: orderId, farmerId }).select('+deliveryCode');
  if (!order) {
    const err = new Error('Order not found.');
    err.statusCode = 404;
    throw err;
  }

  if (order.status !== ORDER_STATUSES.OUT_FOR_DELIVERY) {
    const err = new Error(
      `Cannot verify code. Order must be in OUT_FOR_DELIVERY status. Current: ${order.status}.`
    );
    err.statusCode = 400;
    throw err;
  }

  if (submittedCode !== order.deliveryCode) {
    order.verificationAttempts = (order.verificationAttempts || 0) + 1;
    await order.save();
    const err = new Error(
      `Invalid Delivery Code. Attempt ${order.verificationAttempts}.`
    );
    err.statusCode = 400;
    throw err;
  }

  // Code matched — use a Mongoose session to atomically update order + decrement inventory
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const now = new Date();

      order.deliveryCodeVerified = true;
      order.deliveryVerifiedAt = now;
      order.deliveredAt = now;
      order.completedAt = now;
      order.status = ORDER_STATUSES.COMPLETED;
      await order.save({ session });

      // Decrement listing inventory (Task 6)
      await Listing.findByIdAndUpdate(
        order.listingId,
        { $inc: { quantity: -order.quantity } },
        { session, new: true }
      ).then(async (updatedListing) => {
        if (updatedListing && updatedListing.quantity <= updatedListing.lowStockThreshold && updatedListing.quantity > 0) {
          // Fire low stock notification to farmer
          await createAndEmit({
            userId: order.farmerId,
            type: 'LOW_STOCK',
            title: `Low stock: ${updatedListing.productName}`,
            message: `Only ${updatedListing.quantity} ${updatedListing.unit} remaining for "${updatedListing.productName}".`,
            relatedId: updatedListing._id,
          });
        }
        if (updatedListing && updatedListing.quantity <= 0) {
          // Mark listing as sold out
          updatedListing.quantity = 0;
          updatedListing.status = 'SOLD_OUT';
          updatedListing.availability = false;
          await updatedListing.save({ session });
        }
      });
    });
  } finally {
    session.endSession();
  }

  // Notify both parties
  await createAndEmit({
    userId: order.buyerId,
    type: 'DELIVERED',
    title: 'Order delivered',
    message: `Your order for ${order.productName} has been delivered and completed!`,
    relatedId: order._id,
  });

  await createAndEmit({
    userId: order.farmerId,
    type: 'COMPLETED',
    title: 'Delivery verified',
    message: `Order for ${order.productName} (qty: ${order.quantity} ${order.unit}) verified and completed.`,
    relatedId: order._id,
  });

  emitOrderEvent(order, ORDER_STATUSES.COMPLETED);

  return order.toJSON();
};

/**
 * Server-side checkout preview: calculates charges without creating an order.
 */
export const previewCheckout = async (listingId, quantity) => {
  const listing = await Listing.findById(listingId);
  if (!listing || listing.status !== 'ACTIVE') {
    const err = new Error('Listing not found or not active.');
    err.statusCode = 404;
    throw err;
  }

  if (listing.quantity < quantity) {
    const err = new Error(`Insufficient stock. Available: ${listing.quantity} ${listing.unit}.`);
    err.statusCode = 400;
    throw err;
  }

  const cfg = await getDeliveryConfig();
  const items = [{
    finalPrice: listing.finalPrice || listing.price,
    basePrice: listing.basePrice || listing.price,
    quantity,
    unit: listing.unit,
  }];
  const breakdown = calculateCheckout(items, cfg);

  return {
    listing: {
      _id: listing._id,
      productName: listing.productName,
      basePrice: listing.basePrice,
      discountPercentage: listing.discountPercentage,
      discountAmount: listing.discountAmount,
      finalPrice: listing.finalPrice,
      unit: listing.unit,
      quantity: listing.quantity,
    },
    quantity,
    breakdown,
  };
};
