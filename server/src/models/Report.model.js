import mongoose from 'mongoose';
import { ROLES } from '../constants/roles.js';

const REPORT_STATUSES = ['OPEN', 'UNDER_REVIEW', 'RESOLVED', 'CLOSED'];
const REPORT_CATEGORIES = [
  'BUG',
  'ORDER_ISSUE',
  'DELIVERY_ISSUE',
  'PAYMENT_ISSUE',
  'MARKETPLACE_ISSUE',
  'FEATURE_REQUEST',
  'SUGGESTION',
  'OTHER'
];

const reportSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    category: {
      type: String,
      enum: {
        values: REPORT_CATEGORIES,
        message: `Category must be one of: ${REPORT_CATEGORIES.join(', ')}`,
      },
      required: [true, 'Category is required'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      minlength: [20, 'Description must be at least 20 characters long'],
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
      trim: true,
    },
    status: {
      type: String,
      enum: REPORT_STATUSES,
      default: 'OPEN',
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Reporter ID is required'],
    },
    userRole: {
      type: String,
      enum: [ROLES.BUYER, ROLES.FARMER],
      required: true,
    },
    adminResponse: {
      type: String,
      default: null,
    },
    respondedAt: {
      type: Date,
      default: null,
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

reportSchema.index({ reportedBy: 1 });
reportSchema.index({ status: 1 });
reportSchema.index({ category: 1 });
reportSchema.index({ createdAt: -1 });

const Report = mongoose.model('Report', reportSchema);
export default Report;
