import * as listingsService from '../listings/service.js';

export const getMarketplaceCrops = async (query) => {
  return listingsService.getActiveListings(query);
};
