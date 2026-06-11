import { success } from '../../utils/apiResponse.js';
import * as cropCyclesService from './service.js';

/**
 * POST /api/crop-cycles
 */
export const create = async (req, res, next) => {
  try {
    const cropCycle = await cropCyclesService.createCropCycle(req.user.id, req.body);
    return success(res, cropCycle, 'Crop cycle created.', 201);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/crop-cycles
 */
export const list = async (req, res, next) => {
  try {
    const cycles = await cropCyclesService.listCropCycles(req.user.id);
    return success(res, cycles, 'Crop cycles fetched.');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/crop-cycles/:id
 */
export const getById = async (req, res, next) => {
  try {
    const cycle = await cropCyclesService.getCropCycleById(req.params.id, req.user.id);
    return success(res, cycle, 'Crop cycle fetched.');
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/crop-cycles/:id
 */
export const update = async (req, res, next) => {
  try {
    const cycle = await cropCyclesService.updateCropCycle(req.params.id, req.user.id, req.body);
    return success(res, cycle, 'Crop cycle updated.');
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/crop-cycles/:id
 */
export const remove = async (req, res, next) => {
  try {
    const result = await cropCyclesService.deleteCropCycle(req.params.id, req.user.id);
    return success(res, result, 'Crop cycle and associated expenses deleted.');
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/crop-cycles/:id/stage
 */
export const updateStage = async (req, res, next) => {
  try {
    const cycle = await cropCyclesService.updateGrowthStage(
      req.params.id,
      req.user.id,
      req.body.stage,
      req.body.notes
    );
    return success(res, cycle, 'Growth stage updated.');
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/crop-cycles/:id/reminders
 */
export const addReminder = async (req, res, next) => {
  try {
    const cycle = await cropCyclesService.addReminder(
      req.params.id,
      req.user.id,
      req.body.title,
      req.body.date
    );
    return success(res, cycle, 'Reminder added.');
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/crop-cycles/:id/reminders/:reminderId
 */
export const toggleReminder = async (req, res, next) => {
  try {
    const cycle = await cropCyclesService.toggleReminder(
      req.params.id,
      req.user.id,
      req.params.reminderId
    );
    return success(res, cycle, 'Reminder status toggled.');
  } catch (err) {
    next(err);
  }
};
