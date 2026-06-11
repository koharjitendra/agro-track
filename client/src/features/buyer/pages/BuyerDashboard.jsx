import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { FiShoppingBag, FiCreditCard, FiAlertCircle, FiUser, FiArrowRight } from 'react-icons/fi';
import Loader from '../../../components/common/Loader.jsx';
import ChartWrapper from '../../../components/charts/ChartWrapper.jsx';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import * as analyticsApi from '../../../api/analytics.api.js';
import * as transactionsApi from '../../../api/transactions.api.js';
import * as purchaseRequestsApi from '../../../api/purchaseRequests.api.js';
import * as marketplaceApi from '../../../api/marketplace.api.js';
import { getListItems } from '../../../utils/apiPayload.js';
import { formatMoney } from '../../../utils/money.js';
import { formatDate } from '../../../utils/date.js';

const BuyerDashboard = () => {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [dueSummary, setDueSummary] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [recentRequests, setRecentRequests] = useState([]);
  const [availableCropsCount, setAvailableCropsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [sumRes, dueRes, transRes, reqRes, marketRes] = await Promise.all([
          analyticsApi.getBuyerPaidVsDue(),
          analyticsApi.getBuyerDueSummary(),
          transactionsApi.getAll({ limit: 5 }),
          purchaseRequestsApi.getAll({ status: 'PENDING' }),
          marketplaceApi.getMarketplaceCrops({})
        ]);
        setSummary(sumRes.data);
        setDueSummary(dueRes.data || []);
        setRecentTransactions(getListItems(transRes));
        setRecentRequests(reqRes.data || []);
        setAvailableCropsCount((marketRes.data || []).length);
      } catch (error) {
        console.error('Error fetching buyer dashboard data:', error);
        toast.error(error.message || 'Failed to load dashboard.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <Loader fullPage />;

  const statCards = [
    { title: 'Available Products', value: availableCropsCount, sub: 'Currently on marketplace', icon: FiShoppingBag, color: 'info', link: '/marketplace' },
    { title: 'My Orders', value: recentRequests.length, sub: 'Active purchase requests', icon: FiAlertCircle, color: 'amber', link: '/buyer/purchases' },
    { title: 'Total Spent', value: formatMoney(summary?.totalPaid), sub: 'Amount cleared', icon: FiCreditCard, color: 'green-bright', link: '/transactions' },
    { title: 'Outstanding Due', value: formatMoney(summary?.totalDue), sub: 'Pending to clear', icon: FiAlertCircle, color: 'coral', link: '/transactions' },
  ];

  return (
    <div className="dashboard-wrapper fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Buyer Dashboard</h1>
          <p className="page-subtitle">Track your crop purchases, outstanding udhaar, and farmer ledger</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div
              key={i}
              className={`stat-card glass-card border-accent-${card.color} ${card.link ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''}`}
              onClick={() => card.link && navigate(card.link)}
            >
              <div className="stat-card-left">
                <p className="stat-card-title">{card.title}</p>
                <p className="stat-card-value">{card.value}</p>
                <p className="stat-card-subtitle">{card.sub}</p>
              </div>
              <div className="stat-card-right">
                <div className={`stat-card-icon-wrapper bg-${card.color}`}>
                  <Icon />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="dashboard-grid">
        {/* Due Amounts grouped by Farmer */}
        <div className="dashboard-chart-col">
          <ChartWrapper title="Outstanding Due by Farmer (Udhaar)" height={320}>
            {dueSummary.length === 0 ? (
              <div className="empty-chart-state">All debts cleared! No outstanding due.</div>
            ) : (
              <BarChart data={dueSummary} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <XAxis dataKey="farmerName" stroke="#95D5B2" />
                <YAxis stroke="#95D5B2" />
                <Tooltip formatter={(value) => formatMoney(value)} />
                <Bar dataKey="totalDue" radius={[8, 8, 0, 0]}>
                  {dueSummary.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill="#E76F51" />
                  ))}
                </Bar>
              </BarChart>
            )}
          </ChartWrapper>
        </div>

        <div className="dashboard-table-col glass-card">
          <div className="dashboard-card-header">
            <h2 className="dashboard-card-title">Recent Purchase Requests</h2>
          </div>
          <div className="table-container">
            {recentRequests.length === 0 ? (
              <p className="empty-text">No pending requests.</p>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Farmer</th>
                    <th>Crop</th>
                    <th>Qty</th>
                    <th>Offer</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentRequests.map((req) => (
                    <tr key={req._id}>
                      <td>{req.farmerId?.name || 'N/A'}</td>
                      <td>{req.cropCycleId?.cropName || 'N/A'}</td>
                      <td>{req.quantity}</td>
                      <td>{formatMoney(req.offerPrice)}/KG</td>
                      <td>
                        <span className={`badge badge-${req.status?.toLowerCase()}`}>
                          {req.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="dashboard-card-header mt-8">
            <h2 className="dashboard-card-title">Recent Purchases</h2>
            <Link to="/transactions" className="btn btn-ghost btn-sm">
              View All <FiArrowRight className="ml-1" />
            </Link>
          </div>
          <div className="table-container">
            {recentTransactions.length === 0 ? (
              <p className="empty-text">No purchases recorded yet.</p>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Farmer</th>
                    <th>Crop</th>
                    <th>Total Value</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTransactions.map((tx) => (
                    <tr key={tx._id} className="cursor-pointer hover:bg-zinc-800/30" onClick={() => navigate(`/transactions/${tx._id}`)}>
                      <td>{tx.farmerId?.name || 'N/A'}</td>
                      <td>{tx.cropCycleId?.cropName || 'N/A'}</td>
                      <td>{formatMoney(tx.totalAmount)}</td>
                      <td>
                        <span className={`badge badge-${tx.status?.toLowerCase()?.replace('_', '-')}`}>
                          {tx.status?.replace('_', ' ')}
                        </span>
                      </td>
                      <td>{formatDate(tx.transactionDate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuyerDashboard;
