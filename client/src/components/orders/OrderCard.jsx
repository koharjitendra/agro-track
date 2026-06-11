import React from 'react';
import {
  FiClock, FiCheckCircle, FiTruck, FiPackage, FiXCircle, FiSlash, FiMapPin, FiPhone, FiUser
} from 'react-icons/fi';

export const STATUS_CONFIG = {
  PENDING: {
    label: 'Pending',
    color: '#F59E0B',
    bg: 'rgba(245,158,11,0.12)',
    border: 'rgba(245,158,11,0.35)',
    icon: FiClock,
    description: 'Awaiting farmer response',
    step: 0,
  },
  ACCEPTED: {
    label: 'Accepted',
    color: '#3B82F6',
    bg: 'rgba(59,130,246,0.12)',
    border: 'rgba(59,130,246,0.35)',
    icon: FiCheckCircle,
    description: 'Farmer accepted your order',
    step: 1,
  },
  OUT_FOR_DELIVERY: {
    label: 'Out for Delivery',
    color: '#8B5CF6',
    bg: 'rgba(139,92,246,0.12)',
    border: 'rgba(139,92,246,0.35)',
    icon: FiTruck,
    description: 'On its way to you',
    step: 2,
  },
  DELIVERED: {
    label: 'Delivered',
    color: '#22C55E',
    bg: 'rgba(34,197,94,0.12)',
    border: 'rgba(34,197,94,0.35)',
    icon: FiPackage,
    description: 'Delivery verified',
    step: 3,
  },
  COMPLETED: {
    label: 'Completed',
    color: '#15803D',
    bg: 'rgba(21,128,61,0.12)',
    border: 'rgba(21,128,61,0.35)',
    icon: FiCheckCircle,
    description: 'Order complete',
    step: 4,
  },
  REJECTED: {
    label: 'Rejected',
    color: '#EF4444',
    bg: 'rgba(239,68,68,0.12)',
    border: 'rgba(239,68,68,0.35)',
    icon: FiXCircle,
    description: 'Farmer declined',
    step: -1,
  },
  CANCELLED: {
    label: 'Cancelled',
    color: '#6B7280',
    bg: 'rgba(107,114,128,0.12)',
    border: 'rgba(107,114,128,0.35)',
    icon: FiSlash,
    description: 'Order cancelled',
    step: -1,
  },
};

const STEPS = ['Pending', 'Accepted', 'Out for Delivery', 'Delivered', 'Completed'];
const STEP_KEYS = ['PENDING', 'ACCEPTED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED'];

const ProgressTracker = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
  const currentStep = cfg.step;
  const isTerminal = currentStep === -1;

  if (isTerminal) {
    return (
      <div className="order-progress-terminal">
        <span style={{ color: cfg.color, fontSize: 13, fontWeight: 600 }}>
          {cfg.icon && React.createElement(cfg.icon, { size: 14, style: { marginRight: 4, verticalAlign: 'middle' } })}
          {status === 'REJECTED' ? '✗ Order Rejected' : '⊘ Order Cancelled'}
        </span>
      </div>
    );
  }

  return (
    <div className="order-progress-track">
      {STEPS.map((label, idx) => {
        const done = idx < currentStep;
        const active = idx === currentStep;
        return (
          <React.Fragment key={idx}>
            <div className={`order-step ${done ? 'done' : active ? 'active' : 'upcoming'}`}>
              <div className="order-step-dot">
                {done ? '✓' : idx + 1}
              </div>
              <span className="order-step-label">{label}</span>
            </div>
            {idx < STEPS.length - 1 && (
              <div className={`order-step-line ${done ? 'done' : ''}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

const fmt = (n) => {
  if (n === null || n === undefined) return '—';
  return `₹${parseFloat(n).toFixed(2)}`;
};

const fmtDate = (d) => {
  if (!d) return null;
  return new Date(d).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

const shortId = (id) => id ? id.toString().slice(-8).toUpperCase() : '—';

export const OrderCard = ({ order, role, onAction, deliveryCode }) => {
  const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING;
  const StatusIcon = cfg.icon;

  return (
    <div className="order-card glass-card" style={{ borderLeft: `3px solid ${cfg.color}` }}>
      {/* Header */}
      <div className="order-card-header">
        <div className="order-id-badge">
          <span className="order-id-label">Order</span>
          <span className="order-id-value">#{shortId(order._id)}</span>
        </div>
        <span
          className="order-status-badge"
          style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}` }}
        >
          <StatusIcon size={13} />
          {cfg.label}
        </span>
      </div>

      {/* Progress tracker */}
      <ProgressTracker status={order.status} />

      {/* Product info */}
      <div className="order-card-body">
        <div className="order-product-row">
          <div className="order-product-avatar">
            {(order.productName || 'P').charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="order-product-name">{order.productName || 'Unknown Product'}</p>
            <p className="order-product-meta">
              {order.quantity} {order.unit || 'kg'}
              {role === 'BUYER' && order.farmerId?.name && ` · Farmer: ${order.farmerId.name}`}
              {role === 'FARMER' && order.buyerId?.name && ` · Buyer: ${order.buyerId.name}`}
            </p>
          </div>
        </div>

        {/* Price breakdown */}
        <div className="order-price-breakdown">
          <div className="order-price-row">
            <span>Subtotal</span>
            <span>{fmt(order.subtotal)}</span>
          </div>
          {order.discountAmount > 0 && (
            <div className="order-price-row discount">
              <span>Discount</span>
              <span>−{fmt(order.discountAmount)}</span>
            </div>
          )}
          <div className="order-price-row">
            <span>Delivery</span>
            <span>{order.deliveryCharge === 0 ? 'Free' : fmt(order.deliveryCharge)}</span>
          </div>
          <div className="order-price-row">
            <span>Handling</span>
            <span>{fmt(order.handlingCharge)}</span>
          </div>
          <div className="order-price-row order-price-total">
            <span>Grand Total</span>
            <span>{fmt(order.grandTotal)}</span>
          </div>
        </div>

        {/* Delivery code (buyer only) */}
        {role === 'BUYER' && deliveryCode && (
          <div className="order-delivery-code">
            <span className="order-delivery-code-label">🔑 Your Delivery Code</span>
            <div className="order-delivery-code-value">{deliveryCode}</div>
            <p className="order-delivery-code-hint">Show this code to the farmer when your order arrives</p>
          </div>
        )}

        {/* Rejection reason */}
        {order.status === 'REJECTED' && order.rejectionReason && (
          <div className="order-rejection-reason">
            <span className="rejection-label">Reason:</span> {order.rejectionReason}
          </div>
        )}

        {/* Delivery address */}
        {(order.deliveryCity || order.deliveryAddress) && (
          <div className="order-address-section">
            <div className="order-address-icon"><FiMapPin size={13} /></div>
            <div>
              {order.deliveryName && (
                <span className="order-address-name">
                  <FiUser size={11} style={{ marginRight: 3 }} />{order.deliveryName}
                </span>
              )}
              {order.deliveryPhone && (
                <span className="order-address-phone">
                  <FiPhone size={11} style={{ marginRight: 3 }} />{order.deliveryPhone}
                </span>
              )}
              <p className="order-address-text">
                {[order.deliveryAddress, order.deliveryVillage, order.deliveryCity,
                  order.deliveryDistrict, order.deliveryState, order.deliveryPostalCode]
                  .filter(Boolean).join(', ')}
              </p>
            </div>
          </div>
        )}

        {/* Timestamps */}
        <div className="order-timestamps">
          {fmtDate(order.createdAt) && (
            <span>📅 Placed: {fmtDate(order.createdAt)}</span>
          )}
          {order.acceptedAt && (
            <span>✅ Accepted: {fmtDate(order.acceptedAt)}</span>
          )}
          {order.outForDeliveryAt && (
            <span>🚚 Dispatched: {fmtDate(order.outForDeliveryAt)}</span>
          )}
          {order.completedAt && (
            <span>🎉 Completed: {fmtDate(order.completedAt)}</span>
          )}
        </div>

        {/* Farmer action buttons */}
        {role === 'FARMER' && onAction && (
          <div className="order-actions">
            {order.status === 'PENDING' && (
              <>
                <button
                  className="btn btn-sm btn-success"
                  onClick={() => onAction('accept', order._id)}
                >
                  ✓ Accept
                </button>
                <button
                  className="btn btn-sm btn-danger"
                  onClick={() => onAction('reject', order._id)}
                >
                  ✗ Reject
                </button>
              </>
            )}
            {order.status === 'ACCEPTED' && (
              <button
                className="btn btn-sm btn-purple"
                onClick={() => onAction('out_for_delivery', order._id)}
              >
                🚚 Mark Out for Delivery
              </button>
            )}
            {order.status === 'OUT_FOR_DELIVERY' && (
              <button
                className="btn btn-sm btn-primary"
                onClick={() => onAction('verify_code', order._id)}
              >
                🔑 Verify Delivery Code
              </button>
            )}
          </div>
        )}

        {/* Buyer cancel */}
        {role === 'BUYER' && order.status === 'PENDING' && onAction && (
          <div className="order-actions">
            <button
              className="btn btn-sm btn-ghost"
              onClick={() => onAction('cancel', order._id)}
            >
              Cancel Order
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderCard;
