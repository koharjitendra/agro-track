import mongoose from 'mongoose';
import CropCycle from '../../models/CropCycle.model.js';
import Expense from '../../models/Expense.model.js';
import Transaction from '../../models/Transaction.model.js';

export const createCropCycle = async (farmerId, data) => {
  const cropCycle = await CropCycle.create({
    farmerId,
    cropName: data.cropName,
    description: data.description || '',
    seasonYear: data.seasonYear || '',
    startDate: data.startDate || null,
    endDate: data.endDate || null,
    status: data.status || 'ACTIVE',
    area: data.area,
    expectedHarvestDate: data.expectedHarvestDate || null,
    seedVariety: data.seedVariety || '',
    location: data.location || '',
    pricePerUnit: data.pricePerUnit || 0,
    availableQuantity: data.availableQuantity || 0,
    investmentAmount: data.investmentAmount || 0,
    cropStatus: data.cropStatus || 'GROWING',
    cropImage: data.cropImage || '',
    isListedOnMarketplace: data.isListedOnMarketplace || false,
    growthStage: data.growthStage || 'SEEDLING',
    growthStageLog: [{ stage: data.growthStage || 'SEEDLING', date: new Date(), notes: 'Initial stage logged' }],
  });
  return cropCycle.toJSON();
};

export const listCropCycles = async (farmerId) => {
  const farmerObjectId = new mongoose.Types.ObjectId(farmerId);

  const cycles = await CropCycle.aggregate([
    { $match: { farmerId: farmerObjectId } },
    { $sort: { createdAt: -1 } },
    {
      $lookup: {
        from: 'expenses',
        localField: '_id',
        foreignField: 'cropCycleId',
        as: 'expenses',
      },
    },
    {
      $lookup: {
        from: 'transactions',
        localField: '_id',
        foreignField: 'cropCycleId',
        as: 'transactions',
      },
    },
    {
      $addFields: {
        totalExpenses: { $sum: '$expenses.amount' },
        expenseCount: { $size: '$expenses' },
        totalRevenue: {
          $sum: {
            $map: {
              input: {
                $filter: {
                  input: '$transactions',
                  as: 'tx',
                  cond: { $eq: ['$$tx.status', 'FINAL'] },
                },
              },
              as: 'finalTx',
              in: '$$finalTx.totalAmount',
            },
          },
        },
      },
    },
    { $project: { expenses: 0, transactions: 0, __v: 0 } },
  ]);

  return cycles;
};

export const getCropCycleById = async (cropCycleId, farmerId) => {
  const cropCycle = await CropCycle.findOne({ _id: cropCycleId, farmerId });
  if (!cropCycle) {
    const err = new Error('Crop cycle not found.');
    err.statusCode = 404;
    throw err;
  }

  const expenseSummary = await Expense.aggregate([
    { $match: { cropCycleId: new mongoose.Types.ObjectId(cropCycleId) } },
    { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
    { $sort: { total: -1 } },
  ]);

  const totalExpenses = expenseSummary.reduce((sum, item) => sum + item.total, 0);

  const revenueSummary = await Transaction.aggregate([
    { $match: { cropCycleId: new mongoose.Types.ObjectId(cropCycleId), status: 'FINAL' } },
    { $group: { _id: null, total: { $sum: '$totalAmount' } } },
  ]);
  const totalRevenue = revenueSummary.length > 0 ? revenueSummary[0].total : 0;

  return { ...cropCycle.toJSON(), expenseSummary, totalExpenses, totalRevenue };
};

export const updateCropCycle = async (cropCycleId, farmerId, data) => {
  const cropCycle = await CropCycle.findOne({ _id: cropCycleId, farmerId });
  if (!cropCycle) {
    const err = new Error('Crop cycle not found.');
    err.statusCode = 404;
    throw err;
  }

  const fields = ['cropName','description','seasonYear','startDate','endDate','status','area',
    'expectedHarvestDate','seedVariety','location','pricePerUnit','availableQuantity',
    'investmentAmount','cropStatus','cropImage','isListedOnMarketplace'];

  fields.forEach((f) => { if (data[f] !== undefined) cropCycle[f] = data[f]; });

  await cropCycle.save();
  return cropCycle.toJSON();
};

export const updateGrowthStage = async (cropCycleId, farmerId, stage, notes = '') => {
  const cropCycle = await CropCycle.findOne({ _id: cropCycleId, farmerId });
  if (!cropCycle) { const err = new Error('Crop cycle not found.'); err.statusCode = 404; throw err; }
  cropCycle.growthStage = stage;
  cropCycle.growthStageLog.push({ stage, date: new Date(), notes });
  await cropCycle.save();
  return cropCycle.toJSON();
};

export const addReminder = async (cropCycleId, farmerId, title, date) => {
  const cropCycle = await CropCycle.findOne({ _id: cropCycleId, farmerId });
  if (!cropCycle) { const err = new Error('Crop cycle not found.'); err.statusCode = 404; throw err; }
  cropCycle.stageReminders.push({ title, date, completed: false });
  await cropCycle.save();
  return cropCycle.toJSON();
};

export const toggleReminder = async (cropCycleId, farmerId, reminderId) => {
  const cropCycle = await CropCycle.findOne({ _id: cropCycleId, farmerId });
  if (!cropCycle) { const err = new Error('Crop cycle not found.'); err.statusCode = 404; throw err; }
  const reminder = cropCycle.stageReminders.id(reminderId);
  if (!reminder) { const err = new Error('Reminder not found.'); err.statusCode = 404; throw err; }
  reminder.completed = !reminder.completed;
  await cropCycle.save();
  return cropCycle.toJSON();
};

export const deleteCropCycle = async (cropCycleId, farmerId) => {
  const cropCycle = await CropCycle.findOne({ _id: cropCycleId, farmerId });
  if (!cropCycle) { const err = new Error('Crop cycle not found.'); err.statusCode = 404; throw err; }
  await Expense.deleteMany({ cropCycleId: cropCycle._id });
  await CropCycle.deleteOne({ _id: cropCycle._id });
  return { deletedCropCycleId: cropCycleId };
};
