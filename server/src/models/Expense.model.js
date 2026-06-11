import mongoose from 'mongoose';
import { EXPENSE_CATEGORIES } from '../constants/expenseCategories.js';

const expenseSchema = new mongoose.Schema(
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
    category: {
      type: String,
      enum: {
        values: EXPENSE_CATEGORIES,
        message: `Category must be one of: ${EXPENSE_CATEGORIES.join(', ')}`,
      },
      required: [true, 'Category is required'],
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
    spentOnDate: {
      type: Date,
      required: [true, 'Spent-on date is required'],
    },
    description: {
      type: String,
      trim: true,
    },
    vendor: {
      type: String,
      trim: true,
    },
    quantity: {
      type: Number,
      min: [0, 'Quantity cannot be negative'],
    },
    unit: {
      type: String,
      trim: true,
    },
    note: {
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

const Expense = mongoose.model('Expense', expenseSchema);

export default Expense;
