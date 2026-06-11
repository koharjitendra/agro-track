import mongoose from 'mongoose';
import Expense from '../../models/Expense.model.js';
import Transaction from '../../models/Transaction.model.js';
import CropCycle from '../../models/CropCycle.model.js';
import PurchaseRequest from '../../models/PurchaseRequest.model.js';
import Order from '../../models/Order.model.js';
import Listing from '../../models/Listing.model.js';

export const getFarmerExpenseBreakdown = async (farmerId, cropCycleId) => {
  const match = { farmerId: new mongoose.Types.ObjectId(farmerId) };
  if (cropCycleId) match.cropCycleId = new mongoose.Types.ObjectId(cropCycleId);
  return await Expense.aggregate([
    { $match: match },
    { $group: { _id: '$category', total: { $sum: '$amount' } } },
    { $project: { category: '$_id', total: 1, _id: 0 } },
  ]);
};

export const getFarmerExpensesTimeline = async (farmerId) => {
  return await Expense.aggregate([
    { $match: { farmerId: new mongoose.Types.ObjectId(farmerId) } },
    { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$spentOnDate' } }, total: { $sum: '$amount' } } },
    { $sort: { _id: 1 } },
    { $project: { month: '$_id', total: 1, _id: 0 } },
  ]);
};

export const getFarmerSalesVsExpenses = async (farmerId) => {
  const farmerObjectId = new mongoose.Types.ObjectId(farmerId);

  const [cropCycles, expenseTotals, salesTotals, acceptedOrders] = await Promise.all([
    CropCycle.find({ farmerId }).lean(),
    Expense.aggregate([
      { $match: { farmerId: farmerObjectId } },
      { $group: { _id: '$cropCycleId', totalExpenses: { $sum: '$amount' } } },
    ]),
    Transaction.aggregate([
      { $match: { farmerId: farmerObjectId, status: 'FINAL', cropCycleId: { $ne: null } } },
      { $group: { _id: '$cropCycleId', totalSales: { $sum: '$totalAmount' } } },
    ]),
    PurchaseRequest.aggregate([
      { $match: { farmerId: farmerObjectId, status: 'ACCEPTED' } },
      { $group: { _id: '$cropCycleId', totalAccepted: { $sum: { $multiply: ['$quantity', '$offerPrice'] } } } },
    ]),
  ]);

  const expenseMap = new Map(expenseTotals.map((r) => [r._id.toString(), r.totalExpenses]));
  const salesMap = new Map(salesTotals.map((r) => [r._id.toString(), r.totalSales]));
  const acceptedMap = new Map(acceptedOrders.map((r) => [r._id.toString(), r.totalAccepted]));

  return cropCycles.map((cycle) => {
    const id = cycle._id.toString();
    const totalExpenses = expenseMap.get(id) || 0;
    const finalSales = salesMap.get(id) || 0;
    const acceptedSales = acceptedMap.get(id) || 0;
    const totalSales = finalSales + acceptedSales;
    return {
      cropCycleId: cycle._id,
      cropName: cycle.cropName,
      seasonYear: cycle.seasonYear || '',
      totalSales,
      totalExpenses,
      profit: totalSales - totalExpenses,
    };
  });
};

export const getFarmerProfitSummary = async (farmerId) => {
  const farmerObjectId = new mongoose.Types.ObjectId(farmerId);

  const getStartOfCurrentMonth = () => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  };

  const getStartOfCurrentWeek = () => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day;
    const sunday = new Date(now.setDate(diff));
    sunday.setHours(0, 0, 0, 0);
    return sunday;
  };

  const startOfMonth = getStartOfCurrentMonth();
  const startOfWeek = getStartOfCurrentWeek();

  const [
    completedOrders,
    pendingOrdersCount,
    rejectedOrdersCount,
    monthlyCompletedOrders,
    weeklyCompletedOrders,
    activeListings,
    allListingsCount,
    expenses,
    transactions,
    activeCropsCount
  ] = await Promise.all([
    Order.find({ farmerId: farmerObjectId, status: 'COMPLETED' }).lean(),
    Order.countDocuments({ farmerId: farmerObjectId, status: 'PENDING' }),
    Order.countDocuments({ farmerId: farmerObjectId, status: 'REJECTED' }),
    Order.find({ farmerId: farmerObjectId, status: 'COMPLETED', createdAt: { $gte: startOfMonth } }).lean(),
    Order.find({ farmerId: farmerObjectId, status: 'COMPLETED', createdAt: { $gte: startOfWeek } }).lean(),
    Listing.find({ farmerId: farmerObjectId, status: 'ACTIVE', quantity: { $gt: 0 } }).lean(),
    Listing.countDocuments({ farmerId: farmerObjectId }),
    Expense.find({ farmerId: farmerObjectId }).lean(),
    Transaction.find({ farmerId: farmerObjectId, status: 'FINAL' }).lean(),
    CropCycle.countDocuments({ farmerId: farmerObjectId, status: 'ACTIVE' }),
  ]);

  const totalRevenue = completedOrders.reduce((sum, o) => sum + o.grandTotal, 0);
  const totalSales = completedOrders.length;
  const monthlySales = monthlyCompletedOrders.length;
  const weeklySales = weeklyCompletedOrders.length;

  const averageOrderValue = totalSales > 0 ? parseFloat((totalRevenue / totalSales).toFixed(2)) : 'Insufficient Data';
  const inventoryValue = activeListings.reduce((sum, l) => sum + (l.quantity * l.finalPrice), 0);

  // Top products aggregation
  const topProductsRaw = await Order.aggregate([
    {
      $match: {
        farmerId: farmerObjectId,
        status: 'COMPLETED',
        listingId: { $ne: null }
      }
    },
    {
      $group: {
        _id: '$listingId',
        productName: { $first: '$productName' },
        completedOrderCount: { $sum: 1 },
        revenue: { $sum: '$grandTotal' }
      }
    },
    { $sort: { completedOrderCount: -1 } },
    { $limit: 5 }
  ]);

  const topProducts = topProductsRaw.map(p => ({
    listingId: p._id,
    productName: p.productName,
    completedOrderCount: p.completedOrderCount,
    revenue: p.revenue
  }));

  // Low stock products
  const lowStockProducts = await Listing.find({
    farmerId: farmerObjectId,
    $expr: { $lte: ['$quantity', '$lowStockThreshold'] }
  }).lean();

  // Legacy dashboard fields
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalDue = transactions.reduce((sum, t) => sum + t.amountDue, 0);
  const totalPaid = transactions.reduce((sum, t) => sum + t.amountPaid, 0);

  return {
    totalRevenue,
    totalSales,
    monthlySales,
    weeklySales,
    averageOrderValue,
    completedOrders: totalSales,
    pendingOrders: pendingOrdersCount,
    rejectedOrders: rejectedOrdersCount,
    inventoryValue,
    activeListings: activeListings.length,
    totalListings: allListingsCount,
    topProducts,
    lowStockProducts,
    // Keep legacy fields so client doesn't break
    totalExpenses,
    totalDue,
    totalPaid,
    profit: totalRevenue - totalExpenses,
    activeCrops: activeCropsCount
  };
};

export const getBuyerPurchasesTimeline = async (buyerId) => {
  return await Transaction.aggregate([
    { $match: { buyerId: new mongoose.Types.ObjectId(buyerId), status: 'FINAL' } },
    { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$transactionDate' } }, total: { $sum: '$totalAmount' } } },
    { $sort: { _id: 1 } },
    { $project: { month: '$_id', total: 1, _id: 0 } },
  ]);
};

export const getBuyerDueSummary = async (buyerId) => {
  return await Transaction.aggregate([
    { $match: { buyerId: new mongoose.Types.ObjectId(buyerId), status: 'FINAL', amountDue: { $gt: 0 } } },
    { $group: { _id: '$farmerId', totalDue: { $sum: '$amountDue' } } },
    { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'farmer' } },
    { $unwind: '$farmer' },
    { $project: { farmerId: '$_id', farmerName: '$farmer.name', totalDue: 1, _id: 0 } },
  ]);
};

export const getBuyerPaidVsDue = async (buyerId) => {
  const buyerObjectId = new mongoose.Types.ObjectId(buyerId);

  const getStartOfCurrentMonth = () => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  };

  const getStartOfCurrentWeek = () => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day;
    const sunday = new Date(now.setDate(diff));
    sunday.setHours(0, 0, 0, 0);
    return sunday;
  };

  const startOfMonth = getStartOfCurrentMonth();
  const startOfWeek = getStartOfCurrentWeek();

  const [
    completedOrders,
    pendingOrdersCount,
    monthlyCompletedOrders,
    weeklyCompletedOrders,
    transactions
  ] = await Promise.all([
    Order.find({ buyerId: buyerObjectId, status: 'COMPLETED' }).lean(),
    Order.countDocuments({ buyerId: buyerObjectId, status: 'PENDING' }),
    Order.find({ buyerId: buyerObjectId, status: 'COMPLETED', createdAt: { $gte: startOfMonth } }).lean(),
    Order.find({ buyerId: buyerObjectId, status: 'COMPLETED', createdAt: { $gte: startOfWeek } }).lean(),
    Transaction.find({ buyerId: buyerObjectId, status: 'FINAL' }).lean(),
  ]);

  const totalPurchases = completedOrders.length;
  const completedOrdersCount = completedOrders.length;
  const pendingOrders = pendingOrdersCount;

  const monthlySpend = monthlyCompletedOrders.reduce((sum, o) => sum + o.grandTotal, 0);
  const weeklySpend = weeklyCompletedOrders.reduce((sum, o) => sum + o.grandTotal, 0);

  const totalSpend = completedOrders.reduce((sum, o) => sum + o.grandTotal, 0);
  const averageOrderValue = completedOrdersCount > 0 ? parseFloat((totalSpend / completedOrdersCount).toFixed(2)) : 'Insufficient Data';

  // Legacy dashboard fields
  const totalPaid = transactions.reduce((s, t) => s + t.amountPaid, 0);
  const totalDue = transactions.reduce((s, t) => s + t.amountDue, 0);

  return {
    totalPurchases,
    completedOrders: completedOrdersCount,
    pendingOrders,
    monthlySpend,
    weeklySpend,
    averageOrderValue,
    // Keep legacy fields so client doesn't break
    totalPaid,
    totalDue
  };
};
