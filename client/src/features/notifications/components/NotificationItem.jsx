import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiAlertCircle, FiArrowRight } from 'react-icons/fi';
import Button from '../../../components/common/Button.jsx';
import { formatMoney } from '../../../utils/money.js';
import { formatDate } from '../../../utils/date.js';

const NotificationItem = ({ transaction }) => {
  const navigate = useNavigate();

  const proposerName = transaction.createdByUserId?.name || 'Other party';
  const proposerRole = transaction.createdByUserId?.role || 'user';

  return (
    <div className="notification-item glass-card border-accent-amber">
      <div className="notification-left">
        <div className="notification-icon-wrapper">
          <FiAlertCircle />
        </div>
        <div className="notification-details">
          <p className="notification-title">
            New agreement proposed by <span className="text-bold">{proposerName}</span> ({proposerRole})
          </p>
          <div className="notification-summary">
            <span className="text-bold text-green-bright">{transaction.cropCycleId?.cropName || 'Direct Trade'}</span>
            <span className="summary-separator"> • </span>
            <span>{transaction.quantity} {transaction.unit} × {formatMoney(transaction.pricePerUnit)}/{transaction.unit}</span>
            <span className="summary-separator"> • </span>
            <span className="text-bold">Total: {formatMoney(transaction.totalAmount)}</span>
          </div>
          <p className="notification-date">Proposed date: {formatDate(transaction.transactionDate)}</p>
        </div>
      </div>
      <div className="notification-right">
        <Button
          variant="primary"
          size="sm"
          icon={FiArrowRight}
          onClick={() => navigate(`/transactions/${transaction._id}`)}
        >
          Review & Sign
        </Button>
      </div>
    </div>
  );
};

export default NotificationItem;
