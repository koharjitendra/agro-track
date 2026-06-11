import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { FiPlus, FiTrash2, FiEdit2, FiCalendar, FiFilter } from 'react-icons/fi';
import Button from '../../../components/common/Button.jsx';
import Modal from '../../../components/common/Modal.jsx';
import Input from '../../../components/common/Input.jsx';
import Loader from '../../../components/common/Loader.jsx';
import * as activitiesApi from '../../../api/activities.api.js';
import { formatDate } from '../../../utils/date.js';

const TYPES = ['IRRIGATION', 'FERTILIZER', 'PESTICIDE', 'HARVEST', 'OTHER'];

const ActivityLogTab = ({ cropId }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Filter
  const [filterType, setFilterType] = useState('');

  // Form Fields
  const [activityId, setActivityId] = useState(null);
  const [activityType, setActivityType] = useState('IRRIGATION');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const res = await activitiesApi.getByCropCycle(cropId);
      setActivities(res.data || []);
    } catch (err) {
      toast.error('Failed to load activity logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [cropId]);

  const handleOpenAddModal = () => {
    setActivityId(null);
    setActivityType('IRRIGATION');
    setDate(new Date().toISOString().split('T')[0]);
    setDescription('');
    setNotes('');
    setModalOpen(true);
  };

  const handleOpenEditModal = (activity) => {
    setActivityId(activity._id);
    setActivityType(activity.activityType);
    setDate(new Date(activity.date).toISOString().split('T')[0]);
    setDescription(activity.description);
    setNotes(activity.notes || '');
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const data = { activityType, date: new Date(date).toISOString(), description, notes };
      if (activityId) {
        await activitiesApi.update(activityId, data);
        toast.success('Activity updated!');
      } else {
        await activitiesApi.create(cropId, data);
        toast.success('Activity logged successfully!');
      }
      setModalOpen(false);
      fetchActivities();
    } catch (err) {
      toast.error(err.message || 'Failed to log activity');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this activity log?')) {
      try {
        await activitiesApi.remove(id);
        toast.success('Activity log deleted.');
        fetchActivities();
      } catch (err) {
        toast.error('Failed to delete activity.');
      }
    }
  };

  const filteredActivities = filterType 
    ? activities.filter(a => a.activityType === filterType)
    : activities;

  if (loading) return <Loader />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <FiFilter className="text-gray-400" />
          <select
            className="input-field select-field py-1 px-3 text-sm rounded bg-zinc-800"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            style={{ width: '180px' }}
          >
            <option value="">All Activities</option>
            {TYPES.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <Button variant="primary" icon={FiPlus} onClick={handleOpenAddModal}>
          Log Activity
        </Button>
      </div>

      {filteredActivities.length === 0 ? (
        <div className="empty-state glass-card py-10">
          <p className="text-gray-400">No activities logged yet.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Description</th>
                <th>Notes</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredActivities.map((act) => (
                <tr key={act._id} className="hover:bg-zinc-800/20">
                  <td className="whitespace-nowrap font-semibold">
                    <span className="flex items-center gap-1.5">
                      <FiCalendar className="text-gray-400" /> {formatDate(act.date)}
                    </span>
                  </td>
                  <td>
                    <span className={`badge badge-${act.activityType?.toLowerCase()}`}>
                      {act.activityType}
                    </span>
                  </td>
                  <td><p className="font-medium text-gray-200">{act.description}</p></td>
                  <td className="text-gray-400 text-sm italic">{act.notes || '-'}</td>
                  <td className="text-right">
                    <div className="flex justify-end gap-2">
                      <button className="btn btn-ghost btn-sm text-green-400 hover:bg-green-500/10 p-1" onClick={() => handleOpenEditModal(act)}>
                        <FiEdit2 size={16} />
                      </button>
                      <button className="btn btn-ghost btn-sm text-coral hover:bg-coral/10 p-1" onClick={() => handleDelete(act._id)}>
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Log Activity Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={activityId ? 'Edit Activity Log' : 'Log Farm Activity'}>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="input-group">
            <label className="input-label">Activity Type *</label>
            <select
              className="input-field select-field"
              value={activityType}
              onChange={(e) => setActivityType(e.target.value)}
              required
            >
              {TYPES.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <Input
            label="Date *"
            type="date"
            name="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />

          <Input
            label="Description *"
            placeholder="e.g. Applied Urea fertilizer, Watered field for 4 hours, Harvested 12 tons"
            name="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />

          <div className="input-group">
            <label className="input-label">Notes (Optional)</label>
            <textarea
              className="input-field min-h-[80px]"
              placeholder="e.g. Used Krishna Agro supplies. Field looks healthy."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="modal-actions">
            <Button variant="ghost" type="button" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit" loading={submitting}>Save Activity</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ActivityLogTab;
