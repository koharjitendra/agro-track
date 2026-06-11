import * as adminService from './service.js';
import { success } from '../../utils/apiResponse.js';

export const getStats = async (req, res, next) => {
  try {
    const stats = await adminService.getAdminStats();
    return success(res, stats, 'Admin dashboard statistics fetched.');
  } catch (err) {
    next(err);
  }
};

export const getReports = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const data = await adminService.getReports({
      status: req.query.status,
      category: req.query.category,
      reporterRole: req.query.reporterRole,
      search: req.query.search,
      page,
      limit,
    });
    return success(res, data, 'All reports fetched.');
  } catch (err) {
    next(err);
  }
};

export const respondToReport = async (req, res, next) => {
  try {
    const { adminResponse, status } = req.body;
    const report = await adminService.respondToReport(
      req.params.id,
      adminResponse,
      status || 'RESOLVED',
      req.user.id
    );
    return success(res, report, 'Report response saved and user notified.');
  } catch (err) {
    next(err);
  }
};

export const editReport = async (req, res, next) => {
  try {
    const report = await adminService.editReport(req.params.id, req.body, req.user.id);
    return success(res, report, 'Report updated.');
  } catch (err) {
    next(err);
  }
};

export const deleteReport = async (req, res, next) => {
  try {
    const result = await adminService.deleteReport(req.params.id, req.user.id);
    return success(res, result, 'Report deleted successfully.');
  } catch (err) {
    next(err);
  }
};

export const getUsers = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const data = await adminService.getUsers({
      role: req.query.role,
      status: req.query.status,
      search: req.query.search,
      sort: req.query.sort,
      page,
      limit,
    });
    return success(res, data, 'Platform users fetched.');
  } catch (err) {
    next(err);
  }
};

export const getUserProfileDetails = async (req, res, next) => {
  try {
    const details = await adminService.getUserProfileDetails(req.params.id);
    return success(res, details, 'Detailed user profile fetched.');
  } catch (err) {
    next(err);
  }
};

export const updateUserProfile = async (req, res, next) => {
  try {
    const user = await adminService.updateUserProfile(req.params.id, req.body, req.user.id);
    return success(res, user, 'User profile updated.');
  } catch (err) {
    next(err);
  }
};

export const blockUser = async (req, res, next) => {
  try {
    const user = await adminService.blockUser(req.params.id, req.user.id);
    return success(res, user, 'User has been blocked.');
  } catch (err) {
    next(err);
  }
};

export const unblockUser = async (req, res, next) => {
  try {
    const user = await adminService.unblockUser(req.params.id, req.user.id);
    return success(res, user, 'User has been unblocked.');
  } catch (err) {
    next(err);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const result = await adminService.deleteUser(req.params.id, req.user.id);
    return success(res, result, 'User deleted permanently.');
  } catch (err) {
    next(err);
  }
};

export const getAuditLogs = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const data = await adminService.getAuditLogs(page, limit);
    return success(res, data, 'Audit logs fetched.');
  } catch (err) {
    next(err);
  }
};
