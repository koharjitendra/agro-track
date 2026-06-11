import { format, parseISO } from 'date-fns';

/**
 * Format date string/object to 'dd MMM yyyy' (e.g., 04 Jun 2026)
 */
export const formatDate = (dateInput) => {
  if (!dateInput) return 'N/A';
  try {
    const date = typeof dateInput === 'string' ? parseISO(dateInput) : new Date(dateInput);
    return format(date, 'dd MMM yyyy');
  } catch (error) {
    return 'Invalid Date';
  }
};

/**
 * Format date string/object to 'dd MMM yyyy, hh:mm a' (e.g., 04 Jun 2026, 09:30 AM)
 */
export const formatDateTime = (dateInput) => {
  if (!dateInput) return 'N/A';
  try {
    const date = typeof dateInput === 'string' ? parseISO(dateInput) : new Date(dateInput);
    return format(date, 'dd MMM yyyy, hh:mm a');
  } catch (error) {
    return 'Invalid Date';
  }
};
