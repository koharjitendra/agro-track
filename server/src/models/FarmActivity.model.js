import mongoose from 'mongoose';

const farmActivitySchema = new mongoose.Schema(
  {
    cropCycleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CropCycle',
      required: [true, 'Crop cycle ID is required'],
      index: true,
    },
    farmerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Farmer ID is required'],
      index: true,
    },
    activityType: {
      type: String,
      enum: {
        values: ['IRRIGATION', 'FERTILIZER', 'PESTICIDE', 'HARVEST', 'OTHER'],
        message: 'Activity type must be IRRIGATION, FERTILIZER, PESTICIDE, HARVEST, or OTHER',
      },
      required: [true, 'Activity type is required'],
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
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

const FarmActivity = mongoose.model('FarmActivity', farmActivitySchema);

export default FarmActivity;
