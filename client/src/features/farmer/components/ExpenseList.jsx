import React from 'react';
import { FiEdit2, FiTrash2 } from 'react-icons/fi';
import { formatMoney } from '../../../utils/money.js';
import { formatDate } from '../../../utils/date.js';

const ExpenseList = ({ expenses, onEdit, onDelete }) => {
  const formatCategory = (cat) => {
    if (!cat) return 'Other';
    return cat.replace('_', ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const getCategoryIcon = (cat) => {
    switch (cat) {
      case 'Seeds': return '🌰';
      case 'Fertilizers': return '🌱';
      case 'Pesticides': return '🧴';
      case 'Labor': return '🧑‍🌾';
      case 'Fuel': return '⛽';
      case 'Machinery': return '🚜';
      case 'Transportation': return '🚚';
      case 'Water': return '💧';
      case 'Electricity': return '⚡';
      default: return '💵';
    }
  };

  if (expenses.length === 0) {
    return <p className="empty-text">No expense records found. Click "Add Expense" to record one.</p>;
  }

  return (
    <div className="table-container">
      <table className="table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Item</th>
            <th>Category</th>
            <th>Vendor</th>
            <th>Cost</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {expenses.map((exp) => (
            <tr key={exp._id}>
              <td>{formatDate(exp.spentOnDate)}</td>
              <td>
                <div className="font-medium">{exp.description || 'N/A'}</div>
                {exp.quantity && exp.unit && <div className="text-xs text-gray-400">{exp.quantity} {exp.unit}</div>}
              </td>
              <td>
                <span className="expense-category-cell">
                  <span className="expense-icon-inline" style={{ marginRight: '8px' }}>
                    {getCategoryIcon(exp.category)}
                  </span>
                  {formatCategory(exp.category)}
                </span>
              </td>
              <td>{exp.vendor || <span className="text-gray-500">-</span>}</td>
              <td className="text-bold text-coral">{formatMoney(exp.amount)}</td>
              <td>
                <div className="action-buttons-wrapper">
                  <button className="action-icon-btn btn-edit" onClick={() => onEdit(exp)} title="Edit Expense">
                    <FiEdit2 />
                  </button>
                  <button className="action-icon-btn btn-delete" onClick={() => onDelete(exp._id)} title="Delete Expense">
                    <FiTrash2 />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ExpenseList;
