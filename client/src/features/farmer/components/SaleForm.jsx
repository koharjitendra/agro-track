import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import Modal from '../../../components/common/Modal.jsx';
import Input from '../../../components/common/Input.jsx';
import Button from '../../../components/common/Button.jsx';
import * as usersApi from '../../../api/users.api.js';
import * as transactionsApi from '../../../api/transactions.api.js';
import { formatMoney } from '../../../utils/money.js';

const SaleForm = ({ isOpen, onClose, cropCycleId, onSuccess }) => {
  const [buyers, setBuyers] = useState([]);
  const [buyerId, setBuyerId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('kg');
  const [pricePerUnit, setPricePerUnit] = useState('');
  const [amountPaid, setAmountPaid] = useState('0');
  const [transactionDate, setTransactionDate] = useState('');
  const [notes, setNotes] = useState('');
  const [loadingBuyers, setLoadingBuyers] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchBuyers = async () => {
      try {
        setLoadingBuyers(true);
        const response = await usersApi.searchUsers('BUYER');
        setBuyers(response.data || []);
        if (response.data && response.data.length > 0) {
          setBuyerId(response.data[0]._id);
        }
      } catch (error) {
        console.error(error);
        toast.error('Failed to load buyers list.');
      } finally {
        setLoadingBuyers(false);
      }
    };
    
    if (isOpen) {
      fetchBuyers();
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
    if (!buyerId) {
      toast.error('Please select a buyer.');
      return;
    }

    setSubmitting(true);
    try {
      const data = {
        buyerId,
        cropCycleId,
        quantity: parseFloat(quantity),
        unit,
        pricePerUnit: parseFloat(pricePerUnit),
        amountPaid: parseFloat(amountPaid),
        transactionDate: new Date(transactionDate).toISOString(),
        notes,
      };

      await transactionsApi.create(data);
      toast.success('Sale proposed! Pending buyer approval.');
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error(error.message || 'Failed to submit sale.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Record Sale (Proposal)">
      <form onSubmit={handleSubmit} className="modal-form">
        <div className="input-group">
          <label className="input-label" htmlFor="buyer-select">Select Buyer *</label>
          <div className="input-field-wrapper">
            <select
              id="buyer-select"
              className="input-field select-field"
              value={buyerId}
              onChange={(e) => setBuyerId(e.target.value)}
              required
              disabled={loadingBuyers}
            >
              {loadingBuyers ? (
                <option>Loading buyers...</option>
              ) : buyers.length === 0 ? (
                <option value="">No buyers found</option>
              ) : (
                buyers.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.name}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        <div className="form-grid">
          <Input
            label="Quantity *"
            type="number"
            name="quantity"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="e.g., 500"
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
            placeholder="e.g., 30"
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
            placeholder="e.g., 10000"
            min="0"
            step="0.01"
          />
          <Input
            label="Sale Date *"
            type="date"
            name="transactionDate"
            value={transactionDate}
            onChange={(e) => setTransactionDate(e.target.value)}
            required
          />
        </div>

        <Input
          label="Transaction Notes"
          name="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g., Grade-A quality wheat, moisture level 12%"
        />

        <div className="modal-actions">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={submitting}>
            Propose Sale
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default SaleForm;
