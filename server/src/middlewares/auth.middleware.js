import { verifyToken } from '../utils/jwt.js';
import { getTokenFromRequest } from '../utils/authCookie.js';
import { error } from '../utils/apiResponse.js';
import User from '../models/User.model.js';

/**
 * Authentication middleware.
 * Reads JWT from httpOnly cookie or Authorization header.
 */
export const authenticate = async (req, res, next) => {
  try {
    const token = getTokenFromRequest(req);

    if (!token) {
      return error(res, 'Authentication required. Please log in.', 401);
    }

    const decoded = verifyToken(token);
    
    const user = await User.findById(decoded.id);
    if (!user) {
      return error(res, 'User no longer exists.', 401);
    }

    if (user.accountStatus === 'BLOCKED' || user.accountStatus === 'SUSPENDED') {
      return error(res, 'Your account has been temporarily blocked. Please contact administrator.', 403);
    }

    req.user = { id: user._id, role: user.role };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return error(res, 'Token has expired. Please log in again.', 401);
    }
    if (err.name === 'JsonWebTokenError') {
      return error(res, 'Invalid token. Please log in again.', 401);
    }
    return error(res, 'Authentication failed.', 401);
  }
};
