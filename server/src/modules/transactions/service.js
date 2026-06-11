import Transaction from '../../models/Transaction.model.js';
import TransactionRevision from '../../models/TransactionRevision.model.js';
import Approval from '../../models/Approval.model.js';
import User from '../../models/User.model.js';
import CropCycle from '../../models/CropCycle.model.js';
import PaymentReminder from '../../models/PaymentReminder.model.js';
import { ROLES } from '../../constants/roles.js';
import { TRANSACTION_STATUS } from '../../constants/transactionStatus.js';
import * as policy from './policy.js';

const assertUserRole = async (userId, expectedRole, label) => {
  const user = await User.findById(userId);
  if (!user || user.role !== expectedRole) {
    const err = new Error(`Invalid ${label}.`);
    err.statusCode = 404;
    throw err;
  }
  return user;
};

/**
 * Create a new transaction.
 */
export const createTransaction = async (userId, userRole, data) => {
  let farmerId, buyerId;

  if (userRole === ROLES.FARMER) {
    farmerId = userId;
    buyerId = data.buyerId;
    if (!buyerId) {
      const err = new Error('Buyer ID is required when a farmer creates a transaction.');
      err.statusCode = 400;
      throw err;
    }
    await assertUserRole(buyerId, ROLES.BUYER, 'buyer');
  } else {
    buyerId = userId;
    farmerId = data.farmerId;
    if (!farmerId) {
      const err = new Error('Farmer ID is required when a buyer creates a transaction.');
      err.statusCode = 400;
      throw err;
    }
    await assertUserRole(farmerId, ROLES.FARMER, 'farmer');
  }

  if (data.cropCycleId) {
    const cropCycle = await CropCycle.findOne({ _id: data.cropCycleId, farmerId });
    if (!cropCycle) {
      const err = new Error('Crop cycle not found for this farmer.');
      err.statusCode = 404;
      throw err;
    }
  }

  const totalAmount = data.quantity * data.pricePerUnit;
  const amountPaid = data.amountPaid || 0;
  const amountDue = totalAmount - amountPaid;

  let paymentStatus = 'DUE';
  if (amountPaid >= totalAmount) {
    paymentStatus = 'PAID';
  } else if (amountPaid > 0) {
    paymentStatus = 'PARTIAL';
  }

  const transaction = await Transaction.create({
    farmerId,
    buyerId,
    cropCycleId: data.cropCycleId || null,
    quantity: data.quantity,
    unit: data.unit || 'kg',
    pricePerUnit: data.pricePerUnit,
    totalAmount,
    transactionDate: data.transactionDate,
    paymentStatus,
    amountPaid,
    amountDue: amountDue < 0 ? 0 : amountDue,
    status: TRANSACTION_STATUS.PENDING,
    createdByUserId: userId,
    notes: data.notes || '',
  });

  return transaction.toJSON();
};

/**
 * List transactions for the current user (as farmer or buyer).
 */
export const listTransactions = async (userId, filters = {}) => {
  const query = {
    $or: [{ farmerId: userId }, { buyerId: userId }],
  };

  if (filters.status) {
    query.status = filters.status;
  }

  const page = Math.max(1, parseInt(filters.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(filters.limit, 10) || 50));
  const skip = (page - 1) * limit;

  const [transactions, total] = await Promise.all([
    Transaction.find(query)
      .populate('farmerId', 'name email phone')
      .populate('buyerId', 'name email phone')
      .populate('cropCycleId', 'cropName seasonYear')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Transaction.countDocuments(query),
  ]);

  return { items: transactions, total, page, limit };
};

/**
 * Get a single transaction with populated references.
 */
export const getTransactionById = async (transactionId, userId) => {
  const transaction = await Transaction.findById(transactionId)
    .populate('farmerId', 'name email phone')
    .populate('buyerId', 'name email phone')
    .populate('cropCycleId', 'cropName seasonYear status')
    .populate('createdByUserId', 'name email');

  if (!transaction) {
    const err = new Error('Transaction not found.');
    err.statusCode = 404;
    throw err;
  }

  // Ensure user is a party to this transaction
  const fId = transaction.farmerId._id.toString();
  const bId = transaction.buyerId._id.toString();
  if (userId !== fId && userId !== bId) {
    const err = new Error('You are not authorized to view this transaction.');
    err.statusCode = 403;
    throw err;
  }

  return transaction.toJSON();
};

/**
 * Update a transaction (only by creator, only when PENDING).
 */
export const updateTransaction = async (transactionId, userId, data) => {
  const transaction = await Transaction.findById(transactionId);
  if (!transaction) {
    const err = new Error('Transaction not found.');
    err.statusCode = 404;
    throw err;
  }

  const check = policy.canUpdate(transaction, userId);
  if (!check.allowed) {
    const err = new Error(check.reason);
    err.statusCode = 403;
    throw err;
  }

  if (data.quantity !== undefined) transaction.quantity = data.quantity;
  if (data.unit !== undefined) transaction.unit = data.unit;
  if (data.pricePerUnit !== undefined) transaction.pricePerUnit = data.pricePerUnit;
  if (data.transactionDate !== undefined) transaction.transactionDate = data.transactionDate;
  if (data.amountPaid !== undefined) transaction.amountPaid = data.amountPaid;
  if (data.notes !== undefined) transaction.notes = data.notes;
  if (data.cropCycleId !== undefined) transaction.cropCycleId = data.cropCycleId || null;

  // Recalculate derived fields
  transaction.totalAmount = transaction.quantity * transaction.pricePerUnit;
  transaction.amountDue = Math.max(0, transaction.totalAmount - transaction.amountPaid);

  if (transaction.amountPaid >= transaction.totalAmount) {
    transaction.paymentStatus = 'PAID';
  } else if (transaction.amountPaid > 0) {
    transaction.paymentStatus = 'PARTIAL';
  } else {
    transaction.paymentStatus = 'DUE';
  }

  await transaction.save();
  return transaction.toJSON();
};

/**
 * Approve a transaction → status = FINAL.
 */
export const approveTransaction = async (transactionId, userId) => {
  const transaction = await Transaction.findById(transactionId);
  if (!transaction) {
    const err = new Error('Transaction not found.');
    err.statusCode = 404;
    throw err;
  }

  const actCheck = policy.canActOnTransaction(transaction, userId);
  if (!actCheck.allowed) {
    const err = new Error(actCheck.reason);
    err.statusCode = 403;
    throw err;
  }

  const statusCheck = policy.canApproveOrReject(transaction);
  if (!statusCheck.allowed) {
    const err = new Error(statusCheck.reason);
    err.statusCode = 400;
    throw err;
  }

  transaction.status = TRANSACTION_STATUS.FINAL;
  await transaction.save();

  // Create approval record
  await Approval.create({
    transactionId: transaction._id,
    userId,
    decision: 'APPROVED',
    comment: '',
    decidedAt: new Date(),
  });

  return transaction.toJSON();
};

/**
 * Reject a transaction → status = REJECTED.
 */
export const rejectTransaction = async (transactionId, userId, comment = '') => {
  const transaction = await Transaction.findById(transactionId);
  if (!transaction) {
    const err = new Error('Transaction not found.');
    err.statusCode = 404;
    throw err;
  }

  const actCheck = policy.canActOnTransaction(transaction, userId);
  if (!actCheck.allowed) {
    const err = new Error(actCheck.reason);
    err.statusCode = 403;
    throw err;
  }

  const statusCheck = policy.canApproveOrReject(transaction);
  if (!statusCheck.allowed) {
    const err = new Error(statusCheck.reason);
    err.statusCode = 400;
    throw err;
  }

  transaction.status = TRANSACTION_STATUS.REJECTED;
  await transaction.save();

  await Approval.create({
    transactionId: transaction._id,
    userId,
    decision: 'REJECTED',
    comment,
    decidedAt: new Date(),
  });

  return transaction.toJSON();
};

/**
 * Request changes on a transaction → status = CHANGES_REQUESTED.
 */
export const requestChanges = async (transactionId, userId, comment) => {
  const transaction = await Transaction.findById(transactionId);
  if (!transaction) {
    const err = new Error('Transaction not found.');
    err.statusCode = 404;
    throw err;
  }

  const actCheck = policy.canActOnTransaction(transaction, userId);
  if (!actCheck.allowed) {
    const err = new Error(actCheck.reason);
    err.statusCode = 403;
    throw err;
  }

  const statusCheck = policy.canApproveOrReject(transaction);
  if (!statusCheck.allowed) {
    const err = new Error(statusCheck.reason);
    err.statusCode = 400;
    throw err;
  }

  if (!comment) {
    const err = new Error('A comment is required when requesting changes.');
    err.statusCode = 400;
    throw err;
  }

  transaction.status = TRANSACTION_STATUS.CHANGES_REQUESTED;
  await transaction.save();

  await Approval.create({
    transactionId: transaction._id,
    userId,
    decision: 'REQUESTED_CHANGES',
    comment,
    decidedAt: new Date(),
  });

  return transaction.toJSON();
};

/**
 * Revise a transaction after changes were requested.
 * Creates an immutable revision snapshot, then updates the transaction and resets to PENDING.
 */
export const reviseTransaction = async (transactionId, userId, data) => {
  const transaction = await Transaction.findById(transactionId);
  if (!transaction) {
    const err = new Error('Transaction not found.');
    err.statusCode = 404;
    throw err;
  }

  const check = policy.canRevise(transaction, userId);
  if (!check.allowed) {
    const err = new Error(check.reason);
    err.statusCode = 403;
    throw err;
  }

  // Determine the next revision number
  const lastRevision = await TransactionRevision.findOne({ transactionId: transaction._id })
    .sort({ revisionNo: -1 })
    .lean();
  const revisionNo = lastRevision ? lastRevision.revisionNo + 1 : 1;

  // Take a snapshot of the current state before changes
  const snapshot = transaction.toJSON();

  // Create the revision record (immutable audit trail)
  await TransactionRevision.create({
    transactionId: transaction._id,
    revisionNo,
    snapshotJson: snapshot,
    changeNote: data.changeNote || '',
    createdBy: userId,
  });

  // Apply changes to the transaction
  if (data.quantity !== undefined) transaction.quantity = data.quantity;
  if (data.unit !== undefined) transaction.unit = data.unit;
  if (data.pricePerUnit !== undefined) transaction.pricePerUnit = data.pricePerUnit;
  if (data.transactionDate !== undefined) transaction.transactionDate = data.transactionDate;
  if (data.amountPaid !== undefined) transaction.amountPaid = data.amountPaid;
  if (data.notes !== undefined) transaction.notes = data.notes;
  if (data.cropCycleId !== undefined) transaction.cropCycleId = data.cropCycleId || null;

  // Recalculate derived fields
  transaction.totalAmount = transaction.quantity * transaction.pricePerUnit;
  transaction.amountDue = Math.max(0, transaction.totalAmount - transaction.amountPaid);

  if (transaction.amountPaid >= transaction.totalAmount) {
    transaction.paymentStatus = 'PAID';
  } else if (transaction.amountPaid > 0) {
    transaction.paymentStatus = 'PARTIAL';
  } else {
    transaction.paymentStatus = 'DUE';
  }

  // Reset status back to PENDING for another round of review
  transaction.status = TRANSACTION_STATUS.PENDING;
  await transaction.save();

  return transaction.toJSON();
};

/**
 * List immutable revision snapshots for a transaction.
 */
export const getTransactionRevisions = async (transactionId, userId) => {
  const transaction = await Transaction.findById(transactionId);
  if (!transaction) {
    const err = new Error('Transaction not found.');
    err.statusCode = 404;
    throw err;
  }

  const fId = transaction.farmerId.toString();
  const bId = transaction.buyerId.toString();
  if (userId !== fId && userId !== bId) {
    const err = new Error('You are not authorized to view this transaction\'s revisions.');
    err.statusCode = 403;
    throw err;
  }

  const revisions = await TransactionRevision.find({ transactionId })
    .populate('createdBy', 'name role')
    .sort({ revisionNo: -1 })
    .lean();

  return revisions;
};

/**
 * Rate a finalized transaction.
 */
export const rateTransaction = async (transactionId, userId, rating, comment = '') => {
  const transaction = await Transaction.findById(transactionId);
  if (!transaction) {
    const err = new Error('Transaction not found.');
    err.statusCode = 404;
    throw err;
  }

  if (transaction.status !== 'FINAL') {
    const err = new Error('Only finalized transactions can be rated.');
    err.statusCode = 400;
    throw err;
  }

  const isFarmer = transaction.farmerId.toString() === userId;
  const isBuyer = transaction.buyerId.toString() === userId;

  if (!isFarmer && !isBuyer) {
    const err = new Error('Not authorized to rate this transaction.');
    err.statusCode = 403;
    throw err;
  }

  let targetUserId;
  if (isFarmer) {
    transaction.farmerRatingOfBuyer = rating;
    transaction.farmerRatingComment = comment;
    targetUserId = transaction.buyerId;
  } else {
    transaction.buyerRatingOfFarmer = rating;
    transaction.buyerRatingComment = comment;
    targetUserId = transaction.farmerId;
  }

  await transaction.save();

  // Recalculate target user's trust score
  const targetUser = await User.findById(targetUserId);
  if (targetUser) {
    targetUser.ratingsCount = (targetUser.ratingsCount || 0) + 1;
    targetUser.ratingsSum = (targetUser.ratingsSum || 0) + rating;
    targetUser.trustScore = Math.round((targetUser.ratingsSum / targetUser.ratingsCount) * 10) / 10;
    await targetUser.save();
  }

  return transaction.toJSON();
};

/**
 * Send a payment reminder for a due balance.
 */
export const sendPaymentReminder = async (transactionId, farmerId) => {
  const transaction = await Transaction.findById(transactionId);
  if (!transaction) {
    const err = new Error('Transaction not found.');
    err.statusCode = 404;
    throw err;
  }

  if (transaction.farmerId.toString() !== farmerId) {
    const err = new Error('Only the transaction farmer can send reminders.');
    err.statusCode = 403;
    throw err;
  }

  if (transaction.amountDue <= 0) {
    const err = new Error('This transaction has no outstanding due.');
    err.statusCode = 400;
    throw err;
  }

  const reminder = await PaymentReminder.create({
    farmerId,
    buyerId: transaction.buyerId,
    transactionId: transaction._id,
    amount: transaction.amountDue,
    date: new Date(),
    status: 'SENT'
  });

  return reminder.toJSON();
};
