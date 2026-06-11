import { success } from '../../utils/apiResponse.js';
import * as expensesService from './service.js';

/**
 * POST /api/expenses
 */
export const create = async (req, res, next) => {
  try {
    const expense = await expensesService.createExpense(req.user.id, req.body);
    return success(res, expense, 'Expense created.', 201);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/expenses/crop-cycle/:cropCycleId
 */
export const listByCropCycle = async (req, res, next) => {
  try {
    const expenses = await expensesService.getExpensesByCropCycle(req.params.cropCycleId, req.user.id);
    return success(res, expenses, 'Expenses fetched.');
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/expenses/:id
 */
export const update = async (req, res, next) => {
  try {
    const expense = await expensesService.updateExpense(req.params.id, req.user.id, req.body);
    return success(res, expense, 'Expense updated.');
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/expenses/:id
 */
export const remove = async (req, res, next) => {
  try {
    const result = await expensesService.deleteExpense(req.params.id, req.user.id);
    return success(res, result, 'Expense deleted.');
  } catch (err) {
    next(err);
  }
};
