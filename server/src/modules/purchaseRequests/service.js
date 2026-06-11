import PurchaseRequest from '../../models/PurchaseRequest.model.js';
import Listing from '../../models/Listing.model.js';
import CropCycle from '../../models/CropCycle.model.js';
import Transaction from '../../models/Transaction.model.js';
import Notification from '../../models/Notification.model.js';

export const createPurchaseRequest = async (buyerId, data) => {
  let farmerId;
  let productName = data.productName || '';
  let unit = data.unit || 'kg';

  if (data.listingId) {
    // New flow: order from a Listing
    const listing = await Listing.findById(data.listingId).populate('farmerId', 'name');
    if (!listing) {
      const err = new Error('Listing not found.');
      err.statusCode = 404;
      throw err;
    }
    if (listing.status !== 'ACTIVE') {
      const err = new Error('This listing is no longer active.');
      err.statusCode = 400;
      throw err;
    }
    farmerId = listing.farmerId._id;
    productName = productName || listing.productName;
    unit = unit || listing.unit || 'kg';
  } else if (data.cropCycleId) {
    // Legacy flow: order from a CropCycle
    const cropCycle = await CropCycle.findById(data.cropCycleId).populate('farmerId', 'name');
    if (!cropCycle) {
      const err = new Error('Crop cycle not found.');
      err.statusCode = 404;
      throw err;
    }
    farmerId = cropCycle.farmerId._id;
    productName = productName || cropCycle.cropName;
  } else {
    const err = new Error('Either listingId or cropCycleId is required.');
    err.statusCode = 400;
    throw err;
  }

  const pr = await PurchaseRequest.create({
    buyerId,
    farmerId,
    listingId: data.listingId || null,
    cropCycleId: data.cropCycleId || null,
    productName,
    quantity: data.quantity,
    unit,
    offerPrice: data.offerPrice,
    message: data.message || '',
    buyerName: data.buyerName || '',
    buyerPhone: data.buyerPhone || '',
    buyerAddress: data.buyerAddress || '',
    isCartOrder: data.isCartOrder || false,
  });

  // Notify farmer
  const totalAmount = data.quantity * data.offerPrice;
  await Notification.create({
    userId: farmerId,
    type: 'NEW_ORDER',
    title: `New order for ${productName}`,
    body: `${data.buyerName || 'A buyer'} wants ${data.quantity} ${unit} of ${productName} @ ₹${data.offerPrice}/${unit} (Total: ₹${totalAmount.toFixed(2)}).${data.buyerPhone ? ` Phone: ${data.buyerPhone}.` : ''}${data.buyerAddress ? ` Address: ${data.buyerAddress}` : ''}`,
    relatedOrderId: pr._id,
  });

  return pr.toJSON();
};

export const getPurchaseRequests = async (query) => {
  const requests = await PurchaseRequest.find(query)
    .populate('buyerId', 'name email phone')
    .populate('farmerId', 'name email')
    .populate('listingId', 'productName price unit quantity')
    .populate('cropCycleId', 'cropName expectedHarvestDate location pricePerUnit')
    .sort({ createdAt: -1 });
  return requests;
};

export const updatePurchaseRequestStatus = async (id, farmerId, status) => {
  const pr = await PurchaseRequest.findOne({ _id: id, farmerId });
  if (!pr) {
    const err = new Error('Purchase request not found or unauthorized.');
    err.statusCode = 404;
    throw err;
  }

  if (!['ACCEPTED', 'REJECTED'].includes(status)) {
    const err = new Error('Invalid status update. Must be ACCEPTED or REJECTED.');
    err.statusCode = 400;
    throw err;
  }

  pr.status = status;
  await pr.save();

  // Notify buyer
  await Notification.create({
    userId: pr.buyerId,
    type: 'ORDER_STATUS_UPDATE',
    title: `Order ${status === 'ACCEPTED' ? 'Accepted' : 'Rejected'}`,
    body: `Your purchase request for "${pr.productName}" has been ${status.toLowerCase()} by the farmer.`,
    relatedOrderId: pr._id,
  });

  if (status === 'ACCEPTED') {
    const totalAmount = pr.quantity * pr.offerPrice;
    await Transaction.create({
      farmerId: pr.farmerId,
      buyerId: pr.buyerId,
      cropCycleId: pr.cropCycleId || null,
      quantity: pr.quantity,
      unit: pr.unit || 'kg',
      pricePerUnit: pr.offerPrice,
      totalAmount,
      transactionDate: new Date(),
      paymentStatus: 'DUE',
      amountPaid: 0,
      amountDue: totalAmount,
      status: 'PENDING',
      createdByUserId: farmerId,
      notes: pr.message ? `Accepted order: ${pr.message}` : `Accepted order for "${pr.productName}".`,
    });
  }

  return pr.toJSON();
};
