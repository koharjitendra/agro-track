import { success } from '../../utils/apiResponse.js';
import { setAuthCookie, clearAuthCookie } from '../../utils/authCookie.js';
import * as authService from './service.js';

/**
 * POST /api/auth/register
 */
export const register = async (req, res, next) => {
  try {
    const { name, email, password, role, phone } = req.body;
    const result = await authService.registerUser({ name, email, password, role, phone });
    setAuthCookie(res, result.token);
    return success(res, { user: result.user }, 'User registered successfully.', 201);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/login
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.loginUser({ email, password });
    setAuthCookie(res, result.token);
    return success(res, { user: result.user }, 'Login successful.');
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/logout
 */
export const logout = async (_req, res) => {
  clearAuthCookie(res);
  return success(res, null, 'Logged out successfully.');
};

/**
 * GET /api/auth/me
 */
export const me = async (req, res, next) => {
  try {
    const user = await authService.getCurrentUser(req.user.id);
    return success(res, user, 'Current user fetched.');
  } catch (err) {
    next(err);
  }
};
