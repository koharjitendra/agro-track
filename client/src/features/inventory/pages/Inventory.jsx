import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2, FiAlertTriangle, FiFilter, FiPackage } from 'react-icons/fi';
import Button from '../../../components/common/Button.jsx';
import Modal from '../../../components/common/Modal.jsx';
import Input from '../../../components/common/Input.jsx';
import Loader from '../../../components/common/Loader.jsx';
import * as inventoryApi from '../../../api/inventory.api.js';
import { formatMoney } from '../../../utils/money.js';

const CATEGORIES = ['SEEDS', 'FERTILIZERS', 'PESTICIDES', 'EQUIPMENT', 'OTHER'];

const Inventory = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Filters
  const [filterCategory, setFilterCategory] = useState('');

  // Form Fields
  const [itemId, setItemId] = useState(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('SEEDS');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('kg');
  const [lowStockThreshold, setLowStockThreshold] = useState('5');
  const [pricePerUnit, setPricePerUnit] = useState('0');
  const [notes, setNotes] = useState('');

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const res = await inventoryApi.getAll();
      setItems(res.data || []);
    } catch (err) {
      toast.error('Failed to load inventory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleOpenAddModal = () => {
    setItemId(null);
    setName('');
    setCategory('SEEDS');
    setQuantity('');
    setUnit('kg');
    setLowStockThreshold('5');
    setPricePerUnit('0');
    setNotes('');
    setModalOpen(true);
  };

  const handleOpenEditModal = (item) => {
    setItemId(item._id);
    setName(item.name);
    setCategory(item.category);
    setQuantity(item.quantity.toString());
    setUnit(item.unit);
    setLowStockThreshold(item.lowStockThreshold.toString());
    setPricePerUnit(item.pricePerUnit.toString());
    setNotes(item.notes || '');
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const data = {
        name,
        category,
        quantity: parseFloat(quantity),
        unit,
        lowStockThreshold: parseFloat(lowStockThreshold),
        pricePerUnit: parseFloat(pricePerUnit),
        notes
      };

      if (itemId) {
        await inventoryApi.update(itemId, data);
        toast.success('Inventory item updated!');
      } else {
        await inventoryApi.create(data);
        toast.success('Inventory item added!');
      }
      setModalOpen(false);
      fetchInventory();
    } catch (err) {
      toast.error(err.message || 'Action failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this inventory item?')) {
      try {
        await inventoryApi.remove(id);
        toast.success('Item deleted.');
        fetchInventory();
      } catch (err) {
        toast.error('Failed to delete item.');
      }
    }
  };

  const filteredItems = filterCategory
    ? items.filter((item) => item.category === filterCategory)
    : items;

  if (loading) return <Loader fullPage />;

  return (
    <div className="inventory-page fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Inventory Management</h1>
          <p className="page-subtitle">Track seeds, fertilizers, chemical sprays, and farm equipment stocks</p>
        </div>
        <Button variant="primary" icon={FiPlus} onClick={handleOpenAddModal}>
          Add Supply Item
        </Button>
      </div>

      <div className="glass-card mb-6 p-4 flex gap-4 items-center flex-wrap">
        <FiFilter className="text-gray-400 text-lg" />
        <span className="text-sm font-semibold text-gray-400">Filter Category:</span>
        <select
          className="input-field select-field py-1 px-3 text-sm rounded bg-zinc-800"
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          style={{ width: '200px' }}
        >
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {filteredItems.length === 0 ? (
        <div className="empty-state glass-card py-16 text-center">
          <FiPackage className="mx-auto text-5xl text-gray-500 mb-3" />
          <h3>No inventory items</h3>
          <p>Click "Add Supply Item" to log seed stocks or fertilizer supplies.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Item Name</th>
                <th>Category</th>
                <th>In Stock</th>
                <th>Unit Price</th>
                <th>Status</th>
                <th>Notes</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => {
                const isLowStock = item.quantity <= item.lowStockThreshold;
                return (
                  <tr key={item._id} className="hover:bg-zinc-800/10">
                    <td className="font-bold text-gray-100">{item.name}</td>
                    <td>
                      <span className={`badge badge-info uppercase`}>{item.category}</span>
                    </td>
                    <td>{item.quantity} {item.unit}</td>
                    <td>{formatMoney(item.pricePerUnit)}</td>
                    <td>
                      {isLowStock ? (
                        <span className="flex items-center gap-1 text-red-400 font-bold text-sm bg-red-500/10 py-1 px-2.5 rounded border border-red-500/20 w-fit">
                          <FiAlertTriangle /> Low Stock
                        </span>
                      ) : (
                        <span className="text-green-400 font-bold text-sm bg-green-500/10 py-1 px-2.5 rounded border border-green-500/20 w-fit">
                          In Stock
                        </span>
                      )}
                    </td>
                    <td className="text-gray-400 text-sm italic">{item.notes || '-'}</td>
                    <td className="text-right">
                      <div className="flex justify-end gap-2">
                        <button className="btn btn-ghost btn-sm text-green-400 hover:bg-green-500/10 p-1" onClick={() => handleOpenEditModal(item)}>
                          <FiEdit2 size={16} />
                        </button>
                        <button className="btn btn-ghost btn-sm text-coral hover:bg-coral/10 p-1" onClick={() => handleDelete(item._id)}>
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={itemId ? 'Edit Supply Item' : 'Add Supply Item'}>
        <form onSubmit={handleSubmit} className="modal-form">
          <Input
            label="Item Name *"
            placeholder="e.g. Urea fertilizer, Shriram 303 seeds, Tractor Disc"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <div className="input-group">
            <label className="input-label">Category *</label>
            <select
              className="input-field select-field"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                label="Quantity In Stock *"
                type="number"
                name="quantity"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
                min="0"
                step="0.01"
              />
            </div>
            <div className="flex-1">
              <Input
                label="Unit *"
                placeholder="e.g. kg, bags, liters, units"
                name="unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                label="Low Stock Alert Threshold"
                type="number"
                name="lowStockThreshold"
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(e.target.value)}
                min="0"
                step="0.1"
              />
            </div>
            <div className="flex-1">
              <Input
                label="Price Per Unit (₹)"
                type="number"
                name="pricePerUnit"
                value={pricePerUnit}
                onChange={(e) => setPricePerUnit(e.target.value)}
                min="0"
                step="0.1"
              />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Notes (Optional)</label>
            <textarea
              className="input-field min-h-[80px]"
              placeholder="Purchased from Krishna Agro Center. Kept in Storehouse A."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="modal-actions">
            <Button variant="ghost" type="button" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit" loading={submitting}>Save Item</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Inventory;
