import mongoose from 'mongoose';

const inventoryItemSchema = new mongoose.Schema(
  {
    farmerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Farmer ID is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true,
    },
    category: {
      type: String,
      enum: {
        values: ['SEEDS', 'FERTILIZERS', 'PESTICIDES', 'EQUIPMENT', 'OTHER'],
        message: 'Category must be SEEDS, FERTILIZERS, PESTICIDES, EQUIPMENT, or OTHER',
      },
      required: [true, 'Category is required'],
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [0, 'Quantity cannot be negative'],
    },
    unit: {
      type: String,
      required: [true, 'Unit of measurement is required'],
      trim: true,
    },
    lowStockThreshold: {
      type: Number,
      default: 5,
      min: [0, 'Threshold cannot be negative'],
    },
    pricePerUnit: {
      type: Number,
      default: 0,
      min: [0, 'Price cannot be negative'],
    },
    notes: {
      type: String,
      trim: true,
      default: '',
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

const InventoryItem = mongoose.model('InventoryItem', inventoryItemSchema);

export default InventoryItem;
