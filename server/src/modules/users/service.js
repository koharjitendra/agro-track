import User from '../../models/User.model.js';
import { ROLES_ARRAY } from '../../constants/roles.js';
import { escapeRegex } from '../../utils/escapeRegex.js';

/**
 * Get user profile by ID.
 */
export const getProfile = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    const err = new Error('User not found.');
    err.statusCode = 404;
    throw err;
  }
  return user.toJSON();
};

/**
 * Update user profile (name, phone, location, experienceYears, bio).
 */
export const updateProfile = async (userId, data) => {
  const user = await User.findById(userId);
  if (!user) {
    const err = new Error('User not found.');
    err.statusCode = 404;
    throw err;
  }

  if (data.name !== undefined) user.name = data.name;
  if (data.phone !== undefined) user.phone = data.phone;
  if (data.location !== undefined) user.location = data.location;
  if (data.latitude !== undefined) user.latitude = data.latitude;
  if (data.longitude !== undefined) user.longitude = data.longitude;
  if (data.experienceYears !== undefined) user.experienceYears = data.experienceYears;
  if (data.bio !== undefined) user.bio = data.bio;

  // Address fields
  if (data.fullName !== undefined) user.fullName = data.fullName;
  if (data.addressLine1 !== undefined) user.addressLine1 = data.addressLine1;
  if (data.addressLine2 !== undefined) user.addressLine2 = data.addressLine2;
  if (data.village !== undefined) user.village = data.village;
  if (data.city !== undefined) user.city = data.city;
  if (data.district !== undefined) user.district = data.district;
  if (data.state !== undefined) user.state = data.state;
  if (data.country !== undefined) user.country = data.country;
  if (data.postalCode !== undefined) user.postalCode = data.postalCode;


  await user.save();
  return user.toJSON();
};

/**
 * Search users by role for counterparty lookup.
 */
export const searchUsers = async (role, search) => {
  const normalizedRole = role?.toUpperCase();
  if (!normalizedRole || !ROLES_ARRAY.includes(normalizedRole)) {
    const err = new Error(`Query parameter "role" is required and must be one of: ${ROLES_ARRAY.join(', ')}`);
    err.statusCode = 400;
    throw err;
  }

  const filter = { role: normalizedRole };

  if (search) {
    const term = escapeRegex(String(search).slice(0, 100));
    filter.$or = [
      { name: { $regex: term, $options: 'i' } },
      { email: { $regex: term, $options: 'i' } },
    ];
  }

  const users = await User.find(filter).select('name role email phone location experienceYears trustScore bio').lean();
  return users;
};

/**
 * Get user profile by ID.
 */
export const getProfileById = async (userId) => {
  const user = await User.findById(userId).select('-passwordHash');
  if (!user) {
    const err = new Error('User not found.');
    err.statusCode = 404;
    throw err;
  }
  return user.toJSON();
};
