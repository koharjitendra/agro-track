import * as reportsService from './service.js';
import { success } from '../../utils/apiResponse.js';

export const createReport = async (req, res, next) => {
  try {
    const report = await reportsService.createReport(req.user.id, req.user.role, req.body);
    return success(res, report, 'Report submitted successfully.', 201);
  } catch (err) {
    next(err);
  }
};

export const getMyReports = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const data = await reportsService.getMyReports(req.user.id, page, limit);
    return success(res, data, 'Your reports fetched.');
  } catch (err) {
    next(err);
  }
};

export const getReportById = async (req, res, next) => {
  try {
    const report = await reportsService.getReportById(req.params.id, req.user.id);
    return success(res, report, 'Report details fetched.');
  } catch (err) {
    next(err);
  }
};
