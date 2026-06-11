import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import {
  FiPlus, FiEdit2, FiTrash2, FiToggleLeft, FiToggleRight, FiPackage
} from 'react-icons/fi';
import Loader from '../../../components/common/Loader.jsx';
import Button from '../../../components/common/Button.jsx';
import Input from '../../../components/common/Input.jsx';
import Modal from '../../../components/common/Modal.jsx';
import * as listingsApi from '../../../api/listings.api.js';
import { formatMoney } from '../../../utils/money.js';
import { useAuthStore } from '../../../store/auth.store.js';

const CATEGORIES = [
  'Grains', 'Vegetables', 'Fruits', 'Pulses', 'Oilseeds',
  'Spices', 'Dairy', 'Poultry', 'Fodder', 'Other',
];

const UNITS = ['kg', 'quintal', 'ton', 'bag', 'litre', 'dozen', 'piece'];

const emptyForm = {
  productName: '',
  description: '',
  category: '',
  quantity: '',
  unit: 'kg',
  price: '',
  images: '',
  location: '',
  availability: true,
  status: 'DRAFT',
};

const FarmerListings = () => {
  const { user } = useAuthStore();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('ALL'); // ALL | ACTIVE | DRAFT | PAUSED

  const fetchListings = async () => {
    try {
      setLoading(true);
      const res = await listingsApi.getAll();
      setListings(res.data || []);
    } catch {
      toast.error('Failed to load listings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  const handleOpenCreate = () => {
    setEditingId(null);
    setForm({
      ...emptyForm,
      location: user?.location || '',
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (listing) => {
    setEditingId(listing._id);
    setForm({
      productName: listing.productName || '',
      description: listing.description || '',
      category: listing.category || '',
      quantity: listing.quantity ?? '',
      unit: listing.unit || 'kg',
      price: listing.price ?? '',
      images: (listing.images || []).join(', '),
      location: listing.location || '',
      availability: listing.availability !== false,
      status: listing.status || 'DRAFT',
    });
    setModalOpen(true);
  };

  const handleFormChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.productName.trim()) {
      toast.error('Product name is required.');
      return;
    }
    if (parseFloat(form.price) <= 0 || isNaN(parseFloat(form.price))) {
      toast.error('A valid price is required.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        productName: form.productName.trim(),
        description: form.description.trim(),
        category: form.category,
        quantity: parseFloat(form.quantity) || 0,
        unit: form.unit || 'kg',
        price: parseFloat(form.price) || 0,
        images: form.images
          ? form.images.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
        location: form.location.trim(),
        availability: form.availability,
        status: form.status,
      };

      if (editingId) {
        await listingsApi.update(editingId, payload);
        toast.success('Listing updated!');
      } else {
        await listingsApi.create(payload);
        toast.success('Listing created!');
      }
      setModalOpen(false);
      fetchListings();
    } catch (err) {
      toast.error(err.message || 'Failed to save listing.');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async (id) => {
    try {
      await listingsApi.publish(id);
      toast.success('Listing published to marketplace!');
      fetchListings();
    } catch (err) {
      toast.error(err.message || 'Failed to publish listing.');
    }
  };

  const handleUnpublish = async (id) => {
    try {
      await listingsApi.unpublish(id);
      toast.success('Listing paused from marketplace.');
      fetchListings();
    } catch (err) {
      toast.error(err.message || 'Failed to pause listing.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this listing? This cannot be undone.')) return;
    try {
      await listingsApi.remove(id);
      toast.success('Listing deleted.');
      fetchListings();
    } catch (err) {
      toast.error(err.message || 'Failed to delete listing.');
    }
  };

  if (loading) return <Loader fullPage />;

  const filtered = activeTab === 'ALL'
    ? listings
    : listings.filter((l) => l.status === activeTab);

  const activeCount = listings.filter((l) => l.status === 'ACTIVE').length;

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Listings</h1>
          <p className="page-subtitle">
            {activeCount} active listing{activeCount !== 1 ? 's' : ''} on marketplace
          </p>
        </div>
        <Button variant="primary" icon={FiPlus} onClick={handleOpenCreate}>
          New Listing
        </Button>
      </div>

      {/* Status Tabs */}
      <div className="tabs-header glass-card" style={{ marginBottom: '24px' }}>
        <div className="tabs">
          {['ALL', 'ACTIVE', 'DRAFT', 'PAUSED', 'SOLD_OUT'].map((tab) => (
            <button
              key={tab}
              className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'ALL' ? 'All' : tab.replace('_', ' ')}
              {tab !== 'ALL' && (
                <span className="ml-1 text-xs opacity-60">
                  ({listings.filter((l) => l.status === tab).length})
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state glass-card">
          <div className="empty-state-icon"><FiPackage size={40} /></div>
          <h3>{activeTab === 'ALL' ? 'No Listings Yet' : `No ${activeTab} Listings`}</h3>
          <p>
            {activeTab === 'ALL'
              ? 'Create a listing to start selling your products on the marketplace.'
              : `You have no listings with status "${activeTab}".`}
          </p>
          {activeTab === 'ALL' && (
            <Button variant="primary" onClick={handleOpenCreate} className="mt-4">
              Create First Listing
            </Button>
          )}
        </div>
      ) : (
        <div className="glass-card p-0 overflow-hidden">
          <table className="table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Quantity</th>
                <th>Location</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((listing) => (
                <tr key={listing._id}>
                  <td>
                    <div>
                      <p className="font-bold text-white">{listing.productName}</p>
                      {listing.description && (
                        <p className="text-xs text-gray-400 max-w-[200px] truncate">
                          {listing.description}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="text-gray-300">{listing.category || '—'}</td>
                  <td className="text-green-400 font-bold">
                    {formatMoney(listing.price)} / {listing.unit}
                  </td>
                  <td>{listing.quantity} {listing.unit}</td>
                  <td className="text-gray-400">{listing.location || '—'}</td>
                  <td>
                    <span
                      className={`badge ${
                        listing.status === 'ACTIVE'
                          ? 'badge-active'
                          : listing.status === 'DRAFT'
                          ? 'badge-pending'
                          : listing.status === 'PAUSED'
                          ? 'badge-changes-requested'
                          : 'badge-rejected'
                      }`}
                    >
                      {listing.status}
                    </span>
                  </td>
                  <td>
                    <div className="flex gap-1 flex-wrap">
                      {listing.status === 'ACTIVE' ? (
                        <button
                          className="btn btn-ghost btn-sm text-amber-400 flex items-center gap-1"
                          onClick={() => handleUnpublish(listing._id)}
                          title="Pause listing"
                        >
                          <FiToggleRight className="text-green-400" /> Pause
                        </button>
                      ) : (
                        <button
                          className="btn btn-ghost btn-sm text-green-400 flex items-center gap-1"
                          onClick={() => handlePublish(listing._id)}
                          title="Publish to marketplace"
                        >
                          <FiToggleLeft /> Publish
                        </button>
                      )}
                      <button
                        className="btn btn-ghost btn-sm flex items-center gap-1"
                        onClick={() => handleOpenEdit(listing)}
                        title="Edit listing"
                      >
                        <FiEdit2 /> Edit
                      </button>
                      <button
                        className="btn btn-ghost btn-sm text-red-400 flex items-center gap-1"
                        onClick={() => handleDelete(listing._id)}
                        title="Delete listing"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Edit Listing' : 'Create New Listing'}
      >
        <form onSubmit={handleSubmit} className="modal-form">
          <Input
            label="Product Name *"
            value={form.productName}
            onChange={(e) => handleFormChange('productName', e.target.value)}
            placeholder="e.g. Organic Wheat, Fresh Tomatoes..."
            required
          />

          <div className="flex gap-4">
            <div className="flex-1 input-group">
              <label className="input-label">Category</label>
              <div className="input-field-wrapper">
                <select
                  className="input-field select-field"
                  value={form.category}
                  onChange={(e) => handleFormChange('category', e.target.value)}
                >
                  <option value="">Select Category</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex-1">
              <Input
                label="Location"
                value={form.location}
                onChange={(e) => handleFormChange('location', e.target.value)}
                placeholder="e.g. Pune, Maharashtra"
              />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Description</label>
            <div className="input-field-wrapper">
              <textarea
                className="input-field min-h-[80px] resize-y"
                value={form.description}
                onChange={(e) => handleFormChange('description', e.target.value)}
                placeholder="Describe your product — quality, grade, harvest date, etc."
                maxLength={1000}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">{form.description.length}/1000</p>
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                label="Quantity *"
                type="number"
                value={form.quantity}
                onChange={(e) => handleFormChange('quantity', e.target.value)}
                placeholder="e.g. 500"
                min="0"
                step="0.1"
                required
              />
            </div>
            <div className="flex-1 input-group">
              <label className="input-label">Unit</label>
              <div className="input-field-wrapper">
                <select
                  className="input-field select-field"
                  value={form.unit}
                  onChange={(e) => handleFormChange('unit', e.target.value)}
                >
                  {UNITS.map((u) => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex-1">
              <Input
                label="Price (₹) *"
                type="number"
                value={form.price}
                onChange={(e) => handleFormChange('price', e.target.value)}
                placeholder="per unit"
                min="0"
                step="0.01"
                required
              />
            </div>
          </div>

          <Input
            label="Image URLs (comma-separated)"
            value={form.images}
            onChange={(e) => handleFormChange('images', e.target.value)}
            placeholder="https://example.com/img1.jpg, https://..."
          />

          <div className="flex gap-4 items-center">
            <div className="flex-1 input-group">
              <label className="input-label">Listing Status</label>
              <div className="input-field-wrapper">
                <select
                  className="input-field select-field"
                  value={form.status}
                  onChange={(e) => handleFormChange('status', e.target.value)}
                >
                  <option value="DRAFT">Draft (not visible)</option>
                  <option value="ACTIVE">Active (on marketplace)</option>
                  <option value="PAUSED">Paused</option>
                  <option value="SOLD_OUT">Sold Out</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4">
              <input
                type="checkbox"
                id="availability"
                checked={form.availability}
                onChange={(e) => handleFormChange('availability', e.target.checked)}
                className="w-4 h-4"
              />
              <label htmlFor="availability" className="text-sm text-gray-300">Available</label>
            </div>
          </div>

          <div className="modal-actions">
            <Button variant="ghost" type="button" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={saving}>
              {editingId ? 'Save Changes' : 'Create Listing'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default FarmerListings;
