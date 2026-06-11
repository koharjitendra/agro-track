import { TRANSACTION_STATUS } from '../../constants/transactionStatus.js';

/**
 * Check if the current user is the "other party" (not the creator) of the transaction.
 * Only the other party can approve, reject, or request changes.
 */
export const canActOnTransaction = (transaction, userId) => {
  const creatorId = transaction.createdByUserId.toString();
  const currentUserId = userId.toString();

  if (creatorId === currentUserId) {
    return {
      allowed: false,
      reason: 'You cannot approve/reject/request-changes on a transaction you created. Only the other party can.',
    };
  }

  // Ensure the user is actually a party to this transaction
  const farmerId = transaction.farmerId.toString();
  const buyerId = transaction.buyerId.toString();

  if (currentUserId !== farmerId && currentUserId !== buyerId) {
    return {
      allowed: false,
      reason: 'You are not a party to this transaction.',
    };
  }

  return { allowed: true };
};

/**
 * Check if a transaction can be approved or rejected.
 * Only PENDING transactions can be approved/rejected.
 */
export const canApproveOrReject = (transaction) => {
  if (transaction.status !== TRANSACTION_STATUS.PENDING) {
    return {
      allowed: false,
      reason: `Transaction cannot be approved/rejected. Current status: ${transaction.status}. Only PENDING transactions can be approved or rejected.`,
    };
  }
  return { allowed: true };
};

/**
 * Check if a transaction can be revised.
 * Only CHANGES_REQUESTED transactions can be revised, and only by the creator.
 */
export const canRevise = (transaction, userId) => {
  const creatorId = transaction.createdByUserId.toString();
  const currentUserId = userId.toString();

  if (creatorId !== currentUserId) {
    return {
      allowed: false,
      reason: 'Only the creator of the transaction can revise it.',
    };
  }

  if (transaction.status !== TRANSACTION_STATUS.CHANGES_REQUESTED) {
    return {
      allowed: false,
      reason: `Transaction cannot be revised. Current status: ${transaction.status}. Only CHANGES_REQUESTED transactions can be revised.`,
    };
  }

  return { allowed: true };
};

/**
 * Check if a transaction can be updated (edited).
 * Only the creator can update, and only when PENDING.
 */
export const canUpdate = (transaction, userId) => {
  const creatorId = transaction.createdByUserId.toString();
  const currentUserId = userId.toString();

  if (creatorId !== currentUserId) {
    return {
      allowed: false,
      reason: 'Only the creator of the transaction can update it.',
    };
  }

  if (transaction.status !== TRANSACTION_STATUS.PENDING) {
    return {
      allowed: false,
      reason: `Transaction cannot be updated. Current status: ${transaction.status}. Only PENDING transactions can be updated.`,
    };
  }

  return { allowed: true };
};
