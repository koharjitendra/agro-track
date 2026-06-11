/**
 * Formats a number to Indian Rupee (INR) currency style.
 * E.g., 125000 -> ₹1,25,000.00
 */
export const formatMoney = (amount) => {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return '₹0.00';
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};
