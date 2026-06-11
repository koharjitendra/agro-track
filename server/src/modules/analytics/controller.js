import { success } from '../../utils/apiResponse.js';
import * as analyticsService from './service.js';

// --- Farmer Analytics Controllers ---

export const getFarmerExpenseBreakdown = async (req, res, next) => {
  try {
    const { cropCycleId } = req.query;
    const data = await analyticsService.getFarmerExpenseBreakdown(req.user.id, cropCycleId);
    return success(res, data, 'Farmer expense breakdown fetched.');
  } catch (err) {
    next(err);
  }
};

export const getFarmerExpensesTimeline = async (req, res, next) => {
  try {
    const data = await analyticsService.getFarmerExpensesTimeline(req.user.id);
    return success(res, data, 'Farmer expenses timeline fetched.');
  } catch (err) {
    next(err);
  }
};

export const getFarmerSalesVsExpenses = async (req, res, next) => {
  try {
    const data = await analyticsService.getFarmerSalesVsExpenses(req.user.id);
    return success(res, data, 'Farmer sales vs expenses fetched.');
  } catch (err) {
    next(err);
  }
};

export const getFarmerProfitSummary = async (req, res, next) => {
  try {
    const data = await analyticsService.getFarmerProfitSummary(req.user.id);
    return success(res, data, 'Farmer profit summary fetched.');
  } catch (err) {
    next(err);
  }
};

// --- Buyer Analytics Controllers ---

export const getBuyerPurchasesTimeline = async (req, res, next) => {
  try {
    const data = await analyticsService.getBuyerPurchasesTimeline(req.user.id);
    return success(res, data, 'Buyer purchases timeline fetched.');
  } catch (err) {
    next(err);
  }
};

export const getBuyerDueSummary = async (req, res, next) => {
  try {
    const data = await analyticsService.getBuyerDueSummary(req.user.id);
    return success(res, data, 'Buyer due summary fetched.');
  } catch (err) {
    next(err);
  }
};

export const getBuyerPaidVsDue = async (req, res, next) => {
  try {
    const data = await analyticsService.getBuyerPaidVsDue(req.user.id);
    return success(res, data, 'Buyer paid vs due summary fetched.');
  } catch (err) {
    next(err);
  }
};
