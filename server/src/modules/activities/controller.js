import { success } from '../../utils/apiResponse.js';
import * as activitiesService from './service.js';

export const list = async (req, res, next) => {
  try {
    const activities = await activitiesService.listActivities(req.params.cropCycleId, req.user.id);
    return success(res, activities, 'Farm activities fetched.');
  } catch (err) {
    next(err);
  }
};

export const create = async (req, res, next) => {
  try {
    const activity = await activitiesService.createActivity(req.user.id, req.params.cropCycleId, req.body);
    return success(res, activity, 'Farm activity logged.', 201);
  } catch (err) {
    next(err);
  }
};

export const update = async (req, res, next) => {
  try {
    const activity = await activitiesService.updateActivity(req.params.activityId, req.user.id, req.body);
    return success(res, activity, 'Farm activity updated.');
  } catch (err) {
    next(err);
  }
};

export const remove = async (req, res, next) => {
  try {
    const result = await activitiesService.deleteActivity(req.params.activityId, req.user.id);
    return success(res, result, 'Farm activity deleted.');
  } catch (err) {
    next(err);
  }
};
