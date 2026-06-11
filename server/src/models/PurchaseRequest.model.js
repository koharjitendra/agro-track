import mongoose from 'mongoose';

const purchaseRequestSchema = new mongoose.Schema(
  {
    buyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Buyer ID is required'],
      index: true,
    },
    farmerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Farmer ID is required'],
      index: true,
    },
    // One of listingId or cropCycleId is required; listingId is preferred for new orders
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
    // Snapshot of product name at time of order (since listing may change later)
    productName: { type: String, trim: true, default: '' },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
    },
    unit: { type: String, trim: true, default: 'kg' },
    offerPrice: {
      type: Number,
      required: [true, 'Offer price is required'],
      min: [0, 'Offer price cannot be negative'],
    },
    message: { type: String, trim: true, default: '' },
    status: {
      type: String,
      enum: { values: ['PENDING', 'ACCEPTED', 'REJECTED', 'COMPLETED'], message: 'Invalid status' },
      default: 'PENDING',
    },
    // Buyer delivery details (filled at checkout)
    buyerName: { type: String, trim: true, default: '' },
    buyerPhone: { type: String, trim: true, default: '' },
    buyerAddress: { type: String, trim: true, default: '' },
    isCartOrder: { type: Boolean, default: false },
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

const PurchaseRequest = mongoose.model('PurchaseRequest', purchaseRequestSchema);
export default PurchaseRequest;
