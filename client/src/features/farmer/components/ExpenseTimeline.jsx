import React from 'react';
import { formatMoney } from '../../../utils/money.js';
import { formatDate } from '../../../utils/date.js';
import { FiEdit2, FiTrash2 } from 'react-icons/fi';

const ExpenseTimeline = ({ expenses, onEdit, onDelete }) => {
  if (expenses.length === 0) {
    return <p className="empty-text">No expense records found.</p>;
  }

  // Sort expenses by date ascending for timeline
  const sortedExpenses = [...expenses].sort((a, b) => new Date(a.spentOnDate) - new Date(b.spentOnDate));

  return (
    <div className="expense-timeline p-4">
      <div className="relative border-l-2 border-green-500/30 ml-4">
        {sortedExpenses.map((exp, index) => (
          <div key={exp._id} className="mb-8 ml-6 relative group">
            {/* Timeline dot */}
            <span className="absolute -left-[35px] flex items-center justify-center w-6 h-6 bg-green-900 rounded-full ring-4 ring-[#1A1A1A]">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            </span>
            
            <div className="glass-card p-4 rounded-lg shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="text-sm text-green-400 font-semibold mb-1">{formatDate(exp.spentOnDate)}</div>
                  <h3 className="text-lg font-bold text-gray-100">{exp.description || 'Unknown Item'}</h3>
                  <div className="text-sm text-gray-400">
                    <span className="inline-block px-2 py-1 bg-green-900/40 text-green-300 rounded text-xs mr-2 border border-green-700/50">
                      {exp.category}
                    </span>
                    {exp.vendor && <span>from {exp.vendor}</span>}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-coral">{formatMoney(exp.amount)}</div>
                  <div className="flex gap-2 justify-end mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-1.5 text-gray-400 hover:text-white bg-zinc-800 rounded" onClick={() => onEdit(exp)}>
                      <FiEdit2 size={14} />
                    </button>
                    <button className="p-1.5 text-gray-400 hover:text-red-400 bg-zinc-800 rounded" onClick={() => onDelete(exp._id)}>
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExpenseTimeline;
