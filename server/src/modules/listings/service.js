import Listing from '../../models/Listing.model.js';
import { getDeliveryConfig } from '../../utils/checkout.js';

/**
 * Compute pricing fields from frontend-provided basePrice + discountPercentage.
 * Frontend NEVER sends discountAmount or finalPrice.
 */
const computePricing = (data) => {
  const base = parseFloat(data.basePrice) || 0;
  const pct = parseFloat(data.discountPercentage) || 0;
  const discountAmount = parseFloat(((base * pct) / 100).toFixed(2));
  const finalPrice = parseFloat((base - discountAmount).toFixed(2));
  return { basePrice: base, discountPercentage: pct, discountAmount, finalPrice, price: finalPrice };
};

/**
 * Get stock status label based on quantity and threshold.
 */
export const getStockStatus = (quantity, lowStockThreshold) => {
  if (quantity <= 0) return 'Out of Stock';
  if (quantity <= lowStockThreshold) return 'Low Stock';
  return 'In Stock';
};

export const createListing = async (farmerId, data) => {
  const cfg = await getDeliveryConfig();

  const pricing = computePricing(data);
  const listing = await Listing.create({
    farmerId,
    cropCycleId: data.cropCycleId || null,
    cropName: data.cropName || data.productName,
    productName: data.productName,
    description: data.description || '',
    category: data.category || '',
    quantity: data.quantity || 0,
    unit: data.unit || 'kg',
    minimumOrderQuantity: data.minimumOrderQuantity || 1,
    maximumOrderQuantity: data.maximumOrderQuantity || null,
    lowStockThreshold: data.lowStockThreshold ?? cfg.defaultLowStockThreshold,
    harvestDate: data.harvestDate || null,
    expiryDate: data.expiryDate || null,
    images: data.images || [],
    location: data.location || '',
    availability: data.availability !== undefined ? data.availability : true,
    status: data.status || 'DRAFT',
    ...pricing,
  });
  const json = listing.toJSON();
  json.stockStatus = getStockStatus(json.quantity, json.lowStockThreshold);
  return json;
};

export const listFarmerListings = async (farmerId) => {
  const listings = await Listing.find({ farmerId, isDeleted: { $ne: true } }).sort({ createdAt: -1 });
  return listings.map((l) => {
    const j = l.toJSON();
    j.stockStatus = getStockStatus(j.quantity, j.lowStockThreshold);
    return j;
  });
};

export const getListingById = async (listingId, userId, userRole) => {
  let listing;
  if (userRole === 'FARMER') {
    listing = await Listing.findOne({
      _id: listingId,
      isDeleted: { $ne: true },
      $or: [{ farmerId: userId }, { status: 'ACTIVE' }]
    });
  } else {
    listing = await Listing.findOne({ _id: listingId, status: 'ACTIVE', isDeleted: { $ne: true } });
  }

  if (!listing) {
    const err = new Error('Listing not found.');
    err.statusCode = 404;
    throw err;
  }

  listing.views = (listing.views || 0) + 1;
  await listing.save();

  const j = listing.toJSON();
  j.stockStatus = getStockStatus(j.quantity, j.lowStockThreshold);
  return j;
};

export const updateListing = async (listingId, farmerId, data) => {
  const listing = await Listing.findOne({ _id: listingId, farmerId });
  if (!listing) {
    const err = new Error('Listing not found.');
    err.statusCode = 404;
    throw err;
  }

  const metaFields = [
    'cropName', 'productName', 'description', 'category', 'quantity', 'unit',
    'minimumOrderQuantity', 'maximumOrderQuantity', 'lowStockThreshold',
    'harvestDate', 'expiryDate', 'images', 'location', 'availability', 'status', 'cropCycleId',
  ];
  metaFields.forEach((f) => {
    if (data[f] !== undefined) listing[f] = data[f];
  });

  // Recompute pricing if either price field changes
  if (data.basePrice !== undefined || data.discountPercentage !== undefined) {
    const pricing = computePricing({
      basePrice: data.basePrice !== undefined ? data.basePrice : listing.basePrice,
      discountPercentage: data.discountPercentage !== undefined ? data.discountPercentage : listing.discountPercentage,
    });
    Object.assign(listing, pricing);
  }

  await listing.save();
  const j = listing.toJSON();
  j.stockStatus = getStockStatus(j.quantity, j.lowStockThreshold);
  return j;
};

export const publishListing = async (listingId, farmerId) => {
  const listing = await Listing.findOne({ _id: listingId, farmerId });
  if (!listing) {
    const err = new Error('Listing not found.');
    err.statusCode = 404;
    throw err;
  }
  if (!listing.basePrice || listing.basePrice <= 0) {
    const err = new Error('Cannot publish: base price must be greater than 0.');
    err.statusCode = 400;
    throw err;
  }
  if (!listing.quantity || listing.quantity <= 0) {
    const err = new Error('Cannot publish: quantity must be greater than 0.');
    err.statusCode = 400;
    throw err;
  }
  listing.status = 'ACTIVE';
  listing.availability = true;
  await listing.save();
  const j = listing.toJSON();
  j.stockStatus = getStockStatus(j.quantity, j.lowStockThreshold);
  return j;
};

export const unpublishListing = async (listingId, farmerId) => {
  const listing = await Listing.findOne({ _id: listingId, farmerId });
  if (!listing) {
    const err = new Error('Listing not found.');
    err.statusCode = 404;
    throw err;
  }
  listing.status = 'PAUSED';
  await listing.save();
  const j = listing.toJSON();
  j.stockStatus = getStockStatus(j.quantity, j.lowStockThreshold);
  return j;
};

export const deleteListing = async (listingId, farmerId) => {
  const listing = await Listing.findOne({ _id: listingId, farmerId });
  if (!listing) {
    const err = new Error('Listing not found.');
    err.statusCode = 404;
    throw err;
  }
  await Listing.deleteOne({ _id: listing._id });
  return { deletedListingId: listingId };
};

export const getActiveListings = async (query = {}) => {
  const match = { status: 'ACTIVE', availability: true, isDeleted: { $ne: true } };

  if (query.search) {
    match.$or = [
      { productName: { $regex: query.search, $options: 'i' } },
      { cropName: { $regex: query.search, $options: 'i' } },
    ];
  }
  if (query.category) {
    match.category = { $regex: query.category, $options: 'i' };
  }
  if (query.location) {
    match.location = { $regex: query.location, $options: 'i' };
  }
  if (query.minPrice || query.maxPrice) {
    match.finalPrice = {};
    if (query.minPrice) match.finalPrice.$gte = parseFloat(query.minPrice);
    if (query.maxPrice) match.finalPrice.$lte = parseFloat(query.maxPrice);
  }

  const pipeline = [
    { $match: match },
    {
      $lookup: {
        from: 'users',
        localField: 'farmerId',
        foreignField: '_id',
        as: 'farmer',
      },
    },
    { $unwind: { path: '$farmer', preserveNullAndEmptyArrays: true } },
  ];

  // Sorting
  let sortStage = { $sort: { createdAt: -1 } };
  if (query.sort === 'price_asc') sortStage = { $sort: { finalPrice: 1 } };
  if (query.sort === 'price_desc') sortStage = { $sort: { finalPrice: -1 } };
  if (query.sort === 'rating_desc') sortStage = { $sort: { 'farmer.trustScore': -1 } };
  pipeline.push(sortStage);

  // Pagination
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 12;
  const skip = (page - 1) * limit;

  pipeline.push({ $skip: skip });
  pipeline.push({ $limit: limit });

  const listings = await Listing.aggregate(pipeline);

  return listings.map((l) => {
    const farmerId = l.farmer ? {
      _id: l.farmer._id,
      name: l.farmer.name,
      email: l.farmer.email,
      trustScore: l.farmer.trustScore,
      ratingsCount: l.farmer.ratingsCount,
    } : null;

    const resObj = {
      ...l,
      farmerId,
    };
    delete resObj.farmer;
    resObj.stockStatus = getStockStatus(resObj.quantity, resObj.lowStockThreshold);
    
    // Standard Mongoose model transform representation fields mapping
    if (resObj._id) resObj.id = resObj._id.toString();
    return resObj;
  });
};
