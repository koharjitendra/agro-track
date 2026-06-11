import { success } from '../../utils/apiResponse.js';
import * as transactionsService from './service.js';

/**
 * POST /api/transactions
 */
export const create = async (req, res, next) => {
  try {
    const transaction = await transactionsService.createTransaction(req.user.id, req.user.role, req.body);
    return success(res, transaction, 'Transaction created.', 201);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/transactions
 */
export const list = async (req, res, next) => {
  try {
    const filters = {
      status: req.query.status,
      page: req.query.page,
      limit: req.query.limit,
    };
    const result = await transactionsService.listTransactions(req.user.id, filters);
    return success(res, result, 'Transactions fetched.');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/transactions/:id/revisions
 */
export const getRevisions = async (req, res, next) => {
  try {
    const revisions = await transactionsService.getTransactionRevisions(req.params.id, req.user.id);
    return success(res, revisions, 'Transaction revisions fetched.');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/transactions/:id
 */
export const getById = async (req, res, next) => {
  try {
    const transaction = await transactionsService.getTransactionById(req.params.id, req.user.id);
    return success(res, transaction, 'Transaction fetched.');
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/transactions/:id
 */
export const update = async (req, res, next) => {
  try {
    const transaction = await transactionsService.updateTransaction(req.params.id, req.user.id, req.body);
    return success(res, transaction, 'Transaction updated.');
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/transactions/:id/approve
 */
export const approve = async (req, res, next) => {
  try {
    const transaction = await transactionsService.approveTransaction(req.params.id, req.user.id);
    return success(res, transaction, 'Transaction approved.');
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/transactions/:id/reject
 */
export const reject = async (req, res, next) => {
  try {
    const { comment } = req.body;
    const transaction = await transactionsService.rejectTransaction(req.params.id, req.user.id, comment);
    return success(res, transaction, 'Transaction rejected.');
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/transactions/:id/request-changes
 */
export const requestChanges = async (req, res, next) => {
  try {
    const { comment } = req.body;
    const transaction = await transactionsService.requestChanges(req.params.id, req.user.id, comment);
    return success(res, transaction, 'Changes requested on transaction.');
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/transactions/:id/revise
 */
export const revise = async (req, res, next) => {
  try {
    const transaction = await transactionsService.reviseTransaction(req.params.id, req.user.id, req.body);
    return success(res, transaction, 'Transaction revised and resubmitted for approval.');
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/transactions/:id/rate
 */
export const rate = async (req, res, next) => {
  try {
    const { rating, comment } = req.body;
    const transaction = await transactionsService.rateTransaction(req.params.id, req.user.id, rating, comment);
    return success(res, transaction, 'Transaction rated successfully.');
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/transactions/:id/remind
 */
export const remind = async (req, res, next) => {
  try {
    const reminder = await transactionsService.sendPaymentReminder(req.params.id, req.user.id);
    return success(res, reminder, 'Payment reminder sent.');
  } catch (err) {
    next(err);
  }
};
