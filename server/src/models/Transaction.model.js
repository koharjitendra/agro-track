import mongoose from 'mongoose';
import { PAYMENT_STATUS_ARRAY } from '../constants/paymentStatus.js';
import { TRANSACTION_STATUS_ARRAY } from '../constants/transactionStatus.js';

const transactionSchema = new mongoose.Schema(
  {
    farmerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Farmer ID is required'],
      index: true,
    },
    buyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Buyer ID is required'],
      index: true,
    },
    cropCycleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CropCycle',
      default: null,
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [0, 'Quantity cannot be negative'],
    },
    unit: {
      type: String,
      default: 'kg',
      trim: true,
    },
    pricePerUnit: {
      type: Number,
      required: [true, 'Price per unit is required'],
      min: [0, 'Price per unit cannot be negative'],
    },
    totalAmount: {
      type: Number,
      required: [true, 'Total amount is required'],
      min: [0, 'Total amount cannot be negative'],
    },
    transactionDate: {
      type: Date,
      required: [true, 'Transaction date is required'],
    },
    paymentStatus: {
      type: String,
      enum: {
        values: PAYMENT_STATUS_ARRAY,
        message: `Payment status must be one of: ${PAYMENT_STATUS_ARRAY.join(', ')}`,
      },
      default: 'DUE',
    },
    amountPaid: {
      type: Number,
      default: 0,
      min: [0, 'Amount paid cannot be negative'],
    },
    amountDue: {
      type: Number,
      default: 0,
      min: [0, 'Amount due cannot be negative'],
    },
    status: {
      type: String,
      enum: {
        values: TRANSACTION_STATUS_ARRAY,
        message: `Status must be one of: ${TRANSACTION_STATUS_ARRAY.join(', ')}`,
      },
      default: 'PENDING',
    },
    createdByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Created-by user ID is required'],
    },
    buyerRatingOfFarmer: {
      type: Number,
      min: 1,
      max: 5,
    },
    farmerRatingOfBuyer: {
      type: Number,
      min: 1,
      max: 5,
    },
    buyerRatingComment: {
      type: String,
      trim: true,
      default: '',
    },
    farmerRatingComment: {
      type: String,
      trim: true,
      default: '',
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

const Transaction = mongoose.model('Transaction', transactionSchema);

export default Transaction;
