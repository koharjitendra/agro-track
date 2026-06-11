import mongoose from 'mongoose';

const CROP_CYCLE_STATUSES = ['ACTIVE', 'COMPLETED', 'CANCELLED'];
const CROP_STATUSES = ['GROWING', 'READY_FOR_HARVEST', 'AVAILABLE_FOR_SALE', 'RESERVED', 'SOLD'];

const cropCycleSchema = new mongoose.Schema(
  {
    farmerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Farmer ID is required'],
      index: true,
    },
    cropName: {
      type: String,
      required: [true, 'Crop name is required'],
      trim: true,
      maxlength: [100, 'Crop name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    seasonYear: { type: String, trim: true, default: '' },
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    status: {
      type: String,
      enum: { values: CROP_CYCLE_STATUSES, message: 'Status must be ACTIVE, COMPLETED, or CANCELLED' },
      default: 'ACTIVE',
    },
    area: { type: Number, min: [0, 'Area cannot be negative'] },
    expectedHarvestDate: { type: Date },
    seedVariety: { type: String, trim: true },
    location: { type: String, trim: true },
    availableQuantity: { type: Number, min: [0, 'Quantity cannot be negative'], default: 0 },
    pricePerUnit: { type: Number, min: [0, 'Price cannot be negative'], default: 0 },
    investmentAmount: { type: Number, min: [0, 'Investment amount cannot be negative'], default: 0 },
    cropStatus: {
      type: String,
      enum: { values: CROP_STATUSES, message: `Crop status must be one of: ${CROP_STATUSES.join(', ')}` },
      default: 'GROWING',
    },
    cropImage: { type: String, trim: true, default: '' },
    isListedOnMarketplace: { type: Boolean, default: false },
    growthStage: {
      type: String,
      enum: ['SEEDLING', 'VEGETATIVE', 'FLOWERING', 'YIELDING', 'HARVESTED'],
      default: 'SEEDLING',
    },
    growthStageLog: [
      {
        stage: String,
        date: { type: Date, default: Date.now },
        notes: { type: String, default: '' },
      },
    ],
    stageReminders: [
      {
        title: String,
        date: Date,
        completed: { type: Boolean, default: false },
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

const CropCycle = mongoose.model('CropCycle', cropCycleSchema);
export default CropCycle;
