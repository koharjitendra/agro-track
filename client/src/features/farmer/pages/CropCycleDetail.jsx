import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { FiPlus, FiCalendar, FiActivity } from 'react-icons/fi';
import Loader from '../../../components/common/Loader.jsx';
import Button from '../../../components/common/Button.jsx';
import Input from '../../../components/common/Input.jsx';
import ExpenseList from '../components/ExpenseList.jsx';
import ExpenseTimeline from '../components/ExpenseTimeline.jsx';
import CropAnalyticsTab from '../components/CropAnalyticsTab.jsx';
import ExpenseForm from '../components/ExpenseForm.jsx';
import SaleForm from '../components/SaleForm.jsx';
import ProfitSummary from '../components/ProfitSummary.jsx';
import StageTracker from '../components/StageTracker.jsx';
import ActivityLogTab from '../components/ActivityLogTab.jsx';
import * as cropCyclesApi from '../../../api/cropCycles.api.js';
import * as expensesApi from '../../../api/expenses.api.js';
import * as transactionsApi from '../../../api/transactions.api.js';
import * as purchaseRequestsApi from '../../../api/purchaseRequests.api.js';
import { formatMoney } from '../../../utils/money.js';
import { formatDate } from '../../../utils/date.js';

const CropCycleDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [crop, setCrop] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [sales, setSales] = useState([]);
  const [purchaseRequests, setPurchaseRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [expenseView, setExpenseView] = useState('timeline');

  // Modals state
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [saleModalOpen, setSaleModalOpen] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [cropRes, expRes, salesRes, prRes] = await Promise.all([
        cropCyclesApi.getById(id),
        expensesApi.getByCropCycle(id),
        transactionsApi.getAll({ cropCycleId: id }),
        purchaseRequestsApi.getAll({ cropCycleId: id })
      ]);
      setCrop(cropRes.data);
      setExpenses(expRes.data || []);
      // transactions API returns { items, total } — extract items array
      const salesItems = salesRes.data?.items ?? salesRes.data ?? [];
      setSales(Array.isArray(salesItems) ? salesItems : []);
      setPurchaseRequests(prRes.data || []);
      
      // Update crop-level fields from response
      if (cropRes.data) {
        // No marketplace state to sync here — handled in My Listings
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to load crop cycle details.');
      navigate('/farmer/crop-cycles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleAddExpenseClick = () => {
    setSelectedExpense(null);
    setExpenseModalOpen(true);
  };

  const handleEditExpenseClick = (expense) => {
    setSelectedExpense(expense);
    setExpenseModalOpen(true);
  };

  const handleDeleteExpense = async (expenseId) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      try {
        await expensesApi.remove(expenseId);
        toast.success('Expense deleted.');
        fetchData();
      } catch (error) {
        toast.error('Failed to delete expense.');
      }
    }
  };

  if (loading) return <Loader fullPage />;

  const handleAcceptRequest = async (requestId) => {
    try {
      await purchaseRequestsApi.updateStatus(requestId, 'ACCEPTED');
      toast.success('Purchase request accepted!');
      fetchData();
    } catch (error) {
      toast.error(error.message || 'Failed to accept purchase request.');
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      await purchaseRequestsApi.updateStatus(requestId, 'REJECTED');
      toast.success('Purchase request rejected.');
      fetchData();
    } catch (error) {
      toast.error(error.message || 'Failed to reject purchase request.');
    }
  };

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalSales = sales.filter(s => s.status === 'FINAL').reduce((sum, t) => sum + t.totalAmount, 0);

  return (
    <div className="crop-detail-page fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">{crop.cropName}</h1>
          <p className="page-subtitle">{crop.seasonYear} Season Details</p>
        </div>
        <div className="header-actions">
          <Button variant="ghost" onClick={() => navigate('/farmer/crop-cycles')}>
            Back to Crops
          </Button>
          {activeTab === 'expenses' ? (
            <Button variant="primary" icon={FiPlus} onClick={handleAddExpenseClick}>
              Add Expense
            </Button>
          ) : (
            <Button variant="primary" icon={FiPlus} onClick={() => setSaleModalOpen(true)}>
              Record Sale
            </Button>
          )}
        </div>
      </div>

      <div className="crop-detail-grid">
        {/* Left Side: Summary Card */}
        <div className="detail-left-col">
          <div className="crop-summary-card glass-card">
            <h2 className="card-title">Crop Info</h2>
            <div className="crop-info-list">
              <div className="info-item">
                <FiCalendar className="info-icon" />
                <div>
                  <p className="info-label">Start Date</p>
                  <p className="info-value">{formatDate(crop.startDate)}</p>
                </div>
              </div>
              {crop.endDate && (
                <div className="info-item">
                  <FiCalendar className="info-icon" />
                  <div>
                    <p className="info-label">End Date</p>
                    <p className="info-value">{formatDate(crop.endDate)}</p>
                  </div>
                </div>
              )}
              <div className="info-item">
                <FiActivity className="info-icon" />
                <div>
                  <p className="info-label">Status</p>
                  <span className={`badge badge-${crop.status?.toLowerCase()}`}>{crop.status}</span>
                </div>
              </div>
            </div>
          </div>

          <ProfitSummary totalExpenses={totalExpenses} totalSales={totalSales} />
        </div>

        {/* Right Side: Expense/Sales List Tabs */}
        <div className="detail-right-col glass-card">
          <div className="tabs-header">
            <div className="tabs">
              <button
                className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                Overview
              </button>
              <button
                className={`tab-btn ${activeTab === 'activities' ? 'active' : ''}`}
                onClick={() => setActiveTab('activities')}
              >
                Farm Activities
              </button>
              <button
                className={`tab-btn ${activeTab === 'expenses' ? 'active' : ''}`}
                onClick={() => setActiveTab('expenses')}
              >
                Expense Ledger
              </button>
              <button
                className={`tab-btn ${activeTab === 'sales' ? 'active' : ''}`}
                onClick={() => setActiveTab('sales')}
              >
                Sales / Revenue
              </button>
              <button
                className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
                onClick={() => setActiveTab('analytics')}
              >
                Analytics
              </button>
            </div>
            {activeTab === 'expenses' && (
              <div className="flex bg-zinc-800 rounded p-1 ml-4">
                <button
                  className={`px-3 py-1 text-sm rounded ${expenseView === 'timeline' ? 'bg-zinc-600 text-white' : 'text-gray-400'}`}
                  onClick={() => setExpenseView('timeline')}
                >
                  Timeline
                </button>
                <button
                  className={`px-3 py-1 text-sm rounded ${expenseView === 'table' ? 'bg-zinc-600 text-white' : 'text-gray-400'}`}
                  onClick={() => setExpenseView('table')}
                >
                  Table
                </button>
              </div>
            )}
          </div>

          <div className="tab-content mt-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="glass-card p-4 rounded-lg">
                    <h3 className="text-gray-400 text-sm mb-1">Crop Name</h3>
                    <p className="text-xl font-bold">{crop.cropName}</p>
                  </div>
                  <div className="glass-card p-4 rounded-lg">
                    <h3 className="text-gray-400 text-sm mb-1">Area</h3>
                    <p className="text-xl font-bold">{crop.area ? `${crop.area} Acres` : 'N/A'}</p>
                  </div>
                  <div className="glass-card p-4 rounded-lg">
                    <h3 className="text-gray-400 text-sm mb-1">Seed Variety</h3>
                    <p className="text-xl font-bold">{crop.seedVariety || 'N/A'}</p>
                  </div>
                  <div className="glass-card p-4 rounded-lg">
                    <h3 className="text-gray-400 text-sm mb-1">Location</h3>
                    <p className="text-xl font-bold">{crop.location || 'N/A'}</p>
                  </div>
                  <div className="glass-card p-4 rounded-lg">
                    <h3 className="text-gray-400 text-sm mb-1">Expected Harvest</h3>
                    <p className="text-xl font-bold">{crop.expectedHarvestDate ? formatDate(crop.expectedHarvestDate) : 'N/A'}</p>
                  </div>
                  <div className="glass-card p-4 rounded-lg">
                    <h3 className="text-gray-400 text-sm mb-1">Crop Status</h3>
                    <span className={`badge badge-info mt-1 inline-block`}>{crop.cropStatus?.replace(/_/g, ' ')}</span>
                  </div>
                  <div className="glass-card p-4 rounded-lg">
                    <h3 className="text-gray-400 text-sm mb-1">Investment Amount</h3>
                    <p className="text-xl font-bold text-amber-400">{formatMoney(crop.investmentAmount || 0)}</p>
                  </div>
                  <div className="glass-card p-4 rounded-lg">
                    <h3 className="text-gray-400 text-sm mb-1">Description</h3>
                    <p className="text-sm text-gray-300">{crop.description || 'No description'}</p>
                  </div>
                </div>

                <StageTracker crop={crop} onUpdate={fetchData} />
              </div>
            )}
            {activeTab === 'activities' && (
              <ActivityLogTab cropId={id} />
            )}
            {activeTab === 'expenses' && (
              expenseView === 'table' ? (
                <ExpenseList
                  expenses={expenses}
                  onEdit={handleEditExpenseClick}
                  onDelete={handleDeleteExpense}
                />
              ) : (
                <ExpenseTimeline
                  expenses={expenses}
                  onEdit={handleEditExpenseClick}
                  onDelete={handleDeleteExpense}
                />
              )
            )}
            {activeTab === 'sales' && (
              <div className="sales-list-tab space-y-6">
                {/* Pending Requests Section */}
                <div className="pending-requests-section">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-1.5">
                    Pending Buyer Purchase Requests
                  </h3>
                  {purchaseRequests.filter((pr) => pr.status === 'PENDING').length === 0 ? (
                    <p className="text-sm text-gray-500 bg-zinc-900/30 p-4 rounded border border-zinc-800/80">
                      No pending purchase requests from buyers for this crop cycle.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {purchaseRequests
                        .filter((pr) => pr.status === 'PENDING')
                        .map((pr) => (
                          <div
                            key={pr._id}
                            className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700/50 flex flex-col justify-between"
                          >
                            <div>
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-bold text-gray-200">{pr.buyerId?.name || 'Anonymous'}</p>
                                  <p className="text-xs text-gray-400">{pr.buyerId?.email || '-'}</p>
                                </div>
                                <span className="badge badge-amber text-xs font-bold py-1 px-2 rounded">
                                  PENDING
                                </span>
                              </div>
                              <div className="grid grid-cols-2 gap-2 mt-3 text-sm border-t border-zinc-800 pt-2">
                                <div>
                                  <span className="text-gray-400">Offered Qty:</span>
                                  <p className="font-bold text-gray-200">{pr.quantity} KG</p>
                                </div>
                                <div>
                                  <span className="text-gray-400">Offered Price:</span>
                                  <p className="font-bold text-green-400">{formatMoney(pr.offerPrice)}/KG</p>
                                </div>
                              </div>
                              {pr.message && (
                                <p className="text-sm text-gray-300 mt-2 italic bg-zinc-900/40 p-2.5 rounded border border-zinc-800">
                                  "{pr.message}"
                                </p>
                              )}
                            </div>
                            <div className="flex gap-2 mt-4 pt-2 border-t border-zinc-800/50">
                              <Button
                                variant="primary"
                                className="flex-1 btn-sm"
                                onClick={() => handleAcceptRequest(pr._id)}
                              >
                                Accept Offer
                              </Button>
                              <Button
                                variant="ghost"
                                className="flex-1 btn-sm text-coral hover:bg-coral/10 border border-coral/20"
                                onClick={() => handleRejectRequest(pr._id)}
                              >
                                Reject
                              </Button>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                <div className="finalized-sales-section pt-4 border-t border-zinc-800">
                  <h3 className="text-lg font-bold mb-4">Completed Sales History</h3>
                  {sales.length === 0 ? (
                    <p className="empty-text">No sale transactions linked to this crop cycle.</p>
                  ) : (
                    <div className="table-container">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Buyer</th>
                            <th>Qty</th>
                            <th>Price/Unit</th>
                            <th>Total Value</th>
                            <th>Status</th>
                            <th>Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sales.map((tx) => (
                            <tr
                              key={tx._id}
                              className="cursor-pointer hover:bg-zinc-800/30"
                              onClick={() => navigate(`/transactions/${tx._id}`)}
                            >
                              <td>{tx.buyerId?.name || 'N/A'}</td>
                              <td>{tx.quantity} {tx.unit}</td>
                              <td>{formatMoney(tx.pricePerUnit)}</td>
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
                    </div>
                  )}
                </div>
              </div>
            )}
            {activeTab === 'analytics' && (
              <CropAnalyticsTab expenses={expenses} sales={sales} />
            )}
          </div>
        </div>
      </div>

      {/* Expense Modal */}
      <ExpenseForm
        isOpen={expenseModalOpen}
        onClose={() => setExpenseModalOpen(false)}
        cropCycleId={id}
        expense={selectedExpense}
        onSuccess={fetchData}
      />

      {/* Sale Modal */}
      <SaleForm
        isOpen={saleModalOpen}
        onClose={() => setSaleModalOpen(false)}
        cropCycleId={id}
        onSuccess={fetchData}
      />
    </div>
  );
};

export default CropCycleDetail;
