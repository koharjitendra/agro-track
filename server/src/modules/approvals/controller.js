import { success } from '../../utils/apiResponse.js';
import * as approvalsService from './service.js';

/**
 * GET /api/approvals/pending
 */
export const getPending = async (req, res, next) => {
  try {
    const pending = await approvalsService.getPendingApprovals(req.user.id);
    return success(res, pending, 'Pending approvals fetched.');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/approvals/transaction/:transactionId
 */
export const getHistory = async (req, res, next) => {
  try {
    const history = await approvalsService.getApprovalHistory(req.params.transactionId, req.user.id);
    return success(res, history, 'Approval history fetched.');
  } catch (err) {
    next(err);
  }
};
