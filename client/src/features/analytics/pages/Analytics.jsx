import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import Loader from '../../../components/common/Loader.jsx';
import ChartWrapper from '../../../components/charts/ChartWrapper.jsx';
import ExpensePie from '../components/ExpensePie.jsx';
import ExpenseLine from '../components/ExpenseLine.jsx';
import SalesVsExpenseBar from '../components/SalesVsExpenseBar.jsx';
import { useAuthStore } from '../../../store/auth.store.js';
import * as analyticsApi from '../../../api/analytics.api.js';
import * as cropCyclesApi from '../../../api/cropCycles.api.js';

const Analytics = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [crops, setCrops] = useState([]);
  const [selectedCropId, setSelectedCropId] = useState('');

  // Farmer States
  const [expenseBreakdown, setExpenseBreakdown] = useState([]);
  const [expensesTimeline, setExpensesTimeline] = useState([]);
  const [salesVsExpenses, setSalesVsExpenses] = useState([]);

  // Buyer States
  const [purchasesTimeline, setPurchasesTimeline] = useState([]);
  const [dueSummary, setDueSummary] = useState([]);

  const isFarmer = user?.role === 'FARMER';

  const fetchFarmerData = async () => {
    try {
      setLoading(true);
      const [cropsRes, breakRes, timeRes, sveRes] = await Promise.all([
        cropCyclesApi.getAll(),
        analyticsApi.getFarmerExpenseBreakdown(selectedCropId || undefined),
        analyticsApi.getFarmerExpensesTimeline(),
        analyticsApi.getFarmerSalesVsExpenses()
      ]);
      setCrops(cropsRes.data || []);
      setExpenseBreakdown(breakRes.data || []);
      setExpensesTimeline(timeRes.data || []);
      setSalesVsExpenses(sveRes.data || []);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load farmer analytics.');
    } finally {
      setLoading(false);
    }
  };

  const fetchBuyerData = async () => {
    try {
      setLoading(true);
      const [timeRes, dueRes] = await Promise.all([
        analyticsApi.getBuyerPurchasesTimeline(),
        analyticsApi.getBuyerDueSummary()
      ]);
      setPurchasesTimeline(timeRes.data || []);
      setDueSummary(dueRes.data || []);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load buyer analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isFarmer) {
      fetchFarmerData();
    } else {
      fetchBuyerData();
    }
  }, [isFarmer, selectedCropId]);

  if (loading) return <Loader fullPage />;

  return (
    <div className="analytics-page fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Financial Analytics</h1>
          <p className="page-subtitle">Visual summaries of your ledgers, costs, and profits</p>
        </div>

        {isFarmer && crops.length > 0 && (
          <div className="filter-group">
            <label className="filter-label" htmlFor="analytics-crop-filter">Filter by Crop Cycle:</label>
            <select
              id="analytics-crop-filter"
              className="input-field select-field"
              value={selectedCropId}
              onChange={(e) => setSelectedCropId(e.target.value)}
              style={{ width: '200px' }}
            >
              <option value="">All Crop Cycles</option>
              {crops.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.cropName} ({c.seasonYear})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {isFarmer ? (
        <div className="analytics-grid">
          {/* Pie Chart: Expense breakdown */}
          <ExpensePie data={expenseBreakdown} />

          {/* Line Chart: Expenses timeline */}
          <ExpenseLine title="Expenditures Over Time" data={expensesTimeline} dataKey="total" xKey="month" />

          {/* Bar Chart: Sales vs Expenses per crop cycle */}
          <SalesVsExpenseBar data={salesVsExpenses} />
        </div>
      ) : (
        <div className="analytics-grid">
          {/* Line Chart: Purchases timeline */}
          <ExpenseLine title="Purchases Over Time" data={purchasesTimeline} dataKey="total" xKey="month" color="#52B788" />

          {/* Bar Chart: Udhaar due by Farmer */}
          <ChartWrapper title="Debt Balance by Farmer (Udhaar)" height={320}>
            {dueSummary.length === 0 ? (
              <div className="empty-chart-state">All debts cleared! No balances due.</div>
            ) : (
              <SalesVsExpenseBar isBuyerDue data={dueSummary} />
            )}
          </ChartWrapper>
        </div>
      )}
    </div>
  );
};

export default Analytics;
