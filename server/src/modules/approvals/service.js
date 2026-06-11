import Transaction from '../../models/Transaction.model.js';
import Approval from '../../models/Approval.model.js';

/**
 * Get all transactions that are PENDING and require action from this user.
 * (User is farmer/buyer but did NOT create the transaction)
 */
export const getPendingApprovals = async (userId) => {
  const pendingTransactions = await Transaction.find({
    $or: [{ farmerId: userId }, { buyerId: userId }],
    createdByUserId: { $ne: userId },
    status: 'PENDING',
  })
    .populate('farmerId', 'name email phone')
    .populate('buyerId', 'name email phone')
    .populate('cropCycleId', 'cropName seasonYear')
    .sort({ createdAt: -1 })
    .lean();

  return pendingTransactions;
};

/**
 * Get the history of decisions (approvals/rejections/changes) for a given transaction.
 */
export const getApprovalHistory = async (transactionId, userId) => {
  const transaction = await Transaction.findById(transactionId);
  if (!transaction) {
    const err = new Error('Transaction not found.');
    err.statusCode = 404;
    throw err;
  }

  const fId = transaction.farmerId.toString();
  const bId = transaction.buyerId.toString();
  if (userId !== fId && userId !== bId) {
    const err = new Error('You are not authorized to view this transaction\'s approval history.');
    err.statusCode = 403;
    throw err;
  }

  const approvals = await Approval.find({ transactionId })
    .populate('userId', 'name email role')
    .sort({ decidedAt: -1 })
    .lean();

  return approvals;
};
