import * as prService from './service.js';
import { success } from '../../utils/apiResponse.js';

export const createPurchaseRequest = async (req, res, next) => {
  try {
    const pr = await prService.createPurchaseRequest(req.user.id, req.body);
    return success(res, pr, 'Purchase request created successfully', 201);
  } catch (err) {
    next(err);
  }
};

export const getPurchaseRequests = async (req, res, next) => {
  try {
    const query = {};
    if (req.user.role === 'FARMER') query.farmerId = req.user.id;
    else if (req.user.role === 'BUYER') query.buyerId = req.user.id;
    if (req.query.status) query.status = req.query.status;
    if (req.query.cropCycleId) query.cropCycleId = req.query.cropCycleId;
    const requests = await prService.getPurchaseRequests(query);
    return success(res, requests, 'Purchase requests fetched successfully');
  } catch (err) {
    next(err);
  }
};

export const updatePurchaseRequestStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const pr = await prService.updatePurchaseRequestStatus(id, req.user.id, status);
    return success(res, pr, `Purchase request ${status.toLowerCase()} successfully`);
  } catch (err) {
    next(err);
  }
};
