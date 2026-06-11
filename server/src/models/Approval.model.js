import mongoose from 'mongoose';

const APPROVAL_DECISIONS = ['APPROVED', 'REJECTED', 'REQUESTED_CHANGES'];

const approvalSchema = new mongoose.Schema(
  {
    transactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction',
      required: [true, 'Transaction ID is required'],
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    decision: {
      type: String,
      enum: {
        values: APPROVAL_DECISIONS,
        message: `Decision must be one of: ${APPROVAL_DECISIONS.join(', ')}`,
      },
      required: [true, 'Decision is required'],
    },
    comment: {
      type: String,
      trim: true,
      default: '',
    },
    decidedAt: {
      type: Date,
      default: Date.now,
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

const Approval = mongoose.model('Approval', approvalSchema);

export default Approval;
