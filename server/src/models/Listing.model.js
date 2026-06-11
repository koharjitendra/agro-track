import mongoose from 'mongoose';

const LISTING_STATUSES = ['DRAFT', 'ACTIVE', 'PAUSED', 'SOLD_OUT'];

const listingSchema = new mongoose.Schema(
  {
    farmerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Farmer ID is required'],
      index: true,
    },
    // Optional reference back to a crop cycle for traceability
    cropCycleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CropCycle',
      default: null,
    },

    // ── Product details ─────────────────────────────────────────────────
    cropName: {
      type: String,
      trim: true,
      default: '',
    },
    productName: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: [100, 'Product name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    category: {
      type: String,
      trim: true,
      default: '',
    },

    // ── Inventory ────────────────────────────────────────────────────────
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [0, 'Quantity cannot be negative'],
      default: 0,
    },
    unit: {
      type: String,
      trim: true,
      default: 'kg',
    },
    minimumOrderQuantity: {
      type: Number,
      default: 1,
      min: [1, 'Minimum order quantity must be at least 1'],
    },
    maximumOrderQuantity: {
      type: Number,
      default: null, // null = no max
    },
    lowStockThreshold: {
      type: Number,
      default: 5, // configurable per listing; overrides global default
      min: 0,
    },

    // ── Pricing (server always computes discountAmount & finalPrice) ─────
    basePrice: {
      type: Number,
      required: [true, 'Base price is required'],
      min: [0, 'Base price cannot be negative'],
      default: 0,
    },
    discountPercentage: {
      type: Number,
      default: 0,
      min: [0, 'Discount percentage cannot be negative'],
      max: [100, 'Discount percentage cannot exceed 100'],
    },
    discountAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    finalPrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Legacy field kept for backwards compatibility
    price: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ── Dates ────────────────────────────────────────────────────────────
    harvestDate: {
      type: Date,
      default: null,
    },
    expiryDate: {
      type: Date,
      default: null,
    },

    // ── Media / Location ─────────────────────────────────────────────────
    images: {
      type: [String],
      default: [],
    },
    location: {
      type: String,
      trim: true,
      default: '',
    },
    availability: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      enum: {
        values: LISTING_STATUSES,
        message: `Status must be one of: ${LISTING_STATUSES.join(', ')}`,
      },
      default: 'DRAFT',
    },
    views: {
      type: Number,
      default: 0,
      min: 0,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
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

// ── Pre-save hook: always compute discountAmount & finalPrice ────────────────
listingSchema.pre('save', function (next) {
  const base = this.basePrice || 0;
  const pct = this.discountPercentage || 0;
  this.discountAmount = parseFloat(((base * pct) / 100).toFixed(2));
  this.finalPrice = parseFloat((base - this.discountAmount).toFixed(2));
  // Keep legacy price field in sync
  this.price = this.finalPrice;
  next();
});

listingSchema.index({ category: 1 });
listingSchema.index({ status: 1 });
listingSchema.index({ createdAt: -1 });

const Listing = mongoose.model('Listing', listingSchema);
export default Listing;
