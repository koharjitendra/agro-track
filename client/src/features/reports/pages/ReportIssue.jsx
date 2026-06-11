import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { FiAlertTriangle, FiSend, FiFileText } from 'react-icons/fi';
import Button from '../../../components/common/Button.jsx';
import * as reportsApi from '../../../api/reports.api.js';

const categories = [
  { value: 'BUG', label: 'Bug' },
  { value: 'ORDER_ISSUE', label: 'Order Issue' },
  { value: 'DELIVERY_ISSUE', label: 'Delivery Issue' },
  { value: 'PAYMENT_ISSUE', label: 'Payment Issue' },
  { value: 'MARKETPLACE_ISSUE', label: 'Marketplace Issue' },
  { value: 'FEATURE_REQUEST', label: 'Feature Request' },
  { value: 'SUGGESTION', label: 'Suggestion' },
  { value: 'OTHER', label: 'Other' },
];

const statusStyles = {
  OPEN: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  UNDER_REVIEW: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  RESOLVED: 'bg-green-500/10 text-green-400 border-green-500/20',
  CLOSED: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
};

const ReportIssue = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('BUG');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchMyReports = async (p = 1) => {
    setLoading(true);
    try {
      const res = await reportsApi.getMyReports(p);
      setReports(res.data.reports || []);
      setTotalPages(res.data.pagination?.totalPages || 1);
      setPage(p);
    } catch (err) {
      toast.error('Failed to load your submitted reports.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyReports();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      toast.error('Please fill in all required fields.');
      return;
    }
    if (description.length < 20) {
      toast.error('Description must be at least 20 characters.');
      return;
    }

    setSubmitting(true);
    try {
      await reportsApi.submitReport({ title, category, description });
      toast.success('🎉 Report submitted successfully. Admin has been notified.');
      setTitle('');
      setDescription('');
      fetchMyReports(1);
    } catch (err) {
      toast.error(err.message || 'Failed to submit report.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fade-in space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Report Issue</h1>
          <p className="page-subtitle">Submit a bug, marketplace issue, or platform suggestion directly to the Admin</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Submit Form */}
        <div className="lg:col-span-1">
          <div className="glass-card">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-white">
              <FiAlertTriangle className="text-yellow-400" /> New Report
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="input-group">
                <label className="input-label" htmlFor="title">Issue Title *</label>
                <div className="input-field-wrapper">
                  <input
                    id="title"
                    className="input-field"
                    placeholder="Short summary of the issue"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label" htmlFor="category">Category *</label>
                <div className="input-field-wrapper">
                  <select
                    id="category"
                    className="input-field bg-zinc-800"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    required
                  >
                    {categories.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="input-group">
                <label className="input-label" htmlFor="description">Detailed Description (Min 20 chars) *</label>
                <div className="input-field-wrapper">
                  <textarea
                    id="description"
                    className="input-field min-h-[120px] py-2 resize-none"
                    placeholder="Describe exactly what happened or what you suggest..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                  />
                </div>
              </div>

              <Button type="submit" variant="primary" className="w-full" icon={FiSend} loading={submitting}>
                Submit Issue
              </Button>
            </form>
          </div>
        </div>

        {/* My Reports */}
        <div className="lg:col-span-2">
          <div className="glass-card h-full flex flex-col">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-white">
              <FiFileText className="text-green-400" /> My Reports History
            </h2>

            {loading && reports.length === 0 ? (
              <div className="flex-1 flex items-center justify-center p-8 text-gray-400">Loading...</div>
            ) : reports.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-gray-500 text-center">
                <span className="text-4xl mb-2">📋</span>
                <h4>No reports found</h4>
                <p className="text-sm text-gray-400">Issues you report will show up here.</p>
              </div>
            ) : (
              <div className="flex-1 flex flex-col justify-between">
                <div className="space-y-4">
                  {reports.map((report) => (
                    <div key={report._id} className="p-4 bg-zinc-800/40 rounded-lg border border-zinc-700/60 space-y-3">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <span className="text-xs font-semibold text-gray-400 tracking-wider bg-zinc-700/40 px-2 py-0.5 rounded border border-zinc-600/30">
                            {categories.find(c => c.value === report.category)?.label || report.category}
                          </span>
                          <h4 className="font-bold text-white mt-1.5">{report.title}</h4>
                        </div>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded border ${statusStyles[report.status] || 'bg-zinc-700'}`}>
                          {report.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-300 whitespace-pre-wrap">{report.description}</p>
                      
                      {report.adminResponse && (
                        <div className="p-3 bg-green-500/5 rounded border border-green-500/15 space-y-1">
                          <p className="text-xs font-bold text-green-400 flex items-center gap-1">
                            <span>💬 Admin Response</span>
                            {report.respondedAt && (
                              <span className="text-gray-500 font-normal">
                                · {new Date(report.respondedAt).toLocaleDateString()}
                              </span>
                            )}
                          </p>
                          <p className="text-sm text-gray-200">{report.adminResponse}</p>
                        </div>
                      )}
                      
                      <div className="text-xs text-gray-500 text-right">
                        Reported: {new Date(report.createdAt).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="pagination flex justify-center gap-2 mt-4 pt-3 border-t border-zinc-700">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => fetchMyReports(page - 1)}
                      disabled={page <= 1}
                    >
                      Previous
                    </Button>
                    <span className="self-center text-sm text-gray-400">Page {page} of {totalPages}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => fetchMyReports(page + 1)}
                      disabled={page >= totalPages}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportIssue;
