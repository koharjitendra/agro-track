import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  FiGrid, FiList, FiTrendingUp, FiBell, FiDollarSign,
  FiShoppingBag, FiPackage, FiCloudRain, FiCpu, FiLogOut,
  FiShoppingCart, FiUser, FiTag, FiClipboard, FiAlertOctagon, FiShield
} from 'react-icons/fi';
import { useAuthStore } from '../../store/auth.store.js';
import { useUiStore } from '../../store/ui.store.js';
import { useCartStore } from '../../store/cart.store.js';
import { useNotificationStore } from '../../store/notification.store.js';

const farmerSections = [
  {
    label: 'Overview',
    links: [
      { to: '/farmer/dashboard', label: 'Dashboard', icon: FiGrid },
      { to: '/analytics', label: 'Analytics', icon: FiTrendingUp },
    ],
  },
  {
    label: 'Farm',
    links: [
      { to: '/farmer/crop-cycles', label: 'Crop Cycles', icon: FiList },
      { to: '/farmer/inventory', label: 'Inventory', icon: FiPackage },
      { to: '/transactions', label: 'Sales Ledger', icon: FiDollarSign },
    ],
  },
  {
    label: 'Market',
    links: [
      { to: '/farmer/listings', label: 'My Listings', icon: FiTag },
      { to: '/farmer/orders', label: 'Orders', icon: FiClipboard },
      { to: '/marketplace', label: 'Marketplace', icon: FiShoppingBag },
      { to: '/farmer/market-prices', label: 'Market Prices', icon: FiTrendingUp },
    ],
  },
  {
    label: 'Tools',
    links: [
      { to: '/farmer/weather', label: 'Decision Center', icon: FiCloudRain },
      { to: '/farmer/ai-assistant', label: 'AI Farm Expert', icon: FiCpu },
    ],
  },
  {
    label: 'Account',
    links: [
      { to: '/farmer/profile', label: 'My Profile', icon: FiUser },
      { to: '/notifications', label: 'Notifications', icon: FiBell, badge: 'notif' },
      { to: '/reports', label: 'Report Issue', icon: FiAlertOctagon },
    ],
  },
];

const buyerSections = [
  {
    label: 'Overview',
    links: [
      { to: '/buyer/dashboard', label: 'Dashboard', icon: FiGrid },
    ],
  },
  {
    label: 'Shopping',
    links: [
      { to: '/marketplace', label: 'Browse Crops', icon: FiShoppingBag },
      { to: '/buyer/cart', label: 'My Cart', icon: FiShoppingCart, badge: 'cart' },
      { to: '/buyer/purchases', label: 'My Orders', icon: FiPackage },
    ],
  },
  {
    label: 'Account',
    links: [
      { to: '/buyer/profile', label: 'My Profile', icon: FiUser },
      { to: '/notifications', label: 'Notifications', icon: FiBell, badge: 'notif' },
      { to: '/reports', label: 'Report Issue', icon: FiAlertOctagon },
    ],
  },
];

const adminSections = [
  {
    label: 'System Admin',
    links: [
      { to: '/admin?tab=stats', label: 'Dashboard Stats', icon: FiGrid },
      { to: '/admin?tab=users', label: 'User Ledger', icon: FiUser },
      { to: '/admin?tab=reports', label: 'Bug Reports', icon: FiAlertOctagon },
      { to: '/admin?tab=logs', label: 'Audit Trail Logs', icon: FiShield },
    ],
  },
];

const Sidebar = () => {
  const { user, logout } = useAuthStore();
  const { sidebarOpen, closeSidebar } = useUiStore();
  const { cartCount } = useCartStore();
  const { unreadCount } = useNotificationStore();
  const navigate = useNavigate();

  const sections = user?.role === 'ADMIN' ? adminSections : user?.role === 'FARMER' ? farmerSections : buyerSections;
  const initials = user?.name?.slice(0, 2).toUpperCase() || 'U';

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <>
      {sidebarOpen && (
        <div className="sidebar-backdrop" onClick={closeSidebar} aria-hidden="true" />
      )}
      <aside className={`sidebar-v2 ${sidebarOpen ? 'open' : ''}`}>
        <div className="sv2-brand">
          <div className="sv2-brand-icon">🌾</div>
          <span className="sv2-brand-name">Agro Track</span>
        </div>

        <div className="sv2-user">
          <div className="sv2-avatar">{initials}</div>
          <div className="sv2-user-info">
            <p className="sv2-user-name">{user?.name}</p>
            <span className={`sv2-user-role sv2-role-${user?.role?.toLowerCase()}`}>
              {user?.role}
            </span>
          </div>
        </div>

        <nav className="sv2-nav">
          {sections.map((section) => (
            <div key={section.label} className="sv2-section">
              <p className="sv2-section-label">{section.label}</p>
              {section.links.map((link) => {
                const Icon = link.icon;
                const count = link.badge === 'cart' ? cartCount() : link.badge === 'notif' ? unreadCount : 0;
                return (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    className={({ isActive }) => `sv2-link ${isActive ? 'active' : ''}`}
                    onClick={() => { if (window.innerWidth <= 1024) closeSidebar(); }}
                  >
                    <span className="sv2-link-icon"><Icon /></span>
                    <span className="sv2-link-label">{link.label}</span>
                    {count > 0 && (
                      <span className="sv2-cart-badge">{count}</span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="sv2-footer">
          <button className="sv2-logout-btn" onClick={handleLogout}>
            <FiLogOut />
            <span>Sign out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
