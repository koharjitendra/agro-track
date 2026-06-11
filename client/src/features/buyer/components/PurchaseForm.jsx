import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import Modal from '../../../components/common/Modal.jsx';
import Input from '../../../components/common/Input.jsx';
import Button from '../../../components/common/Button.jsx';
import * as usersApi from '../../../api/users.api.js';
import * as transactionsApi from '../../../api/transactions.api.js';
import { formatMoney } from '../../../utils/money.js';

const PurchaseForm = ({ isOpen, onClose, onSuccess }) => {
  const [farmers, setFarmers] = useState([]);
  const [farmerId, setFarmerId] = useState('');
  const [cropName, setCropName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('kg');
  const [pricePerUnit, setPricePerUnit] = useState('');
  const [amountPaid, setAmountPaid] = useState('0');
  const [transactionDate, setTransactionDate] = useState('');
  const [notes, setNotes] = useState('');
  const [loadingFarmers, setLoadingFarmers] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchFarmers = async () => {
      try {
        setLoadingFarmers(true);
        const response = await usersApi.searchUsers('FARMER');
        setFarmers(response.data || []);
        if (response.data && response.data.length > 0) {
          setFarmerId(response.data[0]._id);
        }
      } catch (error) {
        console.error(error);
        toast.error('Failed to load farmers list.');
      } finally {
        setLoadingFarmers(false);
      }
    };
    
    if (isOpen) {
      fetchFarmers();
      setCropName('');
      setQuantity('');
      setPricePerUnit('');
      setAmountPaid('0');
      setTransactionDate(new Date().toISOString().split('T')[0]);
      setNotes('');
    }
  }, [isOpen]);

  const totalAmount = (parseFloat(quantity) || 0) * (parseFloat(pricePerUnit) || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!farmerId) {
      toast.error('Please select a farmer.');
      return;
    }

    setSubmitting(true);
    try {
      const data = {
        farmerId,
        cropCycleId: null,
        quantity: parseFloat(quantity),
        unit,
        pricePerUnit: parseFloat(pricePerUnit),
        amountPaid: parseFloat(amountPaid),
        transactionDate: new Date(transactionDate).toISOString(),
        notes: `Crop: ${cropName}. ${notes}`.trim(),
      };

      await transactionsApi.create(data);
      toast.success('Purchase proposed! Pending farmer approval.');
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error(error.message || 'Failed to submit purchase.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Propose Purchase (New Transaction)">
      <form onSubmit={handleSubmit} className="modal-form">
        <div className="input-group">
          <label className="input-label" htmlFor="farmer-select">Select Farmer *</label>
          <div className="input-field-wrapper">
            <select
              id="farmer-select"
              className="input-field select-field"
              value={farmerId}
              onChange={(e) => setFarmerId(e.target.value)}
              required
              disabled={loadingFarmers}
            >
              {loadingFarmers ? (
                <option>Loading farmers...</option>
              ) : farmers.length === 0 ? (
                <option value="">No farmers found</option>
              ) : (
                farmers.map((f) => (
                  <option key={f._id} value={f._id}>
                    {f.name}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        <Input
          label="Crop Name *"
          name="cropName"
          value={cropName}
          onChange={(e) => setCropName(e.target.value)}
          placeholder="e.g., Wheat, Basmati Rice..."
          required
        />

        <div className="form-grid">
          <Input
            label="Quantity *"
            type="number"
            name="quantity"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="e.g., 1000"
            required
            min="0.1"
            step="0.1"
          />
          <Input
            label="Unit *"
            name="unit"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            placeholder="e.g., kg, quintal, bag"
            required
          />
        </div>

        <div className="form-grid">
          <Input
            label="Price Per Unit (₹) *"
            type="number"
            name="pricePerUnit"
            value={pricePerUnit}
            onChange={(e) => setPricePerUnit(e.target.value)}
            placeholder="e.g., 25"
            required
            min="0.01"
            step="0.01"
          />
          <div className="input-group">
            <label className="input-label">Proposed Total Value</label>
            <div className="input-field-wrapper">
              <input
                type="text"
                className="input-field cursor-not-allowed text-bold text-green-bright"
                value={formatMoney(totalAmount)}
                disabled
              />
            </div>
          </div>
        </div>

        <div className="form-grid">
          <Input
            label="Amount Paid Upfront (₹)"
            type="number"
            name="amountPaid"
            value={amountPaid}
            onChange={(e) => setAmountPaid(e.target.value)}
            placeholder="e.g., 5000"
            min="0"
            step="0.01"
          />
          <Input
            label="Purchase Date *"
            type="date"
            name="transactionDate"
            value={transactionDate}
            onChange={(e) => setTransactionDate(e.target.value)}
            required
          />
        </div>

        <Input
          label="Purchase Notes"
          name="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g., Standard grade harvest, immediate loading"
        />

        <div className="modal-actions">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={submitting}>
            Propose Purchase
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default PurchaseForm;
