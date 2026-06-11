import FarmActivity from '../../models/FarmActivity.model.js';
import CropCycle from '../../models/CropCycle.model.js';

export const listActivities = async (cropCycleId, farmerId) => {
  const cropCycle = await CropCycle.findOne({ _id: cropCycleId, farmerId });
  if (!cropCycle) {
    const err = new Error('Crop cycle not found');
    err.statusCode = 404;
    throw err;
  }
  return await FarmActivity.find({ cropCycleId, farmerId }).sort({ date: -1 });
};

export const createActivity = async (farmerId, cropCycleId, data) => {
  const cropCycle = await CropCycle.findOne({ _id: cropCycleId, farmerId });
  if (!cropCycle) {
    const err = new Error('Crop cycle not found');
    err.statusCode = 404;
    throw err;
  }
  const activity = await FarmActivity.create({
    cropCycleId,
    farmerId,
    activityType: data.activityType,
    date: data.date,
    description: data.description,
    notes: data.notes || '',
  });
  return activity.toJSON();
};

export const updateActivity = async (activityId, farmerId, data) => {
  const activity = await FarmActivity.findOne({ _id: activityId, farmerId });
  if (!activity) {
    const err = new Error('Activity not found');
    err.statusCode = 404;
    throw err;
  }
  if (data.activityType !== undefined) activity.activityType = data.activityType;
  if (data.date !== undefined) activity.date = data.date;
  if (data.description !== undefined) activity.description = data.description;
  if (data.notes !== undefined) activity.notes = data.notes;

  await activity.save();
  return activity.toJSON();
};

export const deleteActivity = async (activityId, farmerId) => {
  const activity = await FarmActivity.findOne({ _id: activityId, farmerId });
  if (!activity) {
    const err = new Error('Activity not found');
    err.statusCode = 404;
    throw err;
  }
  await FarmActivity.deleteOne({ _id: activityId });
  return { deletedActivityId: activityId };
};
