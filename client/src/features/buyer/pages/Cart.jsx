import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { FiShoppingCart, FiTrash2, FiPlus, FiMinus, FiArrowRight, FiMapPin } from 'react-icons/fi';
import Button from '../../../components/common/Button.jsx';
import { useCartStore } from '../../../store/cart.store.js';
import * as ordersApi from '../../../api/orders.api.js';
import * as usersApi from '../../../api/users.api.js';
import { useAuthStore } from '../../../store/auth.store.js';

const fmt = (n) => `₹${parseFloat(n || 0).toFixed(2)}`;

const Cart = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { items, removeFromCart, updateQuantity, clearCart } = useCartStore();

  const [checkoutMode, setCheckoutMode] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);

  // Delivery address form state (pre-filled from profile)
  const [addr, setAddr] = useState({
    fullName: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    village: '',
    city: '',
    district: '',
    state: '',
    country: 'India',
    postalCode: '',
  });

  // Checkout preview per item (from server)
  const [previews, setPreviews] = useState({}); // listingId → breakdown
  const [previewLoading, setPreviewLoading] = useState(false);

  // Load profile on mount
  useEffect(() => {
    const loadProfile = async () => {
      setLoadingProfile(true);
      try {
        const res = await usersApi.getProfile();
        const p = res.data;
        setAddr({
          fullName: p.fullName || p.name || '',
          phone: p.phone || '',
          addressLine1: p.addressLine1 || '',
          addressLine2: p.addressLine2 || '',
          village: p.village || '',
          city: p.city || p.location || '',
          district: p.district || '',
          state: p.state || '',
          country: p.country || 'India',
          postalCode: p.postalCode || '',
        });
      } catch {
        // Non-fatal
      } finally {
        setLoadingProfile(false);
      }
    };
    loadProfile();
  }, []);

  // Fetch checkout preview from server for each cart item
  useEffect(() => {
    if (items.length === 0) return;
    let cancelled = false;
    const fetchPreviews = async () => {
      setPreviewLoading(true);
      const results = {};
      await Promise.allSettled(
        items.map(async (item) => {
          try {
            const res = await ordersApi.previewCheckout(item.listingId, item.quantity);
            if (!cancelled) results[item.listingId] = res.data?.breakdown;
          } catch {
            // Insufficient data fallback
          }
        })
      );
      if (!cancelled) {
        setPreviews(results);
        setPreviewLoading(false);
      }
    };
    fetchPreviews();
    return () => { cancelled = true; };
  }, [items.map((i) => `${i.listingId}:${i.quantity}`).join(',')]);

  const totalBreakdown = {
    subtotal: items.reduce((sum, item) => {
      const p = previews[item.listingId];
      return sum + (p?.subtotal ?? item.pricePerUnit * item.quantity);
    }, 0),
    discountAmount: items.reduce((sum, item) => {
      const p = previews[item.listingId];
      return sum + (p?.discountAmount ?? 0);
    }, 0),
    deliveryCharge: items.reduce((sum, item) => {
      const p = previews[item.listingId];
      return sum + (p?.deliveryCharge ?? 0);
    }, 0),
    handlingCharge: items.reduce((sum, item) => {
      const p = previews[item.listingId];
      return sum + (p?.handlingCharge ?? 0);
    }, 0),
    grandTotal: items.reduce((sum, item) => {
      const p = previews[item.listingId];
      return sum + (p?.grandTotal ?? item.pricePerUnit * item.quantity);
    }, 0),
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (!addr.fullName || !addr.phone || !addr.addressLine1) {
      toast.error('Please fill in Name, Phone, and Address Line 1.');
      return;
    }
    setSubmitting(true);
    try {
      // Place one order per cart item
      await Promise.all(
        items.map((item) =>
          ordersApi.placeOrder({
            listingId: item.listingId,
            quantity: item.quantity,
            message: `Cart order — ${item.quantity} ${item.unit || 'kg'} of ${item.productName}`,
            isCartOrder: true,
            deliveryAddress: addr,
          })
        )
      );
      clearCart();
      toast.success('🎉 Orders placed! Farmers have been notified.');
      navigate('/buyer/purchases');
    } catch (err) {
      toast.error(err.message || 'Failed to place order.');
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="fade-in">
        <div className="page-header">
          <div>
            <h1 className="page-title">My Cart</h1>
            <p className="page-subtitle">Review and checkout your selected crops</p>
          </div>
        </div>
        <div className="empty-state glass-card">
          <div className="empty-state-icon">🛒</div>
          <h3>Your cart is empty</h3>
          <p>Browse the marketplace to add crops to your cart.</p>
          <Button variant="primary" onClick={() => navigate('/marketplace')} className="mt-4">
            Browse Marketplace
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Cart</h1>
          <p className="page-subtitle">{items.length} item{items.length > 1 ? 's' : ''} in cart</p>
        </div>
        <Button variant="ghost" onClick={() => navigate('/marketplace')}>
          ← Continue Shopping
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Cart Items */}
        <div className="flex-1">
          <div className="glass-card">
            <h2 className="text-lg font-bold mb-4 border-b border-zinc-700 pb-3">Cart Items</h2>
            <div className="space-y-4">
              {items.map((item) => {
                const preview = previews[item.listingId];
                return (
                  <div
                    key={item.listingId}
                    className="flex items-center gap-4 p-3 bg-zinc-800/50 rounded-lg border border-zinc-700"
                  >
                    <span className="text-3xl">🌾</span>
                    <div className="flex-1">
                      <p className="font-bold text-white">{item.productName}</p>
                      <p className="text-sm text-gray-400">
                        Farmer: {item.farmerName}
                      </p>
                      {preview ? (
                        <div className="text-xs text-gray-400 mt-1 space-y-0.5">
                          <p className="text-green-400 font-semibold">
                            {fmt(preview.subtotal)} subtotal
                            {preview.discountAmount > 0 && (
                              <span className="ml-2 text-yellow-400">−{fmt(preview.discountAmount)} discount</span>
                            )}
                          </p>
                          <p>Delivery: {preview.deliveryCharge === 0 ? 'Free' : fmt(preview.deliveryCharge)} · Handling: {fmt(preview.handlingCharge)}</p>
                        </div>
                      ) : (
                        <p className="text-green-400 font-semibold text-sm mt-1">
                          {fmt(item.pricePerUnit)} / {item.unit || 'kg'}
                        </p>
                      )}
                    </div>

                    {/* Qty Controls */}
                    <div className="flex items-center gap-2">
                      <button
                        className="w-8 h-8 rounded-full bg-zinc-700 hover:bg-zinc-600 flex items-center justify-center transition-colors"
                        onClick={() => updateQuantity(item.listingId, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                      >
                        <FiMinus className="text-sm" />
                      </button>
                      <span className="w-14 text-center font-bold text-sm">{item.quantity} {item.unit || 'kg'}</span>
                      <button
                        className="w-8 h-8 rounded-full bg-zinc-700 hover:bg-zinc-600 flex items-center justify-center transition-colors"
                        onClick={() => updateQuantity(item.listingId, item.quantity + 1)}
                        disabled={item.quantity >= (item.availableQuantity || 9999)}
                      >
                        <FiPlus className="text-sm" />
                      </button>
                    </div>

                    <div className="text-right min-w-[80px]">
                      <p className="font-bold text-white">
                        {fmt(previews[item.listingId]?.grandTotal ?? item.pricePerUnit * item.quantity)}
                      </p>
                      <p className="text-xs text-gray-500">total</p>
                    </div>

                    <button
                      className="text-red-400 hover:text-red-300 p-1 ml-2"
                      onClick={() => removeFromCart(item.listingId)}
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:w-80">
          <div className="glass-card sticky top-6">
            <h2 className="text-lg font-bold mb-4 border-b border-zinc-700 pb-3">Order Summary</h2>

            {/* 5-line price breakdown */}
            <div className="space-y-2 mb-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Subtotal</span>
                <span>{previewLoading ? '…' : fmt(totalBreakdown.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Discount</span>
                <span className="text-yellow-400">
                  {previewLoading ? '…' : totalBreakdown.discountAmount > 0 ? `−${fmt(totalBreakdown.discountAmount)}` : '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Delivery</span>
                <span>{previewLoading ? '…' : totalBreakdown.deliveryCharge === 0 ? 'Free' : fmt(totalBreakdown.deliveryCharge)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Handling</span>
                <span>{previewLoading ? '…' : fmt(totalBreakdown.handlingCharge)}</span>
              </div>
              <div className="flex justify-between font-bold text-base border-t border-zinc-700 pt-2 mt-2">
                <span>Grand Total</span>
                <span className="text-green-400">
                  {previewLoading ? '…' : fmt(totalBreakdown.grandTotal)}
                </span>
              </div>
            </div>

            {!checkoutMode ? (
              <Button
                variant="primary"
                className="w-full"
                icon={FiArrowRight}
                onClick={() => setCheckoutMode(true)}
              >
                Proceed to Checkout
              </Button>
            ) : (
              <form onSubmit={handleCheckout} className="space-y-3">
                <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
                  <FiMapPin size={14} /> Delivery Details
                </h3>

                {[
                  { key: 'fullName', label: 'Full Name *', required: true, placeholder: 'Your full name' },
                  { key: 'phone', label: 'Phone *', required: true, placeholder: '+91 98765 43210' },
                  { key: 'addressLine1', label: 'Address Line 1 *', required: true, placeholder: 'House/Flat, Street' },
                  { key: 'addressLine2', label: 'Address Line 2', placeholder: 'Landmark (optional)' },
                  { key: 'village', label: 'Village', placeholder: 'Village name' },
                  { key: 'city', label: 'City', placeholder: 'City' },
                  { key: 'district', label: 'District', placeholder: 'District' },
                  { key: 'state', label: 'State', placeholder: 'State' },
                  { key: 'postalCode', label: 'Pincode', placeholder: '4XXXXX' },
                ].map(({ key, label, required, placeholder }) => (
                  <div key={key} className="input-group">
                    <label className="input-label">{label}</label>
                    <div className="input-field-wrapper">
                      <input
                        className="input-field"
                        value={addr[key]}
                        onChange={(e) => setAddr((prev) => ({ ...prev, [key]: e.target.value }))}
                        placeholder={placeholder}
                        required={required}
                      />
                    </div>
                  </div>
                ))}

                <Button type="submit" variant="primary" className="w-full" loading={submitting}>
                  Place Order
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => setCheckoutMode(false)}
                >
                  Back
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
