import React from 'react';
import { FiTrendingUp, FiTrendingDown, FiArrowDownLeft, FiArrowUpRight } from 'react-icons/fi';
import { formatMoney } from '../../../utils/money.js';

const ProfitSummary = ({ totalExpenses, totalSales }) => {
  const profit = totalSales - totalExpenses;
  const isProfit = profit >= 0;

  return (
    <div className="profit-summary-card glass-card">
      <h2 className="card-title">Yield Profitability</h2>
      <div className="profit-summary-list">
        <div className="profit-summary-row">
          <div className="row-left">
            <div className="summary-icon-wrapper bg-coral">
              <FiArrowDownLeft />
            </div>
            <span>Total Invested (Expenses)</span>
          </div>
          <span className="row-value text-coral">{formatMoney(totalExpenses)}</span>
        </div>

        <div className="profit-summary-row">
          <div className="row-left">
            <div className="summary-icon-wrapper bg-green">
              <FiArrowUpRight />
            </div>
            <span>Total Earned (Sales)</span>
          </div>
          <span className="row-value text-green-bright">{formatMoney(totalSales)}</span>
        </div>

        <hr className="summary-divider" />

        <div className={`profit-net-row ${isProfit ? 'profit-net-gain' : 'profit-net-loss'}`}>
          <div className="row-left text-bold">
            <span className="net-icon-wrapper">
              {isProfit ? <FiTrendingUp /> : <FiTrendingDown />}
            </span>
            <span>Net {isProfit ? 'Profit' : 'Loss'}</span>
          </div>
          <span className="row-value text-bold text-xl">
            {formatMoney(profit)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ProfitSummary;
