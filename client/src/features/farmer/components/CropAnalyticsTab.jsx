import React from 'react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend
} from 'recharts';
import { formatMoney } from '../../../utils/money.js';

const COLORS = ['#2D6A4F', '#52B788', '#74C69D', '#95D5B2', '#B7E4C7', '#D8F3DC', '#40916C', '#1B4332', '#081C15', '#212529'];

const CropAnalyticsTab = ({ expenses, sales }) => {
  // Expense breakdown by category
  const expenseByCategory = expenses.reduce((acc, exp) => {
    acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
    return acc;
  }, {});

  const pieData = Object.keys(expenseByCategory).map(key => ({
    name: key,
    value: expenseByCategory[key]
  })).sort((a, b) => b.value - a.value);

  // Group by month
  const monthlyDataMap = {};
  expenses.forEach(exp => {
    const date = new Date(exp.spentOnDate);
    const month = date.toLocaleString('default', { month: 'short', year: '2-digit' });
    if (!monthlyDataMap[month]) monthlyDataMap[month] = { name: month, Expense: 0, Revenue: 0 };
    monthlyDataMap[month].Expense += exp.amount;
  });

  sales.filter(s => s.status === 'FINAL').forEach(sale => {
    const date = new Date(sale.transactionDate);
    const month = date.toLocaleString('default', { month: 'short', year: '2-digit' });
    if (!monthlyDataMap[month]) monthlyDataMap[month] = { name: month, Expense: 0, Revenue: 0 };
    monthlyDataMap[month].Revenue += sale.totalAmount;
  });

  const barData = Object.values(monthlyDataMap);

  const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalRevenue = sales.filter(s => s.status === 'FINAL').reduce((sum, s) => sum + s.totalAmount, 0);
  const netProfit = totalRevenue - totalExpense;
  const roi = totalExpense > 0 ? ((netProfit / totalExpense) * 100).toFixed(1) : 0;

  return (
    <div className="crop-analytics-tab space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="glass-card p-4 rounded-lg">
          <p className="text-gray-400 text-sm">Total Invested</p>
          <p className="text-2xl font-bold text-red-400">{formatMoney(totalExpense)}</p>
        </div>
        <div className="glass-card p-4 rounded-lg">
          <p className="text-gray-400 text-sm">Total Revenue</p>
          <p className="text-2xl font-bold text-green-400">{formatMoney(totalRevenue)}</p>
        </div>
        <div className="glass-card p-4 rounded-lg">
          <p className="text-gray-400 text-sm">Net Profit</p>
          <p className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {formatMoney(netProfit)}
          </p>
        </div>
        <div className="glass-card p-4 rounded-lg">
          <p className="text-gray-400 text-sm">ROI %</p>
          <p className={`text-2xl font-bold ${roi >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {roi}%
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card p-4 rounded-lg h-80">
          <h3 className="text-lg font-bold mb-4">Expense Breakdown</h3>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatMoney(value)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-4 rounded-lg h-80">
          <h3 className="text-lg font-bold mb-4">Monthly Trend</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="name" stroke="#888" />
              <YAxis stroke="#888" />
              <Tooltip formatter={(value) => formatMoney(value)} contentStyle={{ backgroundColor: '#1A1A1A', borderColor: '#333' }} />
              <Legend />
              <Bar dataKey="Expense" fill="#EF476F" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Revenue" fill="#06D6A0" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default CropAnalyticsTab;
