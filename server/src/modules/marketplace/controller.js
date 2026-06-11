import { success } from '../../utils/apiResponse.js';
import * as marketplaceService from './service.js';

export const listCrops = async (req, res, next) => {
  try {
    const crops = await marketplaceService.getMarketplaceCrops(req.query);
    return success(res, crops, 'Marketplace crops fetched successfully.');
  } catch (err) {
    next(err);
  }
};
