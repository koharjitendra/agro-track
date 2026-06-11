import jwt from 'jsonwebtoken';
import config from '../config/env.js';

/**
 * Sign a JWT with the given payload.
 * @param {Object} payload - e.g. { id, role }
 * @returns {string} signed token
 */
export const signToken = (payload) => {
  const expiresIn = payload.role === 'ADMIN' ? '4h' : config.JWT_EXPIRES_IN;
  return jwt.sign(payload, config.JWT_SECRET, { expiresIn });
};

/**
 * Verify and decode a JWT.
 * @param {string} token
 * @returns {Object} decoded payload
 */
export const verifyToken = (token) => {
  return jwt.verify(token, config.JWT_SECRET);
};
