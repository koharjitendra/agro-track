import { success } from '../../utils/apiResponse.js';
import * as listingsService from './service.js';

export const create = async (req, res, next) => {
  try {
    const listing = await listingsService.createListing(req.user.id, req.body);
    return success(res, listing, 'Listing created successfully.', 201);
  } catch (err) {
    next(err);
  }
};

export const list = async (req, res, next) => {
  try {
    const listings = await listingsService.listFarmerListings(req.user.id);
    return success(res, listings, 'Listings fetched successfully.');
  } catch (err) {
    next(err);
  }
};

export const getById = async (req, res, next) => {
  try {
    const listing = await listingsService.getListingById(req.params.id, req.user.id, req.user.role);
    return success(res, listing, 'Listing fetched.');
  } catch (err) {
    next(err);
  }
};

export const update = async (req, res, next) => {
  try {
    const listing = await listingsService.updateListing(req.params.id, req.user.id, req.body);
    return success(res, listing, 'Listing updated successfully.');
  } catch (err) {
    next(err);
  }
};

export const publish = async (req, res, next) => {
  try {
    const listing = await listingsService.publishListing(req.params.id, req.user.id);
    return success(res, listing, 'Listing published to marketplace.');
  } catch (err) {
    next(err);
  }
};

export const unpublish = async (req, res, next) => {
  try {
    const listing = await listingsService.unpublishListing(req.params.id, req.user.id);
    return success(res, listing, 'Listing paused from marketplace.');
  } catch (err) {
    next(err);
  }
};

export const remove = async (req, res, next) => {
  try {
    const result = await listingsService.deleteListing(req.params.id, req.user.id);
    return success(res, result, 'Listing deleted.');
  } catch (err) {
    next(err);
  }
};
