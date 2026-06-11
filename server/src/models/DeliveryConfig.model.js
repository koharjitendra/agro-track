import mongoose from 'mongoose';

/**
 * Delivery charge tiers: each tier has a maxWeight (kg) threshold and a charge.
 * The last tier with maxWeight = null means "greater than all previous" → free.
 *
 * Default tiers (seeded):
 *   0 – 2 kg  → ₹20
 *   2 – 5 kg  → ₹25
 *   5 – 10 kg → ₹30
 *  >10 kg     → ₹0  (free)
 */
const deliveryTierSchema = new mongoose.Schema(
  {
    minWeight: { type: Number, required: true }, // inclusive lower bound in kg
    maxWeight: { type: Number, default: null },  // inclusive upper bound; null = no upper bound
    charge: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const deliveryConfigSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      default: 'default',
      unique: true,
    },
    handlingFee: {
      type: Number,
      required: true,
      default: 5,
      min: 0,
    },
    defaultLowStockThreshold: {
      type: Number,
      required: true,
      default: 5,
      min: 0,
    },
    deliveryTiers: {
      type: [deliveryTierSchema],
      default: [
        { minWeight: 0,  maxWeight: 2,    charge: 20 },
        { minWeight: 2,  maxWeight: 5,    charge: 25 },
        { minWeight: 5,  maxWeight: 10,   charge: 30 },
        { minWeight: 10, maxWeight: null, charge: 0  },
      ],
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

const DeliveryConfig = mongoose.model('DeliveryConfig', deliveryConfigSchema);
export default DeliveryConfig;
