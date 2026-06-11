import mongoose from 'mongoose';
import User from '../../models/User.model.js';
import Order from '../../models/Order.model.js';
import Listing from '../../models/Listing.model.js';
import Report from '../../models/Report.model.js';
import AuditLog from '../../models/AuditLog.model.js';
import { createAndEmit } from '../notifications/service.js';

/**
 * GET admin stats from live queries.
 */
export const getAdminStats = async () => {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  // 1. User stats
  const [
    totalUsers,
    totalBuyers,
    totalFarmers,
    activeUsers,
    blockedUsers,
    newUsersThisMonth
  ] = await Promise.all([
    User.countDocuments({ role: { $ne: 'ADMIN' } }),
    User.countDocuments({ role: 'BUYER' }),
    User.countDocuments({ role: 'FARMER' }),
    User.countDocuments({ accountStatus: 'ACTIVE', role: { $ne: 'ADMIN' } }),
    User.countDocuments({ accountStatus: { $in: ['BLOCKED', 'SUSPENDED'] }, role: { $ne: 'ADMIN' } }),
    User.countDocuments({ createdAt: { $gte: startOfMonth }, role: { $ne: 'ADMIN' } }),
  ]);

  // 2. Report stats
  const [
    totalReports,
    openReports,
    underReviewReports,
    resolvedReports,
    closedReports
  ] = await Promise.all([
    Report.countDocuments({}),
    Report.countDocuments({ status: 'OPEN' }),
    Report.countDocuments({ status: 'UNDER_REVIEW' }),
    Report.countDocuments({ status: 'RESOLVED' }),
    Report.countDocuments({ status: 'CLOSED' }),
  ]);

  // 3. Order stats
  const [
    totalOrders,
    pendingOrders,
    completedOrders,
    revenueData
  ] = await Promise.all([
    Order.countDocuments({}),
    Order.countDocuments({ status: 'PENDING' }),
    Order.countDocuments({ status: 'COMPLETED' }),
    Order.aggregate([
      { $match: { status: 'COMPLETED' } },
      { $group: { _id: null, total: { $sum: '$grandTotal' } } }
    ])
  ]);
  const totalRevenue = revenueData[0]?.total || 0;

  // 4. Listing stats
  const [
    totalListings,
    activeListings,
    categoryBreakdown
  ] = await Promise.all([
    Listing.countDocuments({ isDeleted: { $ne: true } }),
    Listing.countDocuments({ status: 'ACTIVE', isDeleted: { $ne: true } }),
    Listing.aggregate([
      { $match: { isDeleted: { $ne: true } } },
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ])
  ]);

  return {
    users: {
      totalUsers,
      totalBuyers,
      totalFarmers,
      activeUsers,
      blockedUsers,
      newUsersThisMonth,
    },
    reports: {
      totalReports,
      openReports,
      underReviewReports,
      resolvedReports,
      closedReports,
    },
    orders: {
      totalOrders,
      pendingOrders,
      completedOrders,
      totalRevenue,
    },
    listings: {
      totalListings,
      activeListings,
      categories: categoryBreakdown.map(c => ({ category: c._id || 'Uncategorized', count: c.count })),
    }
  };
};

/**
 * GET all reports (paginated with filters).
 */
export const getReports = async ({ status, category, reporterRole, search, page = 1, limit = 20 }) => {
  const filter = {};
  if (status && status !== 'ALL') filter.status = status;
  if (category && category !== 'ALL') filter.category = category;
  if (reporterRole && reporterRole !== 'ALL') filter.userRole = reporterRole;

  let reportQuery = Report.find(filter)
    .populate('reportedBy', 'name email role')
    .sort({ createdAt: -1 });

  const skip = (page - 1) * limit;
  const [reports, total] = await Promise.all([
    Report.find(filter)
      .populate('reportedBy', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Report.countDocuments(filter),
  ]);

  // Apply search filtering in memory if user search is provided
  let filteredReports = reports;
  if (search) {
    const s = search.toLowerCase();
    filteredReports = reports.filter(r => 
      r.title.toLowerCase().includes(s) || 
      r.description.toLowerCase().includes(s) ||
      r.reportedBy?.name?.toLowerCase().includes(s) ||
      r.reportedBy?.email?.toLowerCase().includes(s)
    );
  }

  return {
    reports: filteredReports,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    }
  };
};

/**
 * Respond to bug report and trigger notification.
 */
export const respondToReport = async (reportId, responseText, status, adminId) => {
  const report = await Report.findById(reportId).populate('reportedBy', 'name email role');
  if (!report) {
    const err = new Error('Report not found.');
    err.statusCode = 404;
    throw err;
  }

  report.adminResponse = responseText;
  report.status = status;
  report.respondedAt = new Date();
  await report.save();

  // Create notifications
  let notifTitle = 'Admin responded to your issue.';
  if (status === 'RESOLVED') notifTitle = 'Issue resolved by administrator.';
  else if (status === 'UNDER_REVIEW') notifTitle = 'Your report is under review.';

  await createAndEmit({
    userId: report.reportedBy._id,
    type: 'ORDER_ACCEPTED', // using a standard event type that pushes to user
    title: notifTitle,
    message: responseText || 'An administrator has updated your issue status.',
    relatedId: report._id,
  });

  // Log action
  await AuditLog.create({
    actionType: 'RESPOND_REPORT',
    targetUser: report.reportedBy.name,
    targetRole: report.reportedBy.role,
    performedBy: adminId,
    metadata: { reportId, status, title: report.title }
  });

  return report;
};

/**
 * Edit report details.
 */
export const editReport = async (reportId, data, adminId) => {
  const report = await Report.findById(reportId).populate('reportedBy', 'name email role');
  if (!report) {
    const err = new Error('Report not found.');
    err.statusCode = 404;
    throw err;
  }

  if (data.title) report.title = data.title;
  if (data.description) report.description = data.description;
  if (data.status) report.status = data.status;
  if (data.category) report.category = data.category;
  await report.save();

  await AuditLog.create({
    actionType: 'EDIT_REPORT',
    targetUser: report.reportedBy.name,
    targetRole: report.reportedBy.role,
    performedBy: adminId,
    metadata: { reportId, title: report.title }
  });

  return report;
};

/**
 * Delete a report.
 */
export const deleteReport = async (reportId, adminId) => {
  const report = await Report.findById(reportId).populate('reportedBy', 'name email role');
  if (!report) {
    const err = new Error('Report not found.');
    err.statusCode = 404;
    throw err;
  }

  await Report.deleteOne({ _id: reportId });

  await AuditLog.create({
    actionType: 'DELETE_REPORT',
    targetUser: report.reportedBy ? report.reportedBy.name : 'Unknown User',
    targetRole: report.reportedBy ? report.reportedBy.role : 'Unknown Role',
    performedBy: adminId,
    metadata: { reportId, title: report.title }
  });

  return { deletedReportId: reportId };
};

/**
 * GET list of users with details (aggregated, paginated, and sorted).
 */
export const getUsers = async ({ role, status, search, sort, page = 1, limit = 20 }) => {
  const match = { role: { $ne: 'ADMIN' } };
  if (role && role !== 'ALL') match.role = role;
  if (status && status !== 'ALL') {
    if (status === 'BLOCKED') {
      match.accountStatus = { $in: ['BLOCKED', 'SUSPENDED'] };
    } else {
      match.accountStatus = status;
    }
  }

  if (search) {
    const s = search.toLowerCase();
    match.$or = [
      { name: { $regex: s, $options: 'i' } },
      { email: { $regex: s, $options: 'i' } },
      { phone: { $regex: s, $options: 'i' } },
    ];
  }

  const pipeline = [
    { $match: match },
    // Orders lookup
    {
      $lookup: {
        from: 'orders',
        localField: '_id',
        foreignField: 'buyerId',
        as: 'buyerOrders'
      }
    },
    // Sales lookup
    {
      $lookup: {
        from: 'orders',
        localField: '_id',
        foreignField: 'farmerId',
        as: 'farmerOrders'
      }
    },
    // Listings lookup
    {
      $lookup: {
        from: 'listings',
        localField: '_id',
        foreignField: 'farmerId',
        as: 'farmerListings'
      }
    },
    {
      $addFields: {
        totalOrders: { $size: '$buyerOrders' },
        completedOrdersCount: {
          $size: {
            $filter: {
              input: '$buyerOrders',
              as: 'o',
              cond: { $eq: ['$$o.status', 'COMPLETED'] }
            }
          }
        },
        pendingOrdersCount: {
          $size: {
            $filter: {
              input: '$buyerOrders',
              as: 'o',
              cond: { $eq: ['$$o.status', 'PENDING'] }
            }
          }
        },
        totalListings: {
          $size: {
            $filter: {
              input: '$farmerListings',
              as: 'l',
              cond: { $ne: ['$$l.isDeleted', true] }
            }
          }
        },
        activeProducts: {
          $size: {
            $filter: {
              input: '$farmerListings',
              as: 'l',
              cond: {
                $and: [
                  { $eq: ['$$l.status', 'ACTIVE'] },
                  { $ne: ['$$l.isDeleted', true] }
                ]
              }
            }
          }
        },
        totalSales: {
          $size: {
            $filter: {
              input: '$farmerOrders',
              as: 'o',
              cond: { $eq: ['$$o.status', 'COMPLETED'] }
            }
          }
        }
      }
    }
  ];

  // Sorting
  let sortStage = { $sort: { createdAt: -1 } };
  if (sort === 'oldest') sortStage = { $sort: { createdAt: 1 } };
  if (sort === 'most_orders') sortStage = { $sort: { totalOrders: -1 } };
  if (sort === 'most_sales') sortStage = { $sort: { totalSales: -1 } };
  pipeline.push(sortStage);

  // Pagination
  const skip = (page - 1) * limit;
  const countPipeline = [...pipeline, { $count: 'total' }];
  pipeline.push({ $skip: skip });
  pipeline.push({ $limit: limit });

  const [users, countResult] = await Promise.all([
    User.aggregate(pipeline),
    User.aggregate(countPipeline)
  ]);

  const total = countResult[0]?.total || 0;

  return {
    users,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    }
  };
};

/**
 * GET user profile and related logs (Orders, Listings, Reports).
 */
export const getUserProfileDetails = async (userId) => {
  const user = await User.findById(userId).lean();
  if (!user) {
    const err = new Error('User not found.');
    err.statusCode = 404;
    throw err;
  }

  const reports = await Report.find({ reportedBy: userId }).sort({ createdAt: -1 }).lean();

  if (user.role === 'BUYER') {
    const orders = await Order.find({ buyerId: userId }).sort({ createdAt: -1 }).lean();
    return {
      user,
      reports,
      orders,
    };
  } else if (user.role === 'FARMER') {
    const listings = await Listing.find({ farmerId: userId, isDeleted: { $ne: true } }).sort({ createdAt: -1 }).lean();
    const sales = await Order.find({ farmerId: userId }).sort({ createdAt: -1 }).lean();
    return {
      user,
      reports,
      listings,
      sales,
    };
  }

  return { user, reports };
};

/**
 * Update user profile.
 */
export const updateUserProfile = async (userId, data, adminId) => {
  const user = await User.findById(userId);
  if (!user) {
    const err = new Error('User not found.');
    err.statusCode = 404;
    throw err;
  }

  const changes = {};
  if (data.name !== undefined && data.name !== user.name) {
    changes.name = { from: user.name, to: data.name };
    user.name = data.name;
  }
  if (data.email !== undefined && data.email !== user.email) {
    changes.email = { from: user.email, to: data.email };
    user.email = data.email.toLowerCase();
  }
  if (data.phone !== undefined && data.phone !== user.phone) {
    changes.phone = { from: user.phone, to: data.phone };
    user.phone = data.phone;
  }
  if (data.location !== undefined && data.location !== user.location) {
    changes.location = { from: user.location, to: data.location };
    user.location = data.location;
  }
  if (data.accountStatus !== undefined && data.accountStatus !== user.accountStatus) {
    changes.accountStatus = { from: user.accountStatus, to: data.accountStatus };
    user.accountStatus = data.accountStatus;
  }

  await user.save();

  await AuditLog.create({
    actionType: 'UPDATE_USER',
    targetUser: user.name,
    targetRole: user.role,
    performedBy: adminId,
    metadata: { userId: user._id, changes }
  });

  return user.toJSON();
};

/**
 * Block user.
 */
export const blockUser = async (userId, adminId) => {
  const user = await User.findById(userId);
  if (!user) {
    const err = new Error('User not found.');
    err.statusCode = 404;
    throw err;
  }

  user.accountStatus = 'BLOCKED';
  await user.save();

  await AuditLog.create({
    actionType: 'BLOCK_USER',
    targetUser: user.name,
    targetRole: user.role,
    performedBy: adminId,
    metadata: { userId: user._id }
  });

  return user.toJSON();
};

/**
 * Unblock user.
 */
export const unblockUser = async (userId, adminId) => {
  const user = await User.findById(userId);
  if (!user) {
    const err = new Error('User not found.');
    err.statusCode = 404;
    throw err;
  }

  user.accountStatus = 'ACTIVE';
  await user.save();

  await AuditLog.create({
    actionType: 'UNBLOCK_USER',
    targetUser: user.name,
    targetRole: user.role,
    performedBy: adminId,
    metadata: { userId: user._id }
  });

  return user.toJSON();
};

/**
 * Permanently delete user account, soft-delete listings, anonymize orders.
 */
export const deleteUser = async (userId, adminId) => {
  const user = await User.findById(userId);
  if (!user) {
    const err = new Error('User not found.');
    err.statusCode = 404;
    throw err;
  }

  // 1. Soft delete farmer's listings
  if (user.role === 'FARMER') {
    await Listing.updateMany(
      { farmerId: userId },
      { $set: { isDeleted: true, status: 'PAUSED', availability: false } }
    );
  }

  // 2. Anonymize orders
  // If user is buyer:
  await Order.updateMany(
    { buyerId: userId },
    {
      $set: {
        buyerId: null,
        deliveryName: 'Deleted User',
        deliveryPhone: 'N/A',
        deliveryAddress: 'N/A',
        deliveryVillage: 'N/A',
        deliveryCity: 'N/A',
        deliveryDistrict: 'N/A',
        deliveryState: 'N/A',
        deliveryPostalCode: 'N/A'
      }
    }
  );
  // If user is farmer:
  await Order.updateMany(
    { farmerId: userId },
    {
      $set: {
        farmerId: null
      }
    }
  );

  // 3. Remove user record
  await User.deleteOne({ _id: userId });

  // 4. Create Audit Log
  await AuditLog.create({
    actionType: 'DELETE_USER',
    targetUser: user.name,
    targetRole: user.role,
    performedBy: adminId,
    metadata: { userId: user._id, name: user.name, email: user.email }
  });

  return { deletedUserId: userId };
};

/**
 * GET audit logs (paginated).
 */
export const getAuditLogs = async (page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  const [logs, total] = await Promise.all([
    AuditLog.find({})
      .populate('performedBy', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    AuditLog.countDocuments({}),
  ]);

  return {
    logs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    }
  };
};
