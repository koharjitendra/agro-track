import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { FiUser, FiPhone, FiMapPin, FiMail, FiSave, FiHome } from 'react-icons/fi';
import Loader from '../../../components/common/Loader.jsx';
import Button from '../../../components/common/Button.jsx';
import * as usersApi from '../../../api/users.api.js';
import { useAuthStore } from '../../../store/auth.store.js';

const BuyerProfile = () => {
  const { updateUser, user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    // Delivery address
    fullName: '',
    addressLine1: '',
    addressLine2: '',
    village: '',
    city: '',
    district: '',
    state: '',
    country: 'India',
    postalCode: '',
    // Coordinates
    location: '',
    latitude: '',
    longitude: '',
  });

  useEffect(() => {
    const load = async () => {
      try {
        const res = await usersApi.getProfile();
        const p = res.data;
        setForm({
          name: p.name || '',
          email: p.email || '',
          phone: p.phone || '',
          fullName: p.fullName || p.name || '',
          addressLine1: p.addressLine1 || '',
          addressLine2: p.addressLine2 || '',
          village: p.village || '',
          city: p.city || p.location || '',
          district: p.district || '',
          state: p.state || '',
          country: p.country || 'India',
          postalCode: p.postalCode || '',
          location: p.location || '',
          latitude: p.latitude ?? '',
          longitude: p.longitude ?? '',
        });
      } catch {
        toast.error('Failed to load profile.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const set = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { email, ...updatable } = form;
      
      // Parse coordinates as numbers
      if (updatable.latitude !== '') {
        updatable.latitude = parseFloat(updatable.latitude);
        if (isNaN(updatable.latitude)) updatable.latitude = null;
      } else {
        updatable.latitude = null;
      }

      if (updatable.longitude !== '') {
        updatable.longitude = parseFloat(updatable.longitude);
        if (isNaN(updatable.longitude)) updatable.longitude = null;
      } else {
        updatable.longitude = null;
      }

      const res = await usersApi.updateProfile(updatable);
      if (updateUser) updateUser(res.data);
      toast.success('Profile updated!');
    } catch {
      toast.error('Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader fullPage />;

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Profile</h1>
          <p className="page-subtitle">Manage your account and delivery address</p>
        </div>
      </div>

      <div className="max-w-2xl">
        <form onSubmit={handleSave} className="space-y-6">
          {/* Account Info */}
          <div className="glass-card">
            <div className="flex items-center gap-4 mb-6 pb-4 border-b border-zinc-700">
              <div className="avatar" style={{ width: 64, height: 64, fontSize: '1.75rem', background: 'linear-gradient(135deg, #52B788, #95D5B2)' }}>
                {form.name?.charAt(0)?.toUpperCase()}
              </div>
              <div>
                <p className="text-xl font-bold">{form.name}</p>
                <span className={`badge ${user?.role === 'FARMER' ? 'badge-active' : 'badge-buyer'}`}>
                  {user?.role}
                </span>
              </div>
            </div>

            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <FiUser size={14} /> Account Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { key: 'name', label: 'Full Name *', icon: FiUser, required: true, placeholder: 'Your name' },
                { key: 'phone', label: 'Phone Number', icon: FiPhone, placeholder: '+91 98765 43210' },
              ].map(({ key, label, icon: Icon, required, placeholder }) => (
                <div key={key} className="input-group">
                  <label className="input-label flex items-center gap-1"><Icon size={13} className="text-gray-400" /> {label}</label>
                  <div className="input-field-wrapper">
                    <input
                      className="input-field"
                      value={form[key]}
                      onChange={(e) => set(key, e.target.value)}
                      placeholder={placeholder}
                      required={required}
                    />
                  </div>
                </div>
              ))}
              <div className="input-group md:col-span-2">
                <label className="input-label flex items-center gap-1"><FiMail size={13} className="text-gray-400" /> Email</label>
                <div className="input-field-wrapper">
                  <input className="input-field" value={form.email} disabled style={{ opacity: 0.5, cursor: 'not-allowed' }} />
                </div>
                <p className="text-xs text-gray-500 mt-1">Email cannot be changed.</p>
              </div>
            </div>
          </div>

          {/* Delivery Address */}
          <div className="glass-card">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <FiMapPin size={14} /> Default Delivery Address
            </h3>
            <p className="text-xs text-gray-500 mb-4">This is auto-filled during checkout. Each order takes a permanent snapshot of the address at time of placement.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { key: 'fullName', label: 'Delivery Name', placeholder: 'Name for delivery' },
                { key: 'phone', label: 'Contact Phone', placeholder: '+91 98765 43210' },
                { key: 'addressLine1', label: 'Address Line 1', placeholder: 'House/Flat/Street', full: true },
                { key: 'addressLine2', label: 'Address Line 2', placeholder: 'Landmark (optional)', full: true },
                { key: 'village', label: 'Village / Area', placeholder: 'Village name' },
                { key: 'city', label: 'City', placeholder: 'City' },
                { key: 'district', label: 'District', placeholder: 'District' },
                { key: 'state', label: 'State', placeholder: 'State' },
                { key: 'country', label: 'Country', placeholder: 'India' },
                { key: 'postalCode', label: 'Pincode', placeholder: '4XXXXX' },
              ].map(({ key, label, placeholder, full }) => (
                <div key={key} className={`input-group ${full ? 'md:col-span-2' : ''}`}>
                  <label className="input-label">{label}</label>
                  <div className="input-field-wrapper">
                    <input
                      className="input-field"
                      value={form[key]}
                      onChange={(e) => set(key, e.target.value)}
                      placeholder={placeholder}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Farm Location Details (Farmers Only) */}
          {user?.role === 'FARMER' && (
            <div className="glass-card">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <FiMapPin size={14} /> Farm Location & Coordinates
              </h3>
              <p className="text-xs text-gray-500 mb-4">
                These coordinates are used to fetch real-time weather forecasts and agronomy recommendations for your dashboard.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="input-group md:col-span-3">
                  <label className="input-label">Profile Location (Prefilled on listings)</label>
                  <div className="input-field-wrapper">
                    <input
                      className="input-field"
                      value={form.location}
                      onChange={(e) => set('location', e.target.value)}
                      placeholder="e.g. Pune, Maharashtra"
                    />
                  </div>
                </div>
                <div className="input-group">
                  <label className="input-label">Latitude</label>
                  <div className="input-field-wrapper">
                    <input
                      className="input-field"
                      type="number"
                      step="any"
                      value={form.latitude}
                      onChange={(e) => set('latitude', e.target.value)}
                      placeholder="e.g. 18.5204"
                    />
                  </div>
                </div>
                <div className="input-group">
                  <label className="input-label">Longitude</label>
                  <div className="input-field-wrapper">
                    <input
                      className="input-field"
                      type="number"
                      step="any"
                      value={form.longitude}
                      onChange={(e) => set('longitude', e.target.value)}
                      placeholder="e.g. 73.8567"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          <Button type="submit" variant="primary" icon={FiSave} loading={saving} className="w-full">
            Save Changes
          </Button>
        </form>
      </div>
    </div>
  );
};

export default BuyerProfile;
