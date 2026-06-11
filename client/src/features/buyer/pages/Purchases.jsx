import React, { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { FiShoppingBag, FiRefreshCw, FiX } from 'react-icons/fi';
import Loader from '../../../components/common/Loader.jsx';
import { OrderCard, STATUS_CONFIG } from '../../../components/orders/OrderCard.jsx';
import * as ordersApi from '../../../api/orders.api.js';
import { useSocketStore } from '../../../store/socket.store.js';

const TABS = ['ALL', 'PENDING', 'ACCEPTED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED', 'REJECTED', 'CANCELLED'];
const TAB_LABELS = {
  ALL: 'All',
  PENDING: 'Pending',
  ACCEPTED: 'Accepted',
  OUT_FOR_DELIVERY: 'Delivery',
  DELIVERED: 'Delivered',
  COMPLETED: 'Completed',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
};

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('ALL');
  const [deliveryCodes, setDeliveryCodes] = useState({}); // orderId → code
  const [cancelingId, setCancelingId] = useState(null);
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

  // Real-time refresh on socket events
  useEffect(() => {
    const events = ['order:accepted', 'order:rejected', 'order:out_for_delivery', 'order:delivered', 'order:completed'];
    const cleanups = events.map((ev) => on(ev, () => fetchOrders(true)));
    return () => cleanups.forEach((fn) => fn());
  }, [on, fetchOrders]);

  const fetchDeliveryCode = async (orderId) => {
    if (deliveryCodes[orderId]) return; // already fetched
    try {
      const res = await ordersApi.getDeliveryCode(orderId);
      setDeliveryCodes((prev) => ({ ...prev, [orderId]: res.data?.deliveryCode }));
    } catch {
      toast.error('Could not fetch delivery code.');
    }
  };

  // Fetch delivery codes for orders in OUT_FOR_DELIVERY
  useEffect(() => {
    orders.forEach((order) => {
      if (['ACCEPTED', 'OUT_FOR_DELIVERY'].includes(order.status)) {
        fetchDeliveryCode(order._id);
      }
    });
  }, [orders]);

  const handleAction = async (action, orderId) => {
    if (action === 'cancel') {
      if (!window.confirm('Cancel this order?')) return;
      setCancelingId(orderId);
      try {
        await ordersApi.cancelOrder(orderId);
        toast.success('Order cancelled.');
        fetchOrders(true);
      } catch (err) {
        toast.error(err.message || 'Failed to cancel order.');
      } finally {
        setCancelingId(null);
      }
    }
  };

  const filtered = activeTab === 'ALL'
    ? orders
    : orders.filter((o) => o.status === activeTab);

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Orders</h1>
          <p className="page-subtitle">Track your purchases in real time</p>
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

      {/* Status Tabs */}
      <div className="orders-tabs-bar glass-card" style={{ marginBottom: 24, overflowX: 'auto' }}>
        <div className="tabs" style={{ whiteSpace: 'nowrap' }}>
          {TABS.map((tab) => {
            const count = tab === 'ALL'
              ? orders.length
              : orders.filter((o) => o.status === tab).length;
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
          <div className="empty-state-icon"><FiShoppingBag size={40} /></div>
          <h3>No Orders Found</h3>
          <p>
            {activeTab === 'ALL'
              ? "You haven't placed any orders yet. Browse the marketplace!"
              : `No orders with status "${TAB_LABELS[activeTab]}".`}
          </p>
          {activeTab === 'ALL' && (
            <a href="/marketplace" className="btn btn-primary mt-4 inline-block">
              Browse Marketplace
            </a>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((order) => (
            <OrderCard
              key={order._id}
              order={order}
              role="BUYER"
              deliveryCode={deliveryCodes[order._id]}
              onAction={cancelingId === order._id ? null : handleAction}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MyOrders;
