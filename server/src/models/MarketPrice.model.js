import mongoose from 'mongoose';

const marketPriceSchema = new mongoose.Schema(
  {
    cropName: {
      type: String,
      required: [true, 'Crop name is required'],
      trim: true,
    },
    pricePerKg: {
      type: Number,
      required: [true, 'Price per KG is required'],
      min: [0, 'Price cannot be negative'],
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true,
    },
    district: {
      type: String,
      required: [true, 'District is required'],
      trim: true,
    },
    trend: {
      type: String,
      enum: ['UP', 'DOWN', 'STABLE'],
      default: 'STABLE',
    },
    history: [
      {
        date: { type: Date, default: Date.now },
        price: { type: Number, required: true },
      },
    ],
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

const MarketPrice = mongoose.model('MarketPrice', marketPriceSchema);

export default MarketPrice;
