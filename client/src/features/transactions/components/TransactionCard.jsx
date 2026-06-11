import React from 'react';
import { FiCalendar, FiClock } from 'react-icons/fi';
import { useAuthStore } from '../../../store/auth.store.js';
import { formatMoney } from '../../../utils/money.js';
import { formatDate } from '../../../utils/date.js';

const TransactionCard = ({ transaction, onClick }) => {
  const { user } = useAuthStore();

  const isFarmer = user?.role === 'FARMER';
  const otherParty = isFarmer ? transaction.buyerId : transaction.farmerId;
  
  // Guard against populated or unpopulated creator IDs
  const creatorId = transaction.createdByUserId?._id || transaction.createdByUserId;
  const isCreator = creatorId === user?.id;

  return (
    <div className="transaction-card glass-card hover-glow" onClick={onClick}>
      <div className="tx-card-header">
        <div className="tx-parties">
          <span className="tx-party-label">{isFarmer ? 'Buyer' : 'Farmer'}:</span>
          <span className="tx-party-name">{otherParty?.name || 'Unknown'}</span>
        </div>
        <span className={`badge badge-${transaction.status?.toLowerCase()?.replace('_', '-')}`}>
          {transaction.status?.replace('_', ' ')}
        </span>
      </div>

      <div className="tx-card-body">
        <div className="tx-crop-info">
          <span className="tx-icon">🌾</span>
          <div>
            <p className="tx-crop-name">{transaction.cropCycleId?.cropName || 'Direct Trade (Unlinked)'}</p>
            <p className="tx-crop-qty">
              {transaction.quantity} {transaction.unit} × {formatMoney(transaction.pricePerUnit)}/{transaction.unit}
            </p>
          </div>
        </div>

        <div className="tx-ledger-details">
          <div className="ledger-item">
            <span className="ledger-label">Total Value:</span>
            <span className="ledger-val text-bold">{formatMoney(transaction.totalAmount)}</span>
          </div>
          <div className="ledger-item">
            <span className="ledger-label">Amount Paid:</span>
            <span className="ledger-val text-green-bright">{formatMoney(transaction.amountPaid)}</span>
          </div>
          <div className="ledger-item">
            <span className="ledger-label">Amount Due:</span>
            <span className="ledger-val text-coral">{formatMoney(transaction.amountDue)}</span>
          </div>
        </div>
      </div>

      <div className="tx-card-footer">
        <div className="footer-left">
          <FiCalendar className="footer-icon" />
          <span>{formatDate(transaction.transactionDate)}</span>
        </div>
        <div className="footer-right">
          <FiClock className="footer-icon" />
          <span>{isCreator ? 'Proposed by you' : 'Needs action'}</span>
        </div>
      </div>
    </div>
  );
};

export default TransactionCard;
