import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import ChartWrapper from '../../../components/charts/ChartWrapper.jsx';
import { formatMoney } from '../../../utils/money.js';

const SalesVsExpenseBar = ({ data, isBuyerDue = false }) => {
  if (isBuyerDue) {
    return (
      <BarChart width={500} height={300} data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(82, 183, 136, 0.05)" />
        <XAxis dataKey="farmerName" stroke="#95D5B2" tick={{ fill: '#95D5B2', fontSize: 12 }} />
        <YAxis stroke="#95D5B2" tick={{ fill: '#95D5B2', fontSize: 12 }} />
        <Tooltip formatter={(value) => formatMoney(value)} contentStyle={{ backgroundColor: 'rgba(17, 26, 22, 0.95)', border: '1px solid rgba(82, 183, 136, 0.25)', borderRadius: '8px' }} />
        <Legend />
        <Bar dataKey="totalDue" fill="#E76F51" radius={[6, 6, 0, 0]} name="Udhaar (Debt Balance)" />
      </BarChart>
    );
  }

  return (
    <ChartWrapper title="Sales Revenue vs Expenses per Crop" height={320}>
      {(!data || data.length === 0) ? (
        <div className="empty-chart-state" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
          No crop cycle statistics available.
        </div>
      ) : (
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(82, 183, 136, 0.05)" />
          <XAxis dataKey="cropName" stroke="#95D5B2" tick={{ fill: '#95D5B2', fontSize: 12 }} />
          <YAxis stroke="#95D5B2" tick={{ fill: '#95D5B2', fontSize: 12 }} />
          <Tooltip formatter={(value) => formatMoney(value)} contentStyle={{ backgroundColor: 'rgba(17, 26, 22, 0.95)', border: '1px solid rgba(82, 183, 136, 0.25)', borderRadius: '8px' }} />
          <Legend />
          <Bar dataKey="totalSales" fill="#52B788" radius={[4, 4, 0, 0]} name="Sales Revenue" />
          <Bar dataKey="totalExpenses" fill="#E76F51" radius={[4, 4, 0, 0]} name="Expenses" />
        </BarChart>
      )}
    </ChartWrapper>
  );
};

export default SalesVsExpenseBar;
