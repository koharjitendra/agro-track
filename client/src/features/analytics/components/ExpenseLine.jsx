import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import ChartWrapper from '../../../components/charts/ChartWrapper.jsx';
import { formatMoney } from '../../../utils/money.js';

const ExpenseLine = ({ title, data, dataKey, xKey, color = '#E76F51' }) => {
  return (
    <ChartWrapper title={title} height={320}>
      {(!data || data.length === 0) ? (
        <div className="empty-chart-state" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
          No historical data available.
        </div>
      ) : (
        <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(82, 183, 136, 0.05)" />
          <XAxis dataKey={xKey} stroke="#95D5B2" tick={{ fill: '#95D5B2', fontSize: 12 }} />
          <YAxis stroke="#95D5B2" tick={{ fill: '#95D5B2', fontSize: 12 }} />
          <Tooltip formatter={(value) => formatMoney(value)} contentStyle={{ backgroundColor: 'rgba(17, 26, 22, 0.95)', border: '1px solid rgba(82, 183, 136, 0.25)', borderRadius: '8px' }} />
          <Legend />
          <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={3} activeDot={{ r: 8 }} name={title.includes('Purchase') ? 'Purchases' : 'Expenses'} />
        </LineChart>
      )}
    </ChartWrapper>
  );
};

export default ExpenseLine;
