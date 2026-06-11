import mongoose from 'mongoose';

const transactionRevisionSchema = new mongoose.Schema(
  {
    transactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction',
      required: [true, 'Transaction ID is required'],
      index: true,
    },
    revisionNo: {
      type: Number,
      required: [true, 'Revision number is required'],
    },
    snapshotJson: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, 'Snapshot JSON is required'],
    },
    changeNote: {
      type: String,
      trim: true,
      default: '',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Created-by user ID is required'],
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

// Compound index for fast lookups
transactionRevisionSchema.index({ transactionId: 1, revisionNo: 1 }, { unique: true });

const TransactionRevision = mongoose.model('TransactionRevision', transactionRevisionSchema);

export default TransactionRevision;
