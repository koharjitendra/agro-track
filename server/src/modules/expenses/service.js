import Expense from '../../models/Expense.model.js';
import CropCycle from '../../models/CropCycle.model.js';

/**
 * Create a new expense.
 */
export const createExpense = async (farmerId, data) => {
  // Verify the crop cycle belongs to this farmer
  const cropCycle = await CropCycle.findOne({ _id: data.cropCycleId, farmerId });
  if (!cropCycle) {
    const err = new Error('Crop cycle not found or does not belong to you.');
    err.statusCode = 404;
    throw err;
  }

  const expense = await Expense.create({
    cropCycleId: data.cropCycleId,
    farmerId,
    category: data.category,
    amount: data.amount,
    spentOnDate: data.spentOnDate,
    note: data.note || '',
    description: data.description || '',
    vendor: data.vendor || '',
    quantity: data.quantity,
    unit: data.unit || '',
  });

  return expense.toJSON();
};

/**
 * List expenses for a specific crop cycle.
 */
export const getExpensesByCropCycle = async (cropCycleId, farmerId) => {
  // Verify the crop cycle belongs to this farmer
  const cropCycle = await CropCycle.findOne({ _id: cropCycleId, farmerId });
  if (!cropCycle) {
    const err = new Error('Crop cycle not found or does not belong to you.');
    err.statusCode = 404;
    throw err;
  }

  const expenses = await Expense.find({ cropCycleId, farmerId }).sort({ spentOnDate: -1 }).lean();
  return expenses;
};

/**
 * Update an expense.
 */
export const updateExpense = async (expenseId, farmerId, data) => {
  const expense = await Expense.findOne({ _id: expenseId, farmerId });
  if (!expense) {
    const err = new Error('Expense not found.');
    err.statusCode = 404;
    throw err;
  }

  if (data.category !== undefined) expense.category = data.category;
  if (data.amount !== undefined) expense.amount = data.amount;
  if (data.spentOnDate !== undefined) expense.spentOnDate = data.spentOnDate;
  if (data.note !== undefined) expense.note = data.note;
  if (data.description !== undefined) expense.description = data.description;
  if (data.vendor !== undefined) expense.vendor = data.vendor;
  if (data.quantity !== undefined) expense.quantity = data.quantity;
  if (data.unit !== undefined) expense.unit = data.unit;

  await expense.save();
  return expense.toJSON();
};

/**
 * Delete an expense.
 */
export const deleteExpense = async (expenseId, farmerId) => {
  const expense = await Expense.findOne({ _id: expenseId, farmerId });
  if (!expense) {
    const err = new Error('Expense not found.');
    err.statusCode = 404;
    throw err;
  }

  await Expense.deleteOne({ _id: expense._id });
  return { deletedExpenseId: expenseId };
};
