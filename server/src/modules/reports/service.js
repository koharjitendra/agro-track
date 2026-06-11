import Report from '../../models/Report.model.js';

export const createReport = async (userId, userRole, data) => {
  const report = await Report.create({
    title: data.title,
    category: data.category,
    description: data.description,
    reportedBy: userId,
    userRole,
  });
  return report.toJSON();
};

export const getMyReports = async (userId, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  const [reports, total] = await Promise.all([
    Report.find({ reportedBy: userId }).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Report.countDocuments({ reportedBy: userId }),
  ]);
  return {
    reports,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getReportById = async (reportId, userId) => {
  const report = await Report.findOne({ _id: reportId, reportedBy: userId });
  if (!report) {
    const err = new Error('Report not found.');
    err.statusCode = 404;
    throw err;
  }
  return report.toJSON();
};
