import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import Modal from '../../../components/common/Modal.jsx';
import Input from '../../../components/common/Input.jsx';
import Button from '../../../components/common/Button.jsx';
import * as expensesApi from '../../../api/expenses.api.js';

const CATEGORIES = [
  { value: 'Seeds', label: 'Seeds' },
  { value: 'Fertilizers', label: 'Fertilizers' },
  { value: 'Pesticides', label: 'Pesticides' },
  { value: 'Labor', label: 'Labor' },
  { value: 'Fuel', label: 'Fuel' },
  { value: 'Machinery', label: 'Machinery' },
  { value: 'Transportation', label: 'Transportation' },
  { value: 'Water', label: 'Water' },
  { value: 'Electricity', label: 'Electricity' },
  { value: 'Other', label: 'Other' },
];

const ExpenseForm = ({ isOpen, onClose, cropCycleId, expense, onSuccess }) => {
  const [category, setCategory] = useState('Seeds');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('');
  const [vendor, setVendor] = useState('');
  const [spentOnDate, setSpentOnDate] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (expense) {
      setCategory(expense.category);
      setDescription(expense.description || '');
      setAmount(expense.amount);
      setQuantity(expense.quantity || '');
      setUnit(expense.unit || '');
      setVendor(expense.vendor || '');
      setSpentOnDate(expense.spentOnDate ? new Date(expense.spentOnDate).toISOString().split('T')[0] : '');
      setNote(expense.note || '');
    } else {
      setCategory('Seeds');
      setDescription('');
      setAmount('');
      setQuantity('');
      setUnit('');
      setVendor('');
      setSpentOnDate(new Date().toISOString().split('T')[0]);
      setNote('');
    }
  }, [expense, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = {
        cropCycleId,
        category,
        description,
        amount: parseFloat(amount),
        quantity: quantity ? parseFloat(quantity) : undefined,
        unit,
        vendor,
        spentOnDate: new Date(spentOnDate).toISOString(),
        note,
      };

      if (expense) {
        await expensesApi.update(expense._id, data);
        toast.success('Expense updated successfully.');
      } else {
        await expensesApi.create(data);
        toast.success('Expense recorded successfully.');
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error(error.message || 'Failed to save expense.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={expense ? 'Edit Expense Record' : 'Record New Expense'}
    >
      <form onSubmit={handleSubmit} className="modal-form">
        <div className="input-group">
          <label className="input-label" htmlFor="expense-category">Category *</label>
          <div className="input-field-wrapper">
            <select
              id="expense-category"
              className="input-field select-field"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <Input
          label="Item Description *"
          name="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. Urea 50kg"
          required
        />

        <div className="flex gap-4">
          <div className="flex-1">
            <Input
              label="Quantity"
              type="number"
              name="quantity"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="e.g. 2"
              min="0"
              step="any"
            />
          </div>
          <div className="flex-1">
            <Input
              label="Unit"
              name="unit"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="e.g. Bag, KG, L"
            />
          </div>
        </div>

        <Input
          label="Total Cost (₹) *"
          type="number"
          name="amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="e.g. 5000"
          required
          min="0.01"
          step="0.01"
        />

        <Input
          label="Vendor"
          name="vendor"
          value={vendor}
          onChange={(e) => setVendor(e.target.value)}
          placeholder="e.g. Krishna Agro Center"
        />

        <Input
          label="Date Spent *"
          type="date"
          name="spentOnDate"
          value={spentOnDate}
          onChange={(e) => setSpentOnDate(e.target.value)}
          required
        />

        <Input
          label="Notes / Spent On"
          name="note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. Bought urea from Kisan Vendor"
        />

        <div className="modal-actions">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            {expense ? 'Save Changes' : 'Record Expense'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default ExpenseForm;
