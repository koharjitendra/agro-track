import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import ChartWrapper from '../../../components/charts/ChartWrapper.jsx';
import { formatMoney } from '../../../utils/money.js';

const COLORS = [
  '#2D6A4F', // Forest green
  '#40916C', // Medium green
  '#52B788', // Light forest green
  '#74C69D', // Mint green
  '#95D5B2', // Pale green
  '#D4A373', // Amber
  '#E76F51', // Coral
  '#4EA8DE', // Blue
  '#9B72CF', // Purple
  '#F4845F', // Light coral
];

const ExpensePie = ({ data }) => {
  return (
    <ChartWrapper title="Expense Breakdown by Category" height={320}>
      {(!data || data.length === 0) ? (
        <div className="empty-chart-state" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
          No expense records found.
        </div>
      ) : (
        <PieChart>
          <Pie
            data={data}
            dataKey="total"
            nameKey="category"
            cx="50%"
            cy="50%"
            outerRadius={80}
            fill="#8884d8"
            label={({ name, percent }) => `${name || ''} (${(percent * 100).toFixed(0)}%)`}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => formatMoney(value)} />
          <Legend />
        </PieChart>
      )}
    </ChartWrapper>
  );
};

export default ExpensePie;
