import React, { useState } from 'react';
import { FiMenu, FiBell, FiX, FiShoppingCart } from 'react-icons/fi';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store.js';
import { useUiStore } from '../../store/ui.store.js';
import { useCartStore } from '../../store/cart.store.js';
import { useNotificationStore } from '../../store/notification.store.js';

const Navbar = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { toggleSidebar, sidebarOpen } = useUiStore();
  const { cartCount } = useCartStore();
  const { unreadCount } = useNotificationStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = async () => {
    setDropdownOpen(false);
    await logout();
    navigate('/login');
  };

  const initials = user?.name?.slice(0, 2).toUpperCase() || 'U';
  const cartItems = cartCount();

  return (
    <nav className="navbar-v2">
      <div className="nv2-left">
        <button className="nv2-menu-btn" onClick={toggleSidebar} aria-label="Toggle menu">
          {sidebarOpen ? <FiX /> : <FiMenu />}
        </button>
        <Link to="/" className="nv2-brand">
          <span className="nv2-brand-icon">🌾</span>
          <span className="nv2-brand-text">Agro Track</span>
        </Link>
      </div>

      <div className="nv2-right">
        {user?.role === 'BUYER' && (
          <Link to="/buyer/cart" className="nv2-icon-btn" aria-label="Cart">
            <FiShoppingCart />
            {cartItems > 0 && <span className="nv2-badge">{cartItems > 9 ? '9+' : cartItems}</span>}
          </Link>
        )}

        <Link to="/notifications" className="nv2-icon-btn" aria-label="Notifications">
          <FiBell />
          {unreadCount > 0 && (
            <span className="nv2-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
          )}
        </Link>

        <div className="nv2-user-menu">
          <button
            className="nv2-avatar-btn"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            aria-label="Account menu"
          >
            <div className="nv2-avatar">{initials}</div>
            <div className="nv2-user-text">
              <span className="nv2-user-name">{user?.name}</span>
              <span className={`nv2-user-role nv2-role-${user?.role?.toLowerCase()}`}>{user?.role}</span>
            </div>
          </button>

          {dropdownOpen && (
            <>
              <div className="nv2-dropdown-backdrop" onClick={() => setDropdownOpen(false)} aria-hidden="true" />
              <div className="nv2-dropdown">
                <div className="nv2-dropdown-header">
                  <div className="nv2-avatar nv2-avatar-lg">{initials}</div>
                  <div>
                    <p className="nv2-dropdown-name">{user?.name}</p>
                    <p className="nv2-dropdown-email">{user?.email}</p>
                  </div>
                </div>
                <div className="nv2-dropdown-divider" />
                {user?.role === 'BUYER' && (
                  <Link
                    to="/buyer/profile"
                    className="nv2-dropdown-item"
                    onClick={() => setDropdownOpen(false)}
                    style={{ display: 'flex', textDecoration: 'none', padding: '0.7rem 1.1rem', fontSize: '0.855rem', color: 'rgba(232,245,233,0.6)' }}
                  >
                    My Profile
                  </Link>
                )}
                <button className="nv2-dropdown-item nv2-logout" onClick={handleLogout}>
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
