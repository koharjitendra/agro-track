import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  FiUsers, FiAlertOctagon, FiShoppingBag, FiClipboard,
  FiFilter, FiSearch, FiCheck, FiX, FiShield,
  FiTrash2, FiEdit, FiInfo, FiActivity, FiArrowRight
} from 'react-icons/fi';
import Button from '../../../components/common/Button.jsx';
import * as adminApi from '../../../api/admin.api.js';

const fmtCurrency = (n) => `₹${parseFloat(n || 0).toFixed(2)}`;

const statusStyles = {
  ACTIVE: 'bg-green-500/10 text-green-400 border-green-500/20',
  BLOCKED: 'bg-red-500/10 text-red-400 border-red-500/20',
  SUSPENDED: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  OPEN: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  UNDER_REVIEW: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  RESOLVED: 'bg-green-500/10 text-green-400 border-green-500/20',
  CLOSED: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
};

const AdminDashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'stats';
  const setActiveTab = (newTab) => {
    setSearchParams({ tab: newTab });
  };
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Users Management state
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userRoleFilter, setUserRoleFilter] = useState('ALL'); // 'ALL' | 'BUYER' | 'FARMER'
  const [userStatusFilter, setUserStatusFilter] = useState('ALL');
  const [userSearch, setUserSearch] = useState('');
  const [userSort, setUserSort] = useState('newest'); // 'newest' | 'oldest' | 'most_orders' | 'most_sales'
  const [userPage, setUserPage] = useState(1);
  const [userTotalPages, setUserTotalPages] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null); // Detail profile modal
  const [editingUser, setEditingUser] = useState(null); // Edit profile modal
  const [deletingUser, setDeletingUser] = useState(null); // Delete user confirmation modal

  // Reports Management state
  const [reports, setReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportStatusFilter, setReportStatusFilter] = useState('ALL');
  const [reportCategoryFilter, setReportCategoryFilter] = useState('ALL');
  const [reportRoleFilter, setReportRoleFilter] = useState('ALL');
  const [reportSearch, setReportSearch] = useState('');
  const [reportPage, setReportPage] = useState(1);
  const [reportTotalPages, setReportTotalPages] = useState(1);
  const [selectedReport, setSelectedReport] = useState(null); // Respond report modal
  const [editingReport, setEditingReport] = useState(null); // Edit report details modal
  const [deletingReport, setDeletingReport] = useState(null); // Delete report confirmation modal
  const [adminResponseText, setAdminResponseText] = useState('');
  const [adminResponseStatus, setAdminResponseStatus] = useState('RESOLVED');

  // Audit Logs state
  const [auditLogs, setAuditLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsPage, setLogsPage] = useState(1);
  const [logsTotalPages, setLogsTotalPages] = useState(1);

  // Fetch Stats
  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const res = await adminApi.getStats();
      setStats(res.data);
    } catch (err) {
      toast.error('Failed to load dashboard metrics.');
    } finally {
      setStatsLoading(false);
    }
  };

  // Fetch Users
  const fetchUsers = async (p = 1) => {
    setUsersLoading(true);
    try {
      const res = await adminApi.getUsers({
        role: userRoleFilter,
        status: userStatusFilter,
        search: userSearch,
        sort: userSort,
        page: p,
        limit: 10,
      });
      setUsers(res.data.users || []);
      setUserTotalPages(res.data.pagination?.totalPages || 1);
      setUserPage(p);
    } catch (err) {
      toast.error('Failed to load platform users.');
    } finally {
      setUsersLoading(false);
    }
  };

  // Fetch Reports
  const fetchReports = async (p = 1) => {
    setReportsLoading(true);
    try {
      const res = await adminApi.getReports({
        status: reportStatusFilter,
        category: reportCategoryFilter,
        reporterRole: reportRoleFilter,
        search: reportSearch,
        page: p,
        limit: 10,
      });
      setReports(res.data.reports || []);
      setReportTotalPages(res.data.pagination?.totalPages || 1);
      setReportPage(p);
    } catch (err) {
      toast.error('Failed to load reports.');
    } finally {
      setReportsLoading(false);
    }
  };

  // Fetch Audit Logs
  const fetchAuditLogs = async (p = 1) => {
    setLogsLoading(true);
    try {
      const res = await adminApi.getAuditLogs(p);
      setAuditLogs(res.data.logs || []);
      setLogsTotalPages(res.data.pagination?.totalPages || 1);
      setLogsPage(p);
    } catch (err) {
      toast.error('Failed to load audit logs.');
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'stats') fetchStats();
    if (activeTab === 'users') fetchUsers(1);
    if (activeTab === 'reports') fetchReports(1);
    if (activeTab === 'logs') fetchAuditLogs(1);
  }, [activeTab, userRoleFilter, userStatusFilter, userSort, reportStatusFilter, reportCategoryFilter, reportRoleFilter]);

  // Admin Actions for User
  const handleBlockUser = async (userId) => {
    try {
      await adminApi.blockUser(userId);
      toast.success('User has been blocked.');
      fetchUsers(userPage);
      fetchStats();
    } catch (err) {
      toast.error(err.message || 'Block action failed.');
    }
  };

  const handleUnblockUser = async (userId) => {
    try {
      await adminApi.unblockUser(userId);
      toast.success('User has been unblocked.');
      fetchUsers(userPage);
      fetchStats();
    } catch (err) {
      toast.error(err.message || 'Unblock action failed.');
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      await adminApi.deleteUser(userId);
      toast.success('Account permanently deleted.');
      setDeletingUser(null);
      fetchUsers(1);
      fetchStats();
    } catch (err) {
      toast.error(err.message || 'Delete action failed.');
    }
  };

  const handleEditUserSubmit = async (e) => {
    e.preventDefault();
    try {
      await adminApi.updateUserProfile(editingUser._id, editingUser);
      toast.success('User profile updated successfully.');
      setEditingUser(null);
      fetchUsers(userPage);
    } catch (err) {
      toast.error(err.message || 'Failed to update profile.');
    }
  };

  // Admin Actions for Reports
  const handleRespondReport = async (e) => {
    e.preventDefault();
    try {
      await adminApi.respondToReport(selectedReport._id, {
        adminResponse: adminResponseText,
        status: adminResponseStatus,
      });
      toast.success('Response saved. Notification pushed to reporter.');
      setSelectedReport(null);
      setAdminResponseText('');
      fetchReports(reportPage);
      fetchStats();
    } catch (err) {
      toast.error(err.message || 'Response submission failed.');
    }
  };

  const handleEditReportSubmit = async (e) => {
    e.preventDefault();
    try {
      await adminApi.editReport(editingReport._id, editingReport);
      toast.success('Report details updated.');
      setEditingReport(null);
      fetchReports(reportPage);
    } catch (err) {
      toast.error(err.message || 'Failed to edit report.');
    }
  };

  const handleDeleteReport = async (reportId) => {
    try {
      await adminApi.deleteReport(reportId);
      toast.success('Report deleted.');
      setDeletingReport(null);
      fetchReports(1);
      fetchStats();
    } catch (err) {
      toast.error(err.message || 'Delete report failed.');
    }
  };

  // User details log fetcher
  const handleViewDetails = async (userId) => {
    try {
      const res = await adminApi.getUserProfileDetails(userId);
      setSelectedUser(res.data);
    } catch (err) {
      toast.error('Failed to fetch user full profile.');
    }
  };

  return (
    <div className="fade-in space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Admin Dashboard</h1>
          <p className="page-subtitle">Centralized platform configuration, user ledger visibility, and customer support ticket resolutions</p>
        </div>
      </div>

      {/* Tabs bar */}
      <div className="flex gap-4 border-b border-zinc-700/80 pb-2">
        {[
          { id: 'stats', label: 'Dashboard Stats', icon: FiActivity },
          { id: 'users', label: 'User Ledger', icon: FiUsers },
          { id: 'reports', label: 'Bug Reports', icon: FiAlertOctagon },
          { id: 'logs', label: 'Audit Trail Logs', icon: FiShield },
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              className={`flex items-center gap-2 px-4 py-2 font-semibold text-sm transition-all border-b-2 rounded-t-lg ${activeTab === t.id ? 'text-green-400 border-green-500 bg-green-500/5' : 'text-gray-400 border-transparent hover:text-white hover:bg-zinc-800/40'}`}
              onClick={() => setActiveTab(t.id)}
            >
              <Icon size={16} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ── TAB 1: DASHBOARD STATS ─────────────────────────────────────────────────── */}
      {activeTab === 'stats' && (
        <div className="space-y-6">
          {statsLoading || !stats ? (
            <div className="p-8 text-center text-gray-400">Loading metrics...</div>
          ) : (
            <>
              {/* Users Stats */}
              <div>
                <h3 className="text-base font-bold text-white mb-3">User Metrics</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {[
                    { label: 'Total Users', value: stats.users.totalUsers, color: 'text-white' },
                    { label: 'Total Buyers', value: stats.users.totalBuyers, color: 'text-blue-400' },
                    { label: 'Total Farmers', value: stats.users.totalFarmers, color: 'text-green-400' },
                    { label: 'Active Users', value: stats.users.activeUsers, color: 'text-emerald-400' },
                    { label: 'Blocked Accounts', value: stats.users.blockedUsers, color: 'text-red-400' },
                    { label: 'New This Month', value: stats.users.newUsersThisMonth, color: 'text-purple-400' },
                  ].map((s, idx) => (
                    <div key={idx} className="glass-card p-4 text-center">
                      <p className="text-xs text-gray-400 uppercase tracking-wider">{s.label}</p>
                      <h2 className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</h2>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reports & Financial Stats */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="glass-card">
                  <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
                    <FiAlertOctagon className="text-yellow-400" /> Support Ticket Summary
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-4">
                    {[
                      { label: 'Total', value: stats.reports.totalReports, color: 'text-white' },
                      { label: 'Open', value: stats.reports.openReports, color: 'text-blue-400' },
                      { label: 'Reviewing', value: stats.reports.underReviewReports, color: 'text-yellow-400' },
                      { label: 'Resolved', value: stats.reports.resolvedReports, color: 'text-green-400' },
                      { label: 'Closed', value: stats.reports.closedReports, color: 'text-zinc-400' },
                    ].map((s, idx) => (
                      <div key={idx} className="bg-zinc-800/50 p-3 rounded-lg border border-zinc-700/40 text-center">
                        <p className="text-[10px] text-gray-400 uppercase">{s.label}</p>
                        <h4 className={`text-xl font-bold mt-1 ${s.color}`}>{s.value}</h4>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="glass-card">
                  <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
                    <FiShoppingBag className="text-green-400" /> Financial & Listing Metrics
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                    {[
                      { label: 'Total Orders', value: stats.orders.totalOrders, color: 'text-white' },
                      { label: 'Pending Orders', value: stats.orders.pendingOrders, color: 'text-yellow-400' },
                      { label: 'Completed Orders', value: stats.orders.completedOrders, color: 'text-emerald-400' },
                      { label: 'Gross Revenue', value: fmtCurrency(stats.orders.totalRevenue), color: 'text-green-400', isCurrency: true },
                    ].map((s, idx) => (
                      <div key={idx} className="bg-zinc-800/50 p-3 rounded-lg border border-zinc-700/40 text-center">
                        <p className="text-[10px] text-gray-400 uppercase">{s.label}</p>
                        <h4 className={`text-base font-bold mt-1 ${s.color} truncate`}>{s.value}</h4>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Listings Categories Breakdown */}
              <div className="glass-card">
                <h3 className="text-base font-bold text-white mb-3">Active Listings Inventory Breakdown</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mt-3">
                  {stats.listings.categories.length === 0 ? (
                    <div className="col-span-full text-center text-sm text-gray-500 py-4">No active categories found in database.</div>
                  ) : (
                    stats.listings.categories.map((c, idx) => (
                      <div key={idx} className="p-3 bg-zinc-800/30 rounded border border-zinc-700/35 text-center">
                        <p className="text-xs text-green-400 font-semibold truncate capitalize">{c.category}</p>
                        <h3 className="text-xl font-bold text-white mt-1">{c.count}</h3>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── TAB 2: USER LEDGER ──────────────────────────────────────────────────────── */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="glass-card flex flex-wrap gap-4 items-center justify-between p-4">
            <div className="flex flex-wrap gap-3 items-center">
              <div className="input-group-inline">
                <div className="input-field-wrapper flex items-center bg-zinc-800 px-2 rounded border border-zinc-700 max-w-xs">
                  <FiSearch className="text-gray-400 mr-2" />
                  <input
                    className="input-field border-none bg-transparent py-1.5 focus:ring-0 text-sm"
                    placeholder="Search name, email, phone..."
                    value={userSearch}
                    onChange={(e) => { setUserSearch(e.target.value); setUserPage(1); }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <FiFilter size={13} className="text-gray-400" />
                <select
                  className="bg-zinc-800 border border-zinc-700 text-gray-300 rounded text-xs px-2.5 py-1.5"
                  value={userRoleFilter}
                  onChange={(e) => { setUserRoleFilter(e.target.value); setUserPage(1); }}
                >
                  <option value="ALL">All Roles</option>
                  <option value="BUYER">Buyers</option>
                  <option value="FARMER">Farmers</option>
                </select>

                <select
                  className="bg-zinc-800 border border-zinc-700 text-gray-300 rounded text-xs px-2.5 py-1.5"
                  value={userStatusFilter}
                  onChange={(e) => { setUserStatusFilter(e.target.value); setUserPage(1); }}
                >
                  <option value="ALL">All Statuses</option>
                  <option value="ACTIVE">Active</option>
                  <option value="BLOCKED">Blocked</option>
                  <option value="SUSPENDED">Suspended</option>
                </select>

                <select
                  className="bg-zinc-800 border border-zinc-700 text-gray-300 rounded text-xs px-2.5 py-1.5"
                  value={userSort}
                  onChange={(e) => { setUserSort(e.target.value); setUserPage(1); }}
                >
                  <option value="newest">Sort: Newest</option>
                  <option value="oldest">Sort: Oldest</option>
                  <option value="most_orders">Sort: Most Orders</option>
                  <option value="most_sales">Sort: Most Sales</option>
                </select>
              </div>
            </div>

            <Button size="sm" variant="ghost" onClick={() => { setUserSearch(''); setUserRoleFilter('ALL'); setUserStatusFilter('ALL'); setUserSort('newest'); fetchUsers(1); }}>
              Reset Filters
            </Button>
          </div>

          {/* Users Tables */}
          {usersLoading ? (
            <div className="p-8 text-center text-gray-400">Loading user ledger...</div>
          ) : users.length === 0 ? (
            <div className="glass-card text-center p-8 text-gray-400">No users match the criteria.</div>
          ) : (
            <div className="space-y-6">
              {/* Farmers Section (if role is not BUYER) */}
              {(userRoleFilter === 'ALL' || userRoleFilter === 'FARMER') && (
                <div className="glass-card overflow-x-auto">
                  <h3 className="text-base font-bold text-white mb-3">Farmers Ledger</h3>
                  <table className="min-w-full text-sm text-left text-gray-300">
                    <thead className="bg-zinc-800/60 text-xs text-gray-400 uppercase font-bold border-b border-zinc-700">
                      <tr>
                        <th className="px-4 py-3">Full Name</th>
                        <th className="px-4 py-3">Email & Phone</th>
                        <th className="px-4 py-3">Location</th>
                        <th className="px-4 py-3 text-center">Active / Total Listings</th>
                        <th className="px-4 py-3 text-center">Completed Sales</th>
                        <th className="px-4 py-3">Join Date</th>
                        <th className="px-4 py-3">Last Login</th>
                        <th className="px-4 py-3 text-center">Status</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-700/50">
                      {users.filter(u => u.role === 'FARMER').map((u) => (
                        <tr key={u._id} className="hover:bg-zinc-800/20">
                          <td className="px-4 py-3 font-semibold text-white">{u.name}</td>
                          <td className="px-4 py-3">
                            <p>{u.email}</p>
                            <span className="text-xs text-gray-500">{u.phone || 'N/A'}</span>
                          </td>
                          <td className="px-4 py-3 truncate max-w-[120px]">{u.location || 'N/A'}</td>
                          <td className="px-4 py-3 text-center">{u.activeProducts} / {u.totalListings}</td>
                          <td className="px-4 py-3 text-center font-bold text-green-400">{u.totalSales}</td>
                          <td className="px-4 py-3 text-xs">{new Date(u.createdAt).toLocaleDateString()}</td>
                          <td className="px-4 py-3 text-xs text-gray-400">{u.lastLogin ? new Date(u.lastLogin).toLocaleString() : 'Never'}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${statusStyles[u.accountStatus]}`}>
                              {u.accountStatus}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex gap-2 justify-end">
                              <button className="text-blue-400 hover:text-blue-300" onClick={() => handleViewDetails(u._id)} title="View Detail logs"><FiInfo /></button>
                              <button className="text-yellow-400 hover:text-yellow-300" onClick={() => setEditingUser(u)} title="Edit Profile"><FiEdit /></button>
                              {u.accountStatus === 'ACTIVE' ? (
                                <button className="text-red-400 hover:text-red-300 font-semibold text-xs" onClick={() => handleBlockUser(u._id)}>Block</button>
                              ) : (
                                <button className="text-green-400 hover:text-green-300 font-semibold text-xs" onClick={() => handleUnblockUser(u._id)}>Unblock</button>
                              )}
                              <button className="text-red-500 hover:text-red-400" onClick={() => setDeletingUser(u)} title="Delete User"><FiTrash2 /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Buyers Section (if role is not FARMER) */}
              {(userRoleFilter === 'ALL' || userRoleFilter === 'BUYER') && (
                <div className="glass-card overflow-x-auto">
                  <h3 className="text-base font-bold text-white mb-3">Buyers Ledger</h3>
                  <table className="min-w-full text-sm text-left text-gray-300">
                    <thead className="bg-zinc-800/60 text-xs text-gray-400 uppercase font-bold border-b border-zinc-700">
                      <tr>
                        <th className="px-4 py-3">Full Name</th>
                        <th className="px-4 py-3">Email & Phone</th>
                        <th className="px-4 py-3">Address</th>
                        <th className="px-4 py-3 text-center">Pending / Completed Orders</th>
                        <th className="px-4 py-3 text-center">Total Orders</th>
                        <th className="px-4 py-3">Join Date</th>
                        <th className="px-4 py-3">Last Login</th>
                        <th className="px-4 py-3 text-center">Status</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-700/50">
                      {users.filter(u => u.role === 'BUYER').map((u) => (
                        <tr key={u._id} className="hover:bg-zinc-800/20">
                          <td className="px-4 py-3 font-semibold text-white">{u.name}</td>
                          <td className="px-4 py-3">
                            <p>{u.email}</p>
                            <span className="text-xs text-gray-500">{u.phone || 'N/A'}</span>
                          </td>
                          <td className="px-4 py-3 truncate max-w-[120px]">{[u.village, u.city, u.state].filter(Boolean).join(', ') || 'N/A'}</td>
                          <td className="px-4 py-3 text-center">{u.pendingOrdersCount} / {u.completedOrdersCount}</td>
                          <td className="px-4 py-3 text-center font-bold text-blue-400">{u.totalOrders}</td>
                          <td className="px-4 py-3 text-xs">{new Date(u.createdAt).toLocaleDateString()}</td>
                          <td className="px-4 py-3 text-xs text-gray-400">{u.lastLogin ? new Date(u.lastLogin).toLocaleString() : 'Never'}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${statusStyles[u.accountStatus]}`}>
                              {u.accountStatus}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex gap-2 justify-end">
                              <button className="text-blue-400 hover:text-blue-300" onClick={() => handleViewDetails(u._id)} title="View Detail logs"><FiInfo /></button>
                              <button className="text-yellow-400 hover:text-yellow-300" onClick={() => setEditingUser(u)} title="Edit Profile"><FiEdit /></button>
                              {u.accountStatus === 'ACTIVE' ? (
                                <button className="text-red-400 hover:text-red-300 font-semibold text-xs" onClick={() => handleBlockUser(u._id)}>Block</button>
                              ) : (
                                <button className="text-green-400 hover:text-green-300 font-semibold text-xs" onClick={() => handleUnblockUser(u._id)}>Unblock</button>
                              )}
                              <button className="text-red-500 hover:text-red-400" onClick={() => setDeletingUser(u)} title="Delete User"><FiTrash2 /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination */}
              {userTotalPages > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                  <Button variant="ghost" size="sm" onClick={() => fetchUsers(userPage - 1)} disabled={userPage <= 1}>Previous</Button>
                  <span className="self-center text-sm text-gray-400">Page {userPage} of {userTotalPages}</span>
                  <Button variant="ghost" size="sm" onClick={() => fetchUsers(userPage + 1)} disabled={userPage >= userTotalPages}>Next</Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 3: BUG REPORTS MANAGEMENT ────────────────────────────────────────── */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="glass-card flex flex-wrap gap-4 items-center justify-between p-4">
            <div className="flex flex-wrap gap-3 items-center">
              <div className="input-group-inline">
                <div className="input-field-wrapper flex items-center bg-zinc-800 px-2 rounded border border-zinc-700 max-w-xs">
                  <FiSearch className="text-gray-400 mr-2" />
                  <input
                    className="input-field border-none bg-transparent py-1.5 focus:ring-0 text-sm"
                    placeholder="Search reports or reporter..."
                    value={reportSearch}
                    onChange={(e) => { setReportSearch(e.target.value); setReportPage(1); }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <FiFilter size={13} className="text-gray-400" />
                <select
                  className="bg-zinc-800 border border-zinc-700 text-gray-300 rounded text-xs px-2.5 py-1.5"
                  value={reportStatusFilter}
                  onChange={(e) => { setReportStatusFilter(e.target.value); setReportPage(1); }}
                >
                  <option value="ALL">All Statuses</option>
                  <option value="OPEN">Open</option>
                  <option value="UNDER_REVIEW">Under Review</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="CLOSED">Closed</option>
                </select>

                <select
                  className="bg-zinc-800 border border-zinc-700 text-gray-300 rounded text-xs px-2.5 py-1.5"
                  value={reportCategoryFilter}
                  onChange={(e) => { setReportCategoryFilter(e.target.value); setReportPage(1); }}
                >
                  <option value="ALL">All Categories</option>
                  <option value="BUG">Bug</option>
                  <option value="ORDER_ISSUE">Order Issue</option>
                  <option value="DELIVERY_ISSUE">Delivery Issue</option>
                  <option value="PAYMENT_ISSUE">Payment Issue</option>
                  <option value="MARKETPLACE_ISSUE">Marketplace Issue</option>
                  <option value="FEATURE_REQUEST">Feature Request</option>
                  <option value="SUGGESTION">Suggestion</option>
                  <option value="OTHER">Other</option>
                </select>

                <select
                  className="bg-zinc-800 border border-zinc-700 text-gray-300 rounded text-xs px-2.5 py-1.5"
                  value={reportRoleFilter}
                  onChange={(e) => { setReportRoleFilter(e.target.value); setReportPage(1); }}
                >
                  <option value="ALL">All Roles</option>
                  <option value="BUYER">Buyer</option>
                  <option value="FARMER">Farmer</option>
                </select>
              </div>
            </div>
          </div>

          {/* Reports Grid */}
          {reportsLoading ? (
            <div className="p-8 text-center text-gray-400">Loading support tickets...</div>
          ) : reports.length === 0 ? (
            <div className="glass-card text-center p-8 text-gray-400">No support tickets found.</div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reports.map((report) => (
                  <div key={report._id} className="glass-card p-4 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <span className="text-[10px] font-bold bg-zinc-700/50 px-2 py-0.5 rounded border border-zinc-600/30 text-gray-300">
                            {report.category}
                          </span>
                          <h4 className="font-bold text-white mt-1.5">{report.title}</h4>
                        </div>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded border ${statusStyles[report.status]}`}>
                          {report.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400">
                        Reported By: <span className="text-white font-semibold">{report.reportedBy?.name || 'N/A'}</span> ({report.reportedBy?.role}) · {report.reportedBy?.email}
                      </p>
                      <p className="text-sm text-gray-300 line-clamp-3">{report.description}</p>

                      {report.adminResponse && (
                        <div className="p-3 bg-green-500/5 rounded border border-green-500/15 text-xs">
                          <p className="font-bold text-green-400">💬 Admin Reply:</p>
                          <p className="text-gray-300 mt-1">{report.adminResponse}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-zinc-700/60 text-xs">
                      <span className="text-gray-500">{new Date(report.createdAt).toLocaleString()}</span>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => { setSelectedReport(report); setAdminResponseText(report.adminResponse || ''); setAdminResponseStatus(report.status); }}>
                          Respond
                        </Button>
                        <Button variant="ghost" size="sm" className="text-yellow-400" onClick={() => setEditingReport(report)}><FiEdit /></Button>
                        <Button variant="ghost" size="sm" className="text-red-400" onClick={() => setDeletingReport(report)}><FiTrash2 /></Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {reportTotalPages > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                  <Button variant="ghost" size="sm" onClick={() => fetchReports(reportPage - 1)} disabled={reportPage <= 1}>Previous</Button>
                  <span className="self-center text-sm text-gray-400">Page {reportPage} of {reportTotalPages}</span>
                  <Button variant="ghost" size="sm" onClick={() => fetchReports(reportPage + 1)} disabled={reportPage >= reportTotalPages}>Next</Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 4: AUDIT TRAIL LOGS ─────────────────────────────────────────────────── */}
      {activeTab === 'logs' && (
        <div className="glass-card overflow-x-auto">
          <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
            <FiShield className="text-green-400" /> Platform Audit Trail Logs (Read-Only)
          </h3>
          {logsLoading ? (
            <div className="p-8 text-center text-gray-400">Loading audit trail...</div>
          ) : auditLogs.length === 0 ? (
            <div className="text-center p-8 text-gray-400">No actions recorded yet.</div>
          ) : (
            <div className="space-y-4">
              <table className="min-w-full text-sm text-left text-gray-300">
                <thead className="bg-zinc-800/60 text-xs text-gray-400 uppercase font-bold border-b border-zinc-700">
                  <tr>
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">Action Type</th>
                    <th className="px-4 py-3">Target User</th>
                    <th className="px-4 py-3">Target Role</th>
                    <th className="px-4 py-3">Performed By Admin</th>
                    <th className="px-4 py-3">Metadata Info</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-700/50 text-xs">
                  {auditLogs.map((log) => (
                    <tr key={log._id} className="hover:bg-zinc-800/20">
                      <td className="px-4 py-3 text-gray-500 font-semibold">{new Date(log.createdAt).toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded border border-zinc-700 font-bold bg-zinc-800/50 tracking-wider">
                          {log.actionType}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-white font-semibold">{log.targetUser || '—'}</td>
                      <td className="px-4 py-3">{log.targetRole || '—'}</td>
                      <td className="px-4 py-3">{log.performedBy?.name || 'Admin'} ({log.performedBy?.email})</td>
                      <td className="px-4 py-3 text-gray-400 max-w-xs truncate" title={JSON.stringify(log.metadata)}>
                        {JSON.stringify(log.metadata)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              {logsTotalPages > 1 && (
                <div className="flex justify-center gap-2 mt-4 pt-3 border-t border-zinc-700">
                  <Button variant="ghost" size="sm" onClick={() => fetchAuditLogs(logsPage - 1)} disabled={logsPage <= 1}>Previous</Button>
                  <span className="self-center text-sm text-gray-400">Page {logsPage} of {logsTotalPages}</span>
                  <Button variant="ghost" size="sm" onClick={() => fetchAuditLogs(logsPage + 1)} disabled={logsPage >= logsTotalPages}>Next</Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── MODALS SECTION ─────────────────────────────────────────────────────────── */}

      {/* 1. User Profile Details Modal */}
      {selectedUser && (
        <div className="modal-backdrop">
          <div className="modal-card max-w-4xl max-h-[85vh] overflow-y-auto p-6 relative">
            <button className="absolute top-4 right-4 text-gray-400 hover:text-white" onClick={() => setSelectedUser(null)}><FiX size={20} /></button>
            <h2 className="text-xl font-bold text-white mb-4 border-b border-zinc-700 pb-2 flex items-center gap-2">
              <FiInfo /> Detailed Profile: {selectedUser.user.name} ({selectedUser.user.role})
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-300 mb-6">
              <div className="space-y-2 bg-zinc-800/20 p-4 rounded-lg border border-zinc-700/50">
                <p><span className="text-gray-400 font-semibold">Email:</span> {selectedUser.user.email}</p>
                <p><span className="text-gray-400 font-semibold">Phone:</span> {selectedUser.user.phone || 'N/A'}</p>
                <p><span className="text-gray-400 font-semibold">Bio:</span> {selectedUser.user.bio || 'N/A'}</p>
                <p><span className="text-gray-400 font-semibold">Coordinates:</span> {selectedUser.user.latitude ? `${selectedUser.user.latitude}, ${selectedUser.user.longitude}` : 'N/A'}</p>
              </div>
              <div className="space-y-2 bg-zinc-800/20 p-4 rounded-lg border border-zinc-700/50">
                <p><span className="text-gray-400 font-semibold">Full Address:</span> {[selectedUser.user.addressLine1, selectedUser.user.addressLine2, selectedUser.user.village, selectedUser.user.city, selectedUser.user.state, selectedUser.user.postalCode].filter(Boolean).join(', ') || 'N/A'}</p>
                <p><span className="text-gray-400 font-semibold">Account Status:</span> {selectedUser.user.accountStatus}</p>
                <p><span className="text-gray-400 font-semibold">Join Date:</span> {new Date(selectedUser.user.createdAt).toLocaleString()}</p>
                <p><span className="text-gray-400 font-semibold">Last Login:</span> {selectedUser.user.lastLogin ? new Date(selectedUser.user.lastLogin).toLocaleString() : 'Never'}</p>
              </div>
            </div>

            {/* Buyer Order logs */}
            {selectedUser.user.role === 'BUYER' && selectedUser.orders && (
              <div className="space-y-3">
                <h3 className="text-base font-bold text-white border-b border-zinc-700 pb-1">Order Logs</h3>
                {selectedUser.orders.length === 0 ? (
                  <p className="text-gray-500 text-sm">No orders recorded.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-xs text-left text-gray-300">
                      <thead className="bg-zinc-800 text-gray-400 uppercase">
                        <tr>
                          <th className="px-3 py-2">Order ID</th>
                          <th className="px-3 py-2">Product Name</th>
                          <th className="px-3 py-2 text-center">Quantity</th>
                          <th className="px-3 py-2 text-right">Grand Total</th>
                          <th className="px-3 py-2">Status</th>
                          <th className="px-3 py-2">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedUser.orders.map(o => (
                          <tr key={o._id} className="border-b border-zinc-700/50">
                            <td className="px-3 py-2 font-mono text-zinc-400">{o._id}</td>
                            <td className="px-3 py-2 text-white font-semibold">{o.productName}</td>
                            <td className="px-3 py-2 text-center">{o.quantity} {o.unit}</td>
                            <td className="px-3 py-2 text-right font-semibold text-green-400">{fmtCurrency(o.grandTotal)}</td>
                            <td className="px-3 py-2">{o.status}</td>
                            <td className="px-3 py-2">{new Date(o.createdAt).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Farmer Sales & listings logs */}
            {selectedUser.user.role === 'FARMER' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Listings */}
                <div className="space-y-3">
                  <h3 className="text-base font-bold text-white border-b border-zinc-700 pb-1">Inventory Listings</h3>
                  {selectedUser.listings?.length === 0 ? (
                    <p className="text-gray-500 text-sm">No active listings.</p>
                  ) : (
                    <div className="space-y-2 max-h-[30vh] overflow-y-auto">
                      {selectedUser.listings?.map(l => (
                        <div key={l._id} className="p-2 bg-zinc-800/40 rounded border border-zinc-700/40 flex justify-between text-xs">
                          <div>
                            <p className="font-semibold text-white">{l.productName}</p>
                            <span className="text-gray-400">Qty: {l.quantity} {l.unit} · Rate: {fmtCurrency(l.finalPrice)}</span>
                          </div>
                          <span className={`px-1.5 py-0.5 rounded border self-center text-[10px] ${statusStyles[l.status]}`}>{l.status}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Sales Ledger */}
                <div className="space-y-3">
                  <h3 className="text-base font-bold text-white border-b border-zinc-700 pb-1">Completed Sales</h3>
                  {selectedUser.sales?.length === 0 ? (
                    <p className="text-gray-500 text-sm">No completed sales.</p>
                  ) : (
                    <div className="space-y-2 max-h-[30vh] overflow-y-auto">
                      {selectedUser.sales?.map(s => (
                        <div key={s._id} className="p-2 bg-zinc-800/40 rounded border border-zinc-700/40 flex justify-between text-xs">
                          <div>
                            <p className="font-semibold text-white">{s.productName}</p>
                            <span className="text-gray-400">Buyer: {s.deliveryName || 'N/A'} · Rate: {fmtCurrency(s.grandTotal)}</span>
                          </div>
                          <span className={`px-1.5 py-0.5 rounded border self-center text-[10px] ${statusStyles[s.status] || 'bg-zinc-700'}`}>{s.status}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Reported Issues logs */}
            <div className="space-y-3 mt-6">
              <h3 className="text-base font-bold text-white border-b border-zinc-700 pb-1">Reported Issues</h3>
              {selectedUser.reports.length === 0 ? (
                <p className="text-gray-500 text-sm">No issues reported by this user.</p>
              ) : (
                <div className="space-y-2 max-h-[20vh] overflow-y-auto">
                  {selectedUser.reports.map(r => (
                    <div key={r._id} className="p-2 bg-zinc-800/30 rounded border border-zinc-700/30 flex justify-between text-xs">
                      <div>
                        <p className="font-semibold text-white">{r.title}</p>
                        <span className="text-gray-400">{r.category} · {new Date(r.createdAt).toLocaleDateString()}</span>
                      </div>
                      <span className={`px-1.5 py-0.5 rounded border self-center text-[10px] ${statusStyles[r.status]}`}>{r.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. Edit User Profile Modal */}
      {editingUser && (
        <div className="modal-backdrop">
          <div className="modal-card max-w-md p-6 relative">
            <button className="absolute top-4 right-4 text-gray-400 hover:text-white" onClick={() => setEditingUser(null)}><FiX size={20} /></button>
            <h2 className="text-lg font-bold text-white mb-4 border-b border-zinc-700 pb-2">
              Edit User Profile: {editingUser.name}
            </h2>
            <form onSubmit={handleEditUserSubmit} className="space-y-4 text-sm text-gray-300">
              <div className="input-group">
                <label className="input-label">Full Name</label>
                <div className="input-field-wrapper">
                  <input
                    className="input-field"
                    value={editingUser.name || ''}
                    onChange={(e) => setEditingUser(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
              </div>
              <div className="input-group">
                <label className="input-label">Email</label>
                <div className="input-field-wrapper">
                  <input
                    type="email"
                    className="input-field"
                    value={editingUser.email || ''}
                    onChange={(e) => setEditingUser(prev => ({ ...prev, email: e.target.value }))}
                    required
                  />
                </div>
              </div>
              <div className="input-group">
                <label className="input-label">Phone</label>
                <div className="input-field-wrapper">
                  <input
                    className="input-field"
                    value={editingUser.phone || ''}
                    onChange={(e) => setEditingUser(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
              </div>
              <div className="input-group">
                <label className="input-label">Address/Location</label>
                <div className="input-field-wrapper">
                  <input
                    className="input-field"
                    value={editingUser.location || ''}
                    onChange={(e) => setEditingUser(prev => ({ ...prev, location: e.target.value }))}
                  />
                </div>
              </div>
              <div className="input-group">
                <label className="input-label">Account Status</label>
                <div className="input-field-wrapper">
                  <select
                    className="input-field bg-zinc-800"
                    value={editingUser.accountStatus || 'ACTIVE'}
                    onChange={(e) => setEditingUser(prev => ({ ...prev, accountStatus: e.target.value }))}
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="BLOCKED">BLOCKED</option>
                    <option value="SUSPENDED">SUSPENDED</option>
                  </select>
                </div>
              </div>
              <Button type="submit" variant="primary" className="w-full">
                Save Changes
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* 3. Delete User Confirmation Modal */}
      {deletingUser && (
        <div className="modal-backdrop">
          <div className="modal-card max-w-sm p-6 text-center text-sm text-gray-300">
            <h3 className="text-lg font-bold text-white mb-2">Delete User Account</h3>
            <p className="mb-4">
              Are you sure you want to permanently delete <span className="text-red-400 font-semibold">{deletingUser.name}</span>'s account? 
              This will soft-delete their listings and anonymize all past orders.
            </p>
            <div className="flex gap-4 justify-center">
              <Button variant="ghost" onClick={() => setDeletingUser(null)}>Cancel</Button>
              <Button variant="primary" className="bg-red-600 hover:bg-red-500 border-red-700" onClick={() => handleDeleteUser(deletingUser._id)}>
                Delete Account
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Respond to Report Modal */}
      {selectedReport && (
        <div className="modal-backdrop">
          <div className="modal-card max-w-md p-6 relative">
            <button className="absolute top-4 right-4 text-gray-400 hover:text-white" onClick={() => setSelectedReport(null)}><FiX size={20} /></button>
            <h2 className="text-lg font-bold text-white mb-4 border-b border-zinc-700 pb-2">
              Respond to: {selectedReport.title}
            </h2>
            <div className="text-xs text-gray-400 mb-3 space-y-1">
              <p><span className="font-semibold text-gray-300">Reporter:</span> {selectedReport.reportedBy?.name} ({selectedReport.userRole})</p>
              <p><span className="font-semibold text-gray-300">Description:</span></p>
              <p className="bg-zinc-800/40 p-2 rounded border border-zinc-700/30 text-gray-300">{selectedReport.description}</p>
            </div>

            <form onSubmit={handleRespondReport} className="space-y-4 text-sm text-gray-300">
              <div className="input-group">
                <label className="input-label">Update Status</label>
                <div className="input-field-wrapper">
                  <select
                    className="input-field bg-zinc-800"
                    value={adminResponseStatus}
                    onChange={(e) => setAdminResponseStatus(e.target.value)}
                  >
                    <option value="OPEN">OPEN</option>
                    <option value="UNDER_REVIEW">UNDER REVIEW</option>
                    <option value="RESOLVED">RESOLVED</option>
                    <option value="CLOSED">CLOSED</option>
                  </select>
                </div>
              </div>
              <div className="input-group">
                <label className="input-label">Admin Response Text</label>
                <div className="input-field-wrapper">
                  <textarea
                    className="input-field min-h-[100px] py-2 resize-none"
                    placeholder="Enter support resolution note..."
                    value={adminResponseText}
                    onChange={(e) => setAdminResponseText(e.target.value)}
                    required
                  />
                </div>
              </div>
              <Button type="submit" variant="primary" className="w-full">
                Save & Notify User
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* 5. Edit Report Details Modal */}
      {editingReport && (
        <div className="modal-backdrop">
          <div className="modal-card max-w-md p-6 relative">
            <button className="absolute top-4 right-4 text-gray-400 hover:text-white" onClick={() => setEditingReport(null)}><FiX size={20} /></button>
            <h2 className="text-lg font-bold text-white mb-4 border-b border-zinc-700 pb-2">
              Edit Report Details
            </h2>
            <form onSubmit={handleEditReportSubmit} className="space-y-4 text-sm text-gray-300">
              <div className="input-group">
                <label className="input-label">Title</label>
                <div className="input-field-wrapper">
                  <input
                    className="input-field"
                    value={editingReport.title || ''}
                    onChange={(e) => setEditingReport(prev => ({ ...prev, title: e.target.value }))}
                    required
                  />
                </div>
              </div>
              <div className="input-group">
                <label className="input-label">Description</label>
                <div className="input-field-wrapper">
                  <textarea
                    className="input-field min-h-[100px] py-2 resize-none"
                    value={editingReport.description || ''}
                    onChange={(e) => setEditingReport(prev => ({ ...prev, description: e.target.value }))}
                    required
                  />
                </div>
              </div>
              <div className="input-group">
                <label className="input-label">Category</label>
                <div className="input-field-wrapper">
                  <select
                    className="input-field bg-zinc-800"
                    value={editingReport.category || 'BUG'}
                    onChange={(e) => setEditingReport(prev => ({ ...prev, category: e.target.value }))}
                  >
                    <option value="BUG">Bug</option>
                    <option value="ORDER_ISSUE">Order Issue</option>
                    <option value="DELIVERY_ISSUE">Delivery Issue</option>
                    <option value="PAYMENT_ISSUE">Payment Issue</option>
                    <option value="MARKETPLACE_ISSUE">Marketplace Issue</option>
                    <option value="FEATURE_REQUEST">Feature Request</option>
                    <option value="SUGGESTION">Suggestion</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>
              <Button type="submit" variant="primary" className="w-full">
                Save Changes
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* 6. Delete Report Confirmation Modal */}
      {deletingReport && (
        <div className="modal-backdrop">
          <div className="modal-card max-w-sm p-6 text-center text-sm text-gray-300">
            <h3 className="text-lg font-bold text-white mb-2">Delete Bug Report</h3>
            <p className="mb-4">
              Are you sure you want to delete report <span className="text-red-400 font-semibold">"{deletingReport.title}"</span>? 
              This action is permanent.
            </p>
            <div className="flex gap-4 justify-center">
              <Button variant="ghost" onClick={() => setDeletingReport(null)}>Cancel</Button>
              <Button variant="primary" className="bg-red-600 hover:bg-red-500 border-red-700" onClick={() => handleDeleteReport(deletingReport._id)}>
                Delete Report
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
