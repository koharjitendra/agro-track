import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { FiCheckCircle, FiClock, FiPlus } from 'react-icons/fi';
import Button from '../../../components/common/Button.jsx';
import Modal from '../../../components/common/Modal.jsx';
import Input from '../../../components/common/Input.jsx';
import * as cropCyclesApi from '../../../api/cropCycles.api.js';
import { formatDate } from '../../../utils/date.js';

const STAGES = ['SEEDLING', 'VEGETATIVE', 'FLOWERING', 'YIELDING', 'HARVESTED'];

const StageTracker = ({ crop, onUpdate }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedStage, setSelectedStage] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Reminder state
  const [reminderModalOpen, setReminderModalOpen] = useState(false);
  const [reminderTitle, setReminderTitle] = useState('');
  const [reminderDate, setReminderDate] = useState('');
  const [reminderSubmitting, setReminderSubmitting] = useState(false);

  const currentStageIndex = STAGES.indexOf(crop.growthStage || 'SEEDLING');

  const handleOpenStageModal = () => {
    setSelectedStage(crop.growthStage || 'SEEDLING');
    setNotes('');
    setModalOpen(true);
  };

  const handleStageUpdate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await cropCyclesApi.updateStage(crop._id, { stage: selectedStage, notes });
      toast.success('Growth stage updated!');
      setModalOpen(false);
      onUpdate();
    } catch (err) {
      toast.error(err.message || 'Failed to update stage');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddReminder = async (e) => {
    e.preventDefault();
    setReminderSubmitting(true);
    try {
      await cropCyclesApi.addReminder(crop._id, { title: reminderTitle, date: reminderDate });
      toast.success('Reminder added!');
      setReminderModalOpen(false);
      setReminderTitle('');
      setReminderDate('');
      onUpdate();
    } catch (err) {
      toast.error(err.message || 'Failed to add reminder');
    } finally {
      setReminderSubmitting(false);
    }
  };

  const handleToggleReminder = async (reminderId) => {
    try {
      await cropCyclesApi.toggleReminder(crop._id, reminderId);
      toast.success('Reminder updated');
      onUpdate();
    } catch (err) {
      toast.error('Failed to toggle reminder');
    }
  };

  return (
    <div className="space-y-6">
      {/* Visual Step Bar */}
      <div className="glass-card p-6 rounded-lg">
        <h3 className="text-lg font-bold mb-6">Growth Stage Progress</h3>
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-2 relative">
          {/* Connector Line */}
          <div className="absolute hidden md:block left-0 right-0 top-1/2 h-1 bg-zinc-700 -translate-y-1/2 z-0" />
          <div 
            className="absolute hidden md:block left-0 top-1/2 h-1 bg-green-500 -translate-y-1/2 z-0 transition-all duration-500" 
            style={{ width: `${(currentStageIndex / (STAGES.length - 1)) * 100}%` }}
          />

          {STAGES.map((stage, idx) => {
            const isCompleted = idx < currentStageIndex;
            const isActive = idx === currentStageIndex;
            return (
              <div key={stage} className="flex md:flex-col items-center gap-3 md:gap-2 z-10 w-full md:w-auto">
                <div 
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-all ${
                    isCompleted ? 'bg-green-600 border-green-500 text-white' : 
                    isActive ? 'bg-zinc-800 border-green-400 text-green-400 scale-110 shadow-[0_0_12px_rgba(74,222,128,0.3)]' : 
                    'bg-zinc-900 border-zinc-700 text-zinc-500'
                  }`}
                >
                  {isCompleted ? <FiCheckCircle /> : idx + 1}
                </div>
                <span className={`text-xs font-semibold uppercase tracking-wider ${isActive ? 'text-green-400 font-bold' : 'text-gray-400'}`}>
                  {stage}
                </span>
              </div>
            );
          })}
        </div>

        <div className="flex justify-between items-center mt-8 pt-4 border-t border-zinc-800">
          <div>
            <span className="text-gray-400 text-sm">Current Stage: </span>
            <span className="text-green-400 font-bold text-lg uppercase ml-1">{crop.growthStage || 'SEEDLING'}</span>
          </div>
          <Button variant="primary" onClick={handleOpenStageModal}>
            Advance Stage
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stage Timeline Log */}
        <div className="glass-card p-6 rounded-lg">
          <h3 className="text-lg font-bold mb-4">Stage History</h3>
          <div className="space-y-4">
            {crop.growthStageLog?.length === 0 ? (
              <p className="text-gray-500 text-sm">No stage changes logged.</p>
            ) : (
              [...crop.growthStageLog].reverse().map((log, index) => (
                <div key={index} className="flex gap-4 relative">
                  {index < crop.growthStageLog.length - 1 && (
                    <div className="absolute left-2.5 top-5 bottom-0 w-0.5 bg-zinc-800" />
                  )}
                  <div className="w-5 h-5 rounded-full bg-green-500/20 border border-green-500 flex items-center justify-center text-[10px] text-green-400 font-bold mt-1">
                    ✓
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-200 uppercase text-sm">{log.stage}</h4>
                    <p className="text-xs text-gray-500">{formatDate(log.date)}</p>
                    {log.notes && <p className="text-sm text-gray-400 mt-1 italic">"{log.notes}"</p>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Reminders list */}
        <div className="glass-card p-6 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold">Stage Reminders</h3>
            <Button variant="ghost" className="btn-sm flex items-center gap-1" onClick={() => setReminderModalOpen(true)}>
              <FiPlus /> Add
            </Button>
          </div>
          <div className="space-y-3">
            {crop.stageReminders?.length === 0 ? (
              <p className="text-gray-500 text-sm">No reminders set for this crop.</p>
            ) : (
              crop.stageReminders?.map((rem) => (
                <div 
                  key={rem._id} 
                  className={`flex justify-between items-center p-3 rounded-lg border transition-all ${
                    rem.completed ? 'bg-zinc-900/50 border-zinc-800/80 opacity-60' : 'bg-zinc-800/40 border-zinc-700/50 hover:bg-zinc-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input 
                      type="checkbox" 
                      checked={rem.completed} 
                      onChange={() => handleToggleReminder(rem._id)}
                      className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-green-500 focus:ring-green-500"
                    />
                    <div>
                      <p className={`text-sm font-bold ${rem.completed ? 'line-through text-gray-500' : 'text-gray-200'}`}>{rem.title}</p>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <FiClock /> {formatDate(rem.date)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Advance Stage Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Advance Growth Stage">
        <form onSubmit={handleStageUpdate} className="modal-form">
          <div className="input-group">
            <label className="input-label">Select Growth Stage</label>
            <select
              className="input-field select-field"
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value)}
              required
            >
              {STAGES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <Input
            label="Stage Change Note (Optional)"
            placeholder="e.g. Applied first watering, seedlings emerged."
            name="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <div className="modal-actions">
            <Button variant="ghost" type="button" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit" loading={submitting}>Update Stage</Button>
          </div>
        </form>
      </Modal>

      {/* Add Reminder Modal */}
      <Modal isOpen={reminderModalOpen} onClose={() => setReminderModalOpen(false)} title="Create Stage Reminder">
        <form onSubmit={handleAddReminder} className="modal-form">
          <Input
            label="Reminder Title *"
            placeholder="e.g. Apply Nitrogen fertilizer, Spray organic pesticide"
            name="title"
            value={reminderTitle}
            onChange={(e) => setReminderTitle(e.target.value)}
            required
          />

          <Input
            label="Reminder Date *"
            type="date"
            name="date"
            value={reminderDate}
            onChange={(e) => setReminderDate(e.target.value)}
            required
          />

          <div className="modal-actions">
            <Button variant="ghost" type="button" onClick={() => setReminderModalOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit" loading={reminderSubmitting}>Add Reminder</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default StageTracker;
