import InventoryItem from '../../models/InventoryItem.model.js';

export const listInventory = async (farmerId) => {
  return await InventoryItem.find({ farmerId }).sort({ category: 1, name: 1 });
};

export const createInventoryItem = async (farmerId, data) => {
  const item = await InventoryItem.create({
    farmerId,
    name: data.name,
    category: data.category,
    quantity: data.quantity,
    unit: data.unit,
    lowStockThreshold: data.lowStockThreshold !== undefined ? data.lowStockThreshold : 5,
    pricePerUnit: data.pricePerUnit || 0,
    notes: data.notes || '',
  });
  return item.toJSON();
};

export const updateInventoryItem = async (itemId, farmerId, data) => {
  const item = await InventoryItem.findOne({ _id: itemId, farmerId });
  if (!item) {
    const err = new Error('Inventory item not found');
    err.statusCode = 404;
    throw err;
  }

  if (data.name !== undefined) item.name = data.name;
  if (data.category !== undefined) item.category = data.category;
  if (data.quantity !== undefined) item.quantity = data.quantity;
  if (data.unit !== undefined) item.unit = data.unit;
  if (data.lowStockThreshold !== undefined) item.lowStockThreshold = data.lowStockThreshold;
  if (data.pricePerUnit !== undefined) item.pricePerUnit = data.pricePerUnit;
  if (data.notes !== undefined) item.notes = data.notes;

  await item.save();
  return item.toJSON();
};

export const deleteInventoryItem = async (itemId, farmerId) => {
  const item = await InventoryItem.findOne({ _id: itemId, farmerId });
  if (!item) {
    const err = new Error('Inventory item not found');
    err.statusCode = 404;
    throw err;
  }
  await InventoryItem.deleteOne({ _id: itemId });
  return { deletedItemId: itemId };
};
