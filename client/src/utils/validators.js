/**
 * Checks if an email is valid.
 */
export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
};

/**
 * Validates password strength (min 10 chars, letter + number)
 */
export const validatePassword = (password) => {
  if (!password || password.length < 10) return false;
  return /[a-zA-Z]/.test(password) && /[0-9]/.test(password);
};

export const passwordHint = 'At least 10 characters with one letter and one number';

/**
 * Validates if value is provided
 */
export const validateRequired = (value) => {
  if (value === undefined || value === null) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  return true;
};
