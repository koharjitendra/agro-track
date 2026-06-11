import User from '../../models/User.model.js';
import { hashPassword, comparePassword } from '../../utils/hash.js';
import { signToken } from '../../utils/jwt.js';

/**
 * Register a new user.
 */
export const registerUser = async ({ name, email, password, role, phone }) => {
  // Check if email already exists
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    const err = new Error('A user with this email already exists.');
    err.statusCode = 409;
    throw err;
  }

  const passwordHash = await hashPassword(password);

  const user = await User.create({
    name,
    email: email.toLowerCase(),
    phone: phone || '',
    passwordHash,
    role,
  });

  const token = signToken({ id: user._id, role: user.role });

  return { user: user.toJSON(), token };
};

/**
 * Login an existing user.
 */
export const loginUser = async ({ email, password }) => {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    const err = new Error('Invalid email or password.');
    err.statusCode = 401;
    throw err;
  }

  if (user.accountStatus === 'BLOCKED' || user.accountStatus === 'SUSPENDED') {
    const err = new Error('Your account has been temporarily blocked. Please contact administrator.');
    err.statusCode = 403;
    throw err;
  }

  const isMatch = await comparePassword(password, user.passwordHash);
  if (!isMatch) {
    const err = new Error('Invalid email or password.');
    err.statusCode = 401;
    throw err;
  }

  user.lastLogin = new Date();
  await user.save();

  const token = signToken({ id: user._id, role: user.role });

  return { user: user.toJSON(), token };
};

/**
 * Get the current authenticated user.
 */
export const getCurrentUser = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    const err = new Error('User not found.');
    err.statusCode = 404;
    throw err;
  }
  return user.toJSON();
};
