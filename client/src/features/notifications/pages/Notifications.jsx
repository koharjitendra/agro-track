import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import {
  FiBell, FiCheck, FiPackage, FiCheckCircle, FiAlertCircle,
  FiAlertTriangle, FiInfo, FiTruck, FiStar, FiCloud
} from 'react-icons/fi';
import Loader from '../../../components/common/Loader.jsx';
import NotificationItem from '../components/NotificationItem.jsx';
import * as notificationsApi from '../../../api/notifications.api.js';
import * as approvalsApi from '../../../api/approvals.api.js';
import { useNotificationStore } from '../../../store/notification.store.js';
import { useSocketStore } from '../../../store/socket.store.js';

const TYPE_CONFIG = {
  ORDER_CREATED:    { icon: FiPackage,       color: '#3B82F6', label: 'New Order' },
  ORDER_ACCEPTED:   { icon: FiCheckCircle,   color: '#22C55E', label: 'Accepted' },
  ORDER_REJECTED:   { icon: FiAlertCircle,   color: '#EF4444', label: 'Rejected' },
  OUT_FOR_DELIVERY: { icon: FiTruck,         color: '#8B5CF6', label: 'Out for Delivery' },
  DELIVERED:        { icon: FiStar,          color: '#22C55E', label: 'Delivered' },
  COMPLETED:        { icon: FiCheckCircle,   color: '#15803D', label: 'Completed' },
  PAYMENT_RECEIVED: { icon: FiStar,          color: '#F59E0B', label: 'Payment' },
  LOW_STOCK:        { icon: FiAlertTriangle, color: '#F59E0B', label: 'Low Stock' },
  WEATHER_ALERT:    { icon: FiCloud,         color: '#60A5FA', label: 'Weather' },
  MARKET_ALERT:     { icon: FiInfo,          color: '#A78BFA', label: 'Market' },
  CROP_ALERT:       { icon: FiAlertTriangle, color: '#FB923C', label: 'Crop Alert' },
  ADMIN_RESPONSE:   { icon: FiInfo,          color: '#94A3B8', label: 'Admin' },
};

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('orders');
  const { setUnreadCount } = useNotificationStore();
  const { on } = useSocketStore();

  const load = async () => {
    try {
      setLoading(true);
      const [nRes, pRes] = await Promise.all([
        notificationsApi.getAll({ limit: 50 }),
        approvalsApi.getPending(),
      ]);
      setNotifications(nRes.data?.notifications || []);
      setPending(pRes.data || []);
    } catch {
      toast.error('Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // Real-time: receive new notification
  useEffect(() => {
    const offNew = on('notification:new', ({ notification }) => {
      if (notification) {
        setNotifications((prev) => [notification, ...prev]);
      }
    });
    const offCount = on('notification:unread_count', ({ count }) => {
      setUnreadCount(count);
    });
    return () => { offNew(); offCount(); };
  }, [on, setUnreadCount]);

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
      toast.success('All marked as read.');
    } catch {
      toast.error('Failed to mark as read.');
    }
  };

  const handleMarkOne = async (id) => {
    try {
      await notificationsApi.markAsRead(id);
      setNotifications((prev) => prev.map((n) => n._id === id ? { ...n, read: true } : n));
      const unread = notifications.filter((n) => !n.read && n._id !== id).length;
      setUnreadCount(unread);
    } catch {}
  };

  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div className="notif-page fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="page-subtitle">{unread > 0 ? `${unread} unread` : 'All caught up'}</p>
        </div>
        {unread > 0 && (
          <button className="btn btn-ghost btn-sm flex items-center gap-2" onClick={handleMarkAllRead}>
            <FiCheck /> Mark all read
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="notif-tabs">
        <button
          className={`notif-tab ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          <FiPackage /> Orders & Updates
          {unread > 0 && <span className="notif-tab-badge">{unread}</span>}
        </button>
        <button
          className={`notif-tab ${activeTab === 'approvals' ? 'active' : ''}`}
          onClick={() => setActiveTab('approvals')}
        >
          <FiAlertCircle /> Transaction Approvals
          {pending.length > 0 && <span className="notif-tab-badge">{pending.length}</span>}
        </button>
      </div>

      {loading ? (
        <Loader />
      ) : activeTab === 'orders' ? (
        notifications.length === 0 ? (
          <div className="empty-state glass-card">
            <div className="empty-state-icon"><FiBell /></div>
            <h3>No notifications yet</h3>
            <p>Order alerts and status updates will appear here in real time.</p>
          </div>
        ) : (
          <div className="notif-list">
            {notifications.map((n) => {
              const typeCfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.ORDER_CREATED;
              const TypeIcon = typeCfg.icon;
              return (
                <div
                  key={n._id}
                  className={`notif-item glass-card ${!n.read ? 'unread' : ''}`}
                  onClick={() => !n.read && handleMarkOne(n._id)}
                >
                  <div className="notif-item-left">
                    <div
                      className="notif-type-icon"
                      style={{ color: typeCfg.color, background: `${typeCfg.color}1a`, borderRadius: '50%', padding: 8 }}
                    >
                      <TypeIcon size={16} />
                    </div>
                  </div>
                  <div className="notif-item-body">
                    <p className="notif-item-title">{n.title}</p>
                    <p className="notif-item-body-text">{n.message}</p>
                    <span className="notif-item-time">
                      {new Date(n.createdAt).toLocaleString('en-IN', {
                        day: '2-digit', month: 'short', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </span>
                  </div>
                  {!n.read && <span className="notif-unread-dot" aria-label="Unread" />}
                </div>
              );
            })}
          </div>
        )
      ) : (
        pending.length === 0 ? (
          <div className="empty-state glass-card">
            <div className="empty-state-icon">🔔</div>
            <h3>All caught up!</h3>
            <p>No pending transaction approvals.</p>
          </div>
        ) : (
          <div className="notifications-list">
            {pending.map((tx) => (
              <NotificationItem key={tx._id} transaction={tx} onAction={load} />
            ))}
          </div>
        )
      )}
    </div>
  );
};

export default Notifications;
