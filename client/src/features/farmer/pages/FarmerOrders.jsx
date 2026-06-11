import React, { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { FiPackage, FiRefreshCw, FiKey } from 'react-icons/fi';
import Loader from '../../../components/common/Loader.jsx';
import { OrderCard, STATUS_CONFIG } from '../../../components/orders/OrderCard.jsx';
import * as ordersApi from '../../../api/orders.api.js';
import { useSocketStore } from '../../../store/socket.store.js';

const TABS = ['ALL', 'PENDING', 'ACCEPTED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED', 'REJECTED', 'CANCELLED'];
const TAB_LABELS = {
  ALL: 'All', PENDING: 'Pending', ACCEPTED: 'Accepted', OUT_FOR_DELIVERY: 'Delivery',
  DELIVERED: 'Delivered', COMPLETED: 'Completed', REJECTED: 'Rejected', CANCELLED: 'Cancelled',
};

const RejectModal = ({ orderId, onConfirm, onClose }) => {
  const [reason, setReason] = useState('');
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box glass-card" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold mb-3">Reject Order</h2>
        <p className="text-sm text-gray-400 mb-4">Provide a reason for rejecting this order. This will be shown to the buyer.</p>
        <textarea
          className="input-field w-full min-h-[90px]"
          placeholder="e.g. Out of stock, unable to deliver to this location..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          autoFocus
        />
        <div className="flex gap-3 mt-4">
          <button
            className="btn btn-danger flex-1"
            onClick={() => { if (reason.trim()) onConfirm(reason); else toast.error('Rejection reason is required.'); }}
          >
            Reject Order
          </button>
          <button className="btn btn-ghost flex-1" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

const VerifyCodeModal = ({ orderId, onConfirm, onClose }) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (code.length !== 6) { toast.error('Code must be 6 digits.'); return; }
    setLoading(true);
    try {
      await onConfirm(code);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box glass-card" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2"><FiKey /> Verify Delivery Code</h2>
        <p className="text-sm text-gray-400 mb-4">Ask the buyer for their 6-digit delivery code and enter it below to confirm delivery.</p>
        <form onSubmit={handleSubmit}>
          <input
            className="input-field w-full text-center text-2xl font-mono tracking-widest"
            maxLength={6}
            minLength={6}
            pattern="\d{6}"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            placeholder="000000"
            autoFocus
          />
          <div className="flex gap-3 mt-4">
            <button type="submit" className="btn btn-primary flex-1" disabled={loading}>
              {loading ? 'Verifying…' : 'Verify & Complete'}
            </button>
            <button type="button" className="btn btn-ghost flex-1" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const FarmerOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('ALL');
  const [rejectModal, setRejectModal] = useState(null); // orderId
  const [verifyModal, setVerifyModal] = useState(null); // orderId
  const { on } = useSocketStore();

  const fetchOrders = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      else setRefreshing(true);
      const params = { limit: 50 };
      if (activeTab !== 'ALL') params.status = activeTab;
      const res = await ordersApi.getAll(params);
      setOrders(res.data?.orders || []);
    } catch {
      toast.error('Failed to load orders.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // Real-time refresh on new orders / cancellations
  useEffect(() => {
    const cleanups = [
      on('order:new', () => { toast('📦 New order received!', { icon: '🛒' }); fetchOrders(true); }),
      on('order:cancelled', () => fetchOrders(true)),
    ];
    return () => cleanups.forEach((fn) => fn());
  }, [on, fetchOrders]);

  const handleAction = async (action, orderId) => {
    try {
      if (action === 'accept') {
        await ordersApi.acceptOrder(orderId);
        toast.success('Order accepted!');
        fetchOrders(true);
      } else if (action === 'reject') {
        setRejectModal(orderId);
      } else if (action === 'out_for_delivery') {
        await ordersApi.markOutForDelivery(orderId);
        toast.success('Marked as out for delivery.');
        fetchOrders(true);
      } else if (action === 'verify_code') {
        setVerifyModal(orderId);
      }
    } catch (err) {
      toast.error(err.message || 'Action failed.');
    }
  };

  const handleRejectConfirm = async (reason) => {
    try {
      await ordersApi.rejectOrder(rejectModal, reason);
      toast.success('Order rejected.');
      setRejectModal(null);
      fetchOrders(true);
    } catch (err) {
      toast.error(err.message || 'Failed to reject order.');
    }
  };

  const handleVerifyConfirm = async (code) => {
    try {
      await ordersApi.verifyDeliveryCode(verifyModal, code);
      toast.success('✅ Delivery verified! Order completed.');
      setVerifyModal(null);
      fetchOrders(true);
    } catch (err) {
      toast.error(err.message || 'Invalid code.');
      throw err; // keep modal open
    }
  };

  const filtered = activeTab === 'ALL' ? orders : orders.filter((o) => o.status === activeTab);

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Incoming Orders</h1>
          <p className="page-subtitle">Manage and track all your customer orders</p>
        </div>
        <button
          className="btn btn-ghost flex items-center gap-2"
          onClick={() => fetchOrders(true)}
          disabled={refreshing}
        >
          <FiRefreshCw className={refreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="glass-card" style={{ marginBottom: 24, overflowX: 'auto' }}>
        <div className="tabs" style={{ whiteSpace: 'nowrap' }}>
          {TABS.map((tab) => {
            const count = tab === 'ALL' ? orders.length : orders.filter((o) => o.status === tab).length;
            const cfg = STATUS_CONFIG[tab];
            return (
              <button
                key={tab}
                className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
                style={activeTab === tab && cfg ? { borderBottomColor: cfg.color, color: cfg.color } : {}}
              >
                {TAB_LABELS[tab]}
                <span className="ml-1 text-xs opacity-60">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <Loader />
      ) : filtered.length === 0 ? (
        <div className="empty-state glass-card">
          <div className="empty-state-icon"><FiPackage size={40} /></div>
          <h3>No Orders</h3>
          <p>{activeTab === 'ALL' ? 'No orders yet. Make sure your listings are active.' : `No "${TAB_LABELS[activeTab]}" orders.`}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((order) => (
            <OrderCard
              key={order._id}
              order={order}
              role="FARMER"
              onAction={handleAction}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {rejectModal && (
        <RejectModal
          orderId={rejectModal}
          onConfirm={handleRejectConfirm}
          onClose={() => setRejectModal(null)}
        />
      )}
      {verifyModal && (
        <VerifyCodeModal
          orderId={verifyModal}
          onConfirm={handleVerifyConfirm}
          onClose={() => setVerifyModal(null)}
        />
      )}
    </div>
  );
};

export default FarmerOrders;
