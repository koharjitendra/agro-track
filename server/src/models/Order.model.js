import mongoose from 'mongoose';
import { ORDER_STATUSES_ARRAY } from '../constants/orderStatuses.js';

const orderSchema = new mongoose.Schema(
  {
    // ── Parties ──────────────────────────────────────────────────────────
    buyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    farmerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },

    // ── Source reference ─────────────────────────────────────────────────
    listingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Listing',
      default: null,
    },
    cropCycleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CropCycle',
      default: null,
    },

    // ── Product snapshot (permanent, never changes after creation) ────────
    productName: { type: String, trim: true, default: '' },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
    },
    unit: { type: String, trim: true, default: 'kg' },
    totalWeight: { type: Number, default: 0 }, // in kg, used for shipping tier

    // ── Pricing snapshot (set at checkout, never changes) ─────────────────
    pricePerUnit: { type: Number, required: true, min: 0 },
    subtotal: { type: Number, required: true, min: 0 },
    discountAmount: { type: Number, default: 0, min: 0 },
    deliveryCharge: { type: Number, default: 0, min: 0 },
    handlingCharge: { type: Number, default: 0, min: 0 },
    grandTotal: { type: Number, required: true, min: 0 },

    // ── Delivery address snapshot (permanent) ─────────────────────────────
    deliveryName: { type: String, trim: true, default: '' },
    deliveryPhone: { type: String, trim: true, default: '' },
    deliveryAddress: { type: String, trim: true, default: '' },
    deliveryVillage: { type: String, trim: true, default: '' },
    deliveryCity: { type: String, trim: true, default: '' },
    deliveryDistrict: { type: String, trim: true, default: '' },
    deliveryState: { type: String, trim: true, default: '' },
    deliveryCountry: { type: String, trim: true, default: '' },
    deliveryPostalCode: { type: String, trim: true, default: '' },

    // ── COD delivery verification ────────────────────────────────────────
    deliveryCode: { type: String, trim: true, default: '' },          // 6-digit, never exposed to farmer via API
    deliveryCodeVerified: { type: Boolean, default: false },
    deliveryVerifiedAt: { type: Date, default: null },
    verificationAttempts: { type: Number, default: 0 },

    // ── Order lifecycle status ────────────────────────────────────────────
    status: {
      type: String,
      enum: {
        values: ORDER_STATUSES_ARRAY,
        message: `Status must be one of: ${ORDER_STATUSES_ARRAY.join(', ')}`,
      },
      default: 'PENDING',
      index: true,
    },
    rejectionReason: { type: String, trim: true, default: '' },

    // ── Lifecycle timestamps ──────────────────────────────────────────────
    rejectedAt: { type: Date, default: null },
    cancelledAt: { type: Date, default: null },
    acceptedAt: { type: Date, default: null },
    outForDeliveryAt: { type: Date, default: null },
    deliveredAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },

    // ── Misc ─────────────────────────────────────────────────────────────
    message: { type: String, trim: true, default: '' },
    isCartOrder: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        delete ret.__v;
        // Never expose deliveryCode in JSON (we expose it via a dedicated endpoint with role check)
        delete ret.deliveryCode;
        return ret;
      },
    },
  }
);

orderSchema.index({ createdAt: -1 });

const Order = mongoose.model('Order', orderSchema);
export default Order;
