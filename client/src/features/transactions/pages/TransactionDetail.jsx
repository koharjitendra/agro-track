import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { FiCalendar, FiUser, FiInfo, FiEdit2 } from 'react-icons/fi';
import Loader from '../../../components/common/Loader.jsx';
import Button from '../../../components/common/Button.jsx';
import Input from '../../../components/common/Input.jsx';
import ApprovalActions from '../components/ApprovalActions.jsx';
import RevisionHistory from '../components/RevisionHistory.jsx';
import * as transactionsApi from '../../../api/transactions.api.js';
import * as cropCyclesApi from '../../../api/cropCycles.api.js';
import { useAuthStore } from '../../../store/auth.store.js';
import { formatMoney } from '../../../utils/money.js';
import { formatDate } from '../../../utils/date.js';

const TransactionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [tx, setTx] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRevising, setIsRevising] = useState(false);
  const [crops, setCrops] = useState([]);
  
  // Revise Form State
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('kg');
  const [pricePerUnit, setPricePerUnit] = useState('');
  const [amountPaid, setAmountPaid] = useState('');
  const [transactionDate, setTransactionDate] = useState('');
  const [cropCycleId, setCropCycleId] = useState('');
  const [notes, setNotes] = useState('');
  const [changeNote, setChangeNote] = useState('');
  const [revisingSubmit, setRevisingSubmit] = useState(false);

  const fetchTransaction = async () => {
    try {
      setLoading(true);
      const response = await transactionsApi.getById(id);
      const data = response.data;
      setTx(data);
      
      // Seed revise form values
      setQuantity(data.quantity);
      setUnit(data.unit || 'kg');
      setPricePerUnit(data.pricePerUnit);
      setAmountPaid(data.amountPaid || 0);
      setTransactionDate(data.transactionDate ? new Date(data.transactionDate).toISOString().split('T')[0] : '');
      setCropCycleId(data.cropCycleId?._id || '');
      setNotes(data.notes || '');
    } catch (error) {
      console.error(error);
      toast.error(error.message || 'Failed to fetch transaction details.');
      navigate('/transactions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransaction();
  }, [id]);

  useEffect(() => {
    const fetchCrops = async () => {
      if (user?.role === 'FARMER' && isRevising) {
        try {
          const res = await cropCyclesApi.getAll();
          setCrops(res.data || []);
        } catch (error) {
          console.error(error);
        }
      }
    };
    fetchCrops();
  }, [isRevising, user]);

  const handleReviseSubmit = async (e) => {
    e.preventDefault();
    if (!changeNote.trim()) {
      toast.error('Please describe what changes were made in the change note.');
      return;
    }

    setRevisingSubmit(true);
    try {
      const data = {
        quantity: parseFloat(quantity),
        unit,
        pricePerUnit: parseFloat(pricePerUnit),
        amountPaid: parseFloat(amountPaid),
        transactionDate: new Date(transactionDate).toISOString(),
        cropCycleId: cropCycleId || null,
        notes,
        changeNote
      };
      await transactionsApi.revise(id, data);
      toast.success('Transaction revised successfully! Resubmitted for approval.');
      setIsRevising(false);
      setChangeNote('');
      fetchTransaction();
    } catch (error) {
      console.error(error);
      toast.error(error.message || 'Revision failed.');
    } finally {
      setRevisingSubmit(false);
    }
  };

  if (loading) return <Loader fullPage />;

  const isFarmer = user?.role === 'FARMER';
  const otherParty = isFarmer ? tx.buyerId : tx.farmerId;
  const creatorId = tx.createdByUserId?._id || tx.createdByUserId;
  const isCreator = creatorId === user?.id;
  const showApprovals = tx.status === 'PENDING' && !isCreator;
  const showReviseButton = tx.status === 'CHANGES_REQUESTED' && isCreator && !isRevising;

  return (
    <div className="transaction-detail-page fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Transaction Details</h1>
          <p className="page-subtitle">Unique Ledger ID: #{tx._id}</p>
        </div>
        <Button variant="ghost" onClick={() => navigate('/transactions')}>
          Back to Ledger
        </Button>
      </div>

      <div className="tx-detail-grid">
        {/* Left Side: Summary & revision forms */}
        <div className="tx-detail-left">
          {isRevising ? (
            <form onSubmit={handleReviseSubmit} className="glass-card revise-form">
              <h2 className="card-title text-green-bright">Revise Transaction</h2>
              <p className="card-subtitle" style={{ marginBottom: '20px' }}>Apply required edits and resubmit to other party for review.</p>

              {user?.role === 'FARMER' && (
                <div className="input-group">
                  <label className="input-label" htmlFor="cycle-select">Link Crop Cycle</label>
                  <div className="input-field-wrapper">
                    <select
                      id="cycle-select"
                      className="input-field select-field"
                      value={cropCycleId}
                      onChange={(e) => setCropCycleId(e.target.value)}
                    >
                      <option value="">None (Direct Trade)</option>
                      {crops.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.cropName} ({c.seasonYear})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div className="form-grid">
                <Input
                  label="Quantity"
                  type="number"
                  name="quantity"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  required
                  min="0.1"
                  step="0.1"
                />
                <Input
                  label="Unit"
                  name="unit"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  required
                />
              </div>

              <div className="form-grid">
                <Input
                  label="Price Per Unit (₹)"
                  type="number"
                  name="pricePerUnit"
                  value={pricePerUnit}
                  onChange={(e) => setPricePerUnit(e.target.value)}
                  required
                  min="0.01"
                  step="0.01"
                />
                <div className="input-group">
                  <label className="input-label">Recalculated Value</label>
                  <div className="input-field-wrapper">
                    <input
                      type="text"
                      className="input-field cursor-not-allowed text-bold text-green-bright"
                      value={formatMoney((parseFloat(quantity) || 0) * (parseFloat(pricePerUnit) || 0))}
                      disabled
                    />
                  </div>
                </div>
              </div>

              <div className="form-grid">
                <Input
                  label="Amount Paid (₹)"
                  type="number"
                  name="amountPaid"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  min="0"
                  step="0.01"
                />
                <Input
                  label="Date"
                  type="date"
                  name="transactionDate"
                  value={transactionDate}
                  onChange={(e) => setTransactionDate(e.target.value)}
                  required
                />
              </div>

              <Input
                label="Revision Notes"
                name="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Details of harvest quality, loading, etc."
              />

              <Input
                label="Change Note for Audit Ledger *"
                name="changeNote"
                value={changeNote}
                onChange={(e) => setChangeNote(e.target.value)}
                placeholder="Explain what was edited (e.g. Changed qty to 1200kg per agreement)"
                required
              />

              <div className="form-actions" style={{ marginTop: '20px' }}>
                <Button variant="ghost" onClick={() => setIsRevising(false)}>
                  Cancel Edit
                </Button>
                <Button type="submit" variant="primary" loading={revisingSubmit}>
                  Submit Revision
                </Button>
              </div>
            </form>
          ) : (
            <div className="glass-card info-card">
              <div className="tx-info-header">
                <h2 className="card-title">Agreement Terms</h2>
                <span className={`badge badge-${tx.status?.toLowerCase()?.replace('_', '-')}`}>
                  {tx.status?.replace('_', ' ')}
                </span>
              </div>

              <div className="tx-details-list">
                <div className="tx-details-row">
                  <FiUser className="tx-icon" />
                  <div>
                    <p className="tx-label">Farmer Name</p>
                    <p className="tx-val text-bold">{tx.farmerId?.name}</p>
                    <p className="tx-val-sub">{tx.farmerId?.phone || tx.farmerId?.email}</p>
                  </div>
                </div>
                <div className="tx-details-row">
                  <FiUser className="tx-icon" />
                  <div>
                    <p className="tx-label">Buyer Name</p>
                    <p className="tx-val text-bold">{tx.buyerId?.name}</p>
                    <p className="tx-val-sub">{tx.buyerId?.phone || tx.buyerId?.email}</p>
                  </div>
                </div>
                <div className="tx-details-row">
                  <FiInfo className="tx-icon" />
                  <div>
                    <p className="tx-label">Crop Associated</p>
                    <p className="tx-val text-bold">{tx.cropCycleId?.cropName || 'Direct Trade (Unlinked)'}</p>
                    {tx.cropCycleId?.seasonYear && <p className="tx-val-sub">{tx.cropCycleId?.seasonYear}</p>}
                  </div>
                </div>
                <div className="tx-details-row">
                  <FiCalendar className="tx-icon" />
                  <div>
                    <p className="tx-label">Transaction Date</p>
                    <p className="tx-val text-bold">{formatDate(tx.transactionDate)}</p>
                  </div>
                </div>
              </div>

              <hr className="divider" />

              <div className="values-breakdown">
                <div className="breakdown-item">
                  <span>Quantity:</span>
                  <span className="text-bold">{tx.quantity} {tx.unit}</span>
                </div>
                <div className="breakdown-item">
                  <span>Price Per Unit:</span>
                  <span className="text-bold">{formatMoney(tx.pricePerUnit)}/{tx.unit}</span>
                </div>
                <div className="breakdown-item text-bold">
                  <span>Total Deal Value:</span>
                  <span className="text-xl">{formatMoney(tx.totalAmount)}</span>
                </div>
                <div className="breakdown-item">
                  <span>Amount Paid:</span>
                  <span className="text-green-bright text-bold">{formatMoney(tx.amountPaid)}</span>
                </div>
                <div className="breakdown-item">
                  <span>Outstanding Balance (Due):</span>
                  <span className="text-coral text-bold">{formatMoney(tx.amountDue)}</span>
                </div>
                <div className="breakdown-item">
                  <span>Payment Ledger Status:</span>
                  <span className={`badge badge-payment-${tx.paymentStatus?.toLowerCase()}`}>{tx.paymentStatus}</span>
                </div>
              </div>

              {tx.notes && (
                <div className="tx-notes-box">
                  <p className="tx-notes-label text-bold">Notes</p>
                  <p className="tx-notes-content">"{tx.notes}"</p>
                </div>
              )}

              {showReviseButton && (
                <div className="revise-trigger-box" style={{ marginTop: '24px' }}>
                  <Button variant="primary" icon={FiEdit2} onClick={() => setIsRevising(true)}>
                    Revise Terms & Resubmit
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Side: Approval actions & revision logs */}
        <div className="tx-detail-right">
          {showApprovals && (
            <ApprovalActions transactionId={id} onSuccess={fetchTransaction} />
          )}
          <RevisionHistory transactionId={id} />
        </div>
      </div>
    </div>
  );
};

export default TransactionDetail;
