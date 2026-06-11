import http from './http.js';

// Farmer analytics
export const getFarmerExpenseBreakdown = (cropCycleId) => {
  const url = cropCycleId ? `/analytics/farmer/expense-breakdown?cropCycleId=${cropCycleId}` : '/analytics/farmer/expense-breakdown';
  return http.get(url);
};
export const getFarmerExpensesTimeline = () => http.get('/analytics/farmer/expenses-timeline');
export const getFarmerSalesVsExpenses = () => http.get('/analytics/farmer/sales-vs-expenses');
export const getFarmerProfitSummary = () => http.get('/analytics/farmer/profit-summary');

// Buyer analytics
export const getBuyerPurchasesTimeline = () => http.get('/analytics/buyer/purchases-timeline');
export const getBuyerDueSummary = () => http.get('/analytics/buyer/due-summary');
export const getBuyerPaidVsDue = () => http.get('/analytics/buyer/paid-vs-due');
