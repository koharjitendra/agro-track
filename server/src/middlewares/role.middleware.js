import { error } from '../utils/apiResponse.js';

/**
 * Role-based authorization middleware.
 * @param  {...string} roles - Allowed roles (e.g. 'FARMER', 'BUYER')
 * @returns Express middleware
 */
export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return error(res, 'Authentication required.', 401);
    }

    if (!roles.includes(req.user.role)) {
      return error(
        res,
        `Access denied. Required role(s): ${roles.join(', ')}. Your role: ${req.user.role}.`,
        403
      );
    }

    next();
  };
};
