import React, { useEffect, useState } from 'react';
import { FiClock, FiCornerDownRight } from 'react-icons/fi';
import Loader from '../../../components/common/Loader.jsx';
import * as approvalsApi from '../../../api/approvals.api.js';
import { formatDateTime } from '../../../utils/date.js';

const RevisionHistory = ({ transactionId }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    const fetchHistory = async () => {
      try {
        setLoading(true);
        const response = await approvalsApi.getByTransaction(transactionId);
        if (active) {
          setHistory(response.data || []);
        }
      } catch (error) {
        if (active && error.name !== 'AbortError') {
          console.error('Error fetching approval history:', error);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchHistory();

    return () => {
      active = false;
      controller.abort();
    };
  }, [transactionId]);

  if (loading) return <Loader size="sm" />;
  if (history.length === 0) return null;

  return (
    <div className="revision-history-box glass-card" style={{ marginTop: '24px' }}>
      <h3 className="box-title">Timeline & Decisions</h3>
      <div className="timeline">
        {history.map((h) => (
          <div key={h._id} className="timeline-item">
            <div className="timeline-badge">
              <FiClock />
            </div>
            <div className="timeline-content">
              <div className="timeline-header">
                <span className="timeline-user">
                  {h.userId?.name} <span className="timeline-user-role">({h.userId?.role})</span>
                </span>
                <span className="timeline-date">{formatDateTime(h.decidedAt || h.createdAt)}</span>
              </div>
              <div className="timeline-body">
                <span className={`badge badge-${h.decision?.toLowerCase()?.replace('_', '-')}`}>
                  {h.decision?.replace('_', ' ')}
                </span>
                {h.comment && (
                  <p className="timeline-comment">
                    <FiCornerDownRight className="timeline-comment-icon" /> "{h.comment}"
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RevisionHistory;
