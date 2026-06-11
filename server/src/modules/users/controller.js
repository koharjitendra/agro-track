import { success } from '../../utils/apiResponse.js';
import * as usersService from './service.js';

/**
 * GET /api/users/profile
 */
export const getProfile = async (req, res, next) => {
  try {
    const user = await usersService.getProfile(req.user.id);
    return success(res, user, 'Profile fetched.');
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/users/profile
 */
export const updateProfile = async (req, res, next) => {
  try {
    const user = await usersService.updateProfile(req.user.id, req.body);
    return success(res, user, 'Profile updated.');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/users/search?role=FARMER&search=raj
 */
export const searchUsers = async (req, res, next) => {
  try {
    const { role, search } = req.query;
    const users = await usersService.searchUsers(role, search);
    return success(res, users, 'Counterparties fetched.');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/users/profile/:id
 */
export const getProfileById = async (req, res, next) => {
  try {
    const user = await usersService.getProfileById(req.params.id);
    return success(res, user, 'User profile fetched.');
  } catch (err) {
    next(err);
  }
};
