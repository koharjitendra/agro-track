import { success } from '../../utils/apiResponse.js';
import * as inventoryService from './service.js';

export const list = async (req, res, next) => {
  try {
    const items = await inventoryService.listInventory(req.user.id);
    return success(res, items, 'Inventory items fetched.');
  } catch (err) {
    next(err);
  }
};

export const create = async (req, res, next) => {
  try {
    const item = await inventoryService.createInventoryItem(req.user.id, req.body);
    return success(res, item, 'Inventory item added.', 201);
  } catch (err) {
    next(err);
  }
};

export const update = async (req, res, next) => {
  try {
    const item = await inventoryService.updateInventoryItem(req.params.id, req.user.id, req.body);
    return success(res, item, 'Inventory item updated.');
  } catch (err) {
    next(err);
  }
};

export const remove = async (req, res, next) => {
  try {
    const result = await inventoryService.deleteInventoryItem(req.params.id, req.user.id);
    return success(res, result, 'Inventory item deleted.');
  } catch (err) {
    next(err);
  }
};
