import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { FiCheck, FiX, FiEdit } from 'react-icons/fi';
import Button from '../../../components/common/Button.jsx';
import Input from '../../../components/common/Input.jsx';
import * as transactionsApi from '../../../api/transactions.api.js';

const ApprovalActions = ({ transactionId, onSuccess }) => {
  const [comment, setComment] = useState('');
  const [actionLoading, setActionLoading] = useState(null); // 'approve' | 'reject' | 'changes'

  const handleApprove = async () => {
    setActionLoading('approve');
    try {
      await transactionsApi.approve(transactionId);
      toast.success('Transaction approved!');
      onSuccess();
    } catch (error) {
      toast.error(error.message || 'Approval failed.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRequestChanges = async () => {
    if (!comment.trim()) {
      toast.error('Please add a comment explaining what needs changes.');
      return;
    }
    setActionLoading('changes');
    try {
      await transactionsApi.requestChanges(transactionId, comment);
      toast.success('Changes requested.');
      setComment('');
      onSuccess();
    } catch (error) {
      toast.error(error.message || 'Request changes failed.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!window.confirm('Are you sure you want to reject this transaction?')) return;
    setActionLoading('reject');
    try {
      await transactionsApi.reject(transactionId, comment);
      toast.success('Transaction rejected.');
      setComment('');
      onSuccess();
    } catch (error) {
      toast.error(error.message || 'Rejection failed.');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="approval-actions-box glass-card">
      <h3 className="box-title">Process Transaction Proposal</h3>
      <p className="box-subtitle">You did not create this proposal. Please verify the terms and approve or ask for edits.</p>
      
      <Input
        label="Comments / Change Requests (Required for Edits/Rejections)"
        name="comment"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="e.g., Quantity is wrong. I thought we agreed on 1200kg, not 1500kg."
      />

      <div className="actions-buttons-grid">
        <Button
          variant="primary"
          icon={FiCheck}
          loading={actionLoading === 'approve'}
          disabled={!!actionLoading}
          onClick={handleApprove}
        >
          Approve & Lock
        </Button>
        <Button
          variant="secondary"
          icon={FiEdit}
          loading={actionLoading === 'changes'}
          disabled={!!actionLoading}
          onClick={handleRequestChanges}
        >
          Request Changes
        </Button>
        <Button
          variant="danger"
          icon={FiX}
          loading={actionLoading === 'reject'}
          disabled={!!actionLoading}
          onClick={handleReject}
        >
          Reject Deal
        </Button>
      </div>
    </div>
  );
};

export default ApprovalActions;
