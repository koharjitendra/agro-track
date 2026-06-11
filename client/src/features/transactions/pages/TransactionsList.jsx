import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import Loader from '../../../components/common/Loader.jsx';
import TransactionCard from '../components/TransactionCard.jsx';
import * as transactionsApi from '../../../api/transactions.api.js';
import { getListItems } from '../../../utils/apiPayload.js';

const TransactionsList = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL');

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const params = {};
      if (activeTab !== 'ALL') {
        params.status = activeTab;
      }
      const response = await transactionsApi.getAll(params);
      setTransactions(getListItems(response));
    } catch (error) {
      console.error(error);
      toast.error('Failed to load transaction ledger.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [activeTab]);

  return (
    <div className="transactions-list-page fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Ledger & Transactions</h1>
          <p className="page-subtitle">Unified audit ledger. Hover or click on transactions to view actions.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-header glass-card" style={{ marginBottom: '24px' }}>
        <div className="tabs">
          {['ALL', 'PENDING', 'FINAL', 'CHANGES_REQUESTED', 'REJECTED'].map((tab) => (
            <button
              key={tab}
              className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'ALL' ? 'All' : tab.replace('_', ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase())}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <Loader />
      ) : transactions.length === 0 ? (
        <div className="empty-state glass-card">
          <div className="empty-state-icon">📄</div>
          <h3>No Records Found</h3>
          <p>You do not have any transaction entries matching this status.</p>
        </div>
      ) : (
        <div className="transaction-cards-grid">
          {transactions.map((tx) => (
            <TransactionCard
              key={tx._id}
              transaction={tx}
              onClick={() => navigate(`/transactions/${tx._id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default TransactionsList;
