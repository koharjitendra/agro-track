import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { FiPlus, FiCalendar, FiActivity, FiEdit2, FiMapPin } from 'react-icons/fi';
import Loader from '../../../components/common/Loader.jsx';
import Modal from '../../../components/common/Modal.jsx';
import Input from '../../../components/common/Input.jsx';
import Button from '../../../components/common/Button.jsx';
import * as cropCyclesApi from '../../../api/cropCycles.api.js';
import { formatMoney } from '../../../utils/money.js';
import { formatDate } from '../../../utils/date.js';

const CropCycles = () => {
  const navigate = useNavigate();
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [cropName, setCropName] = useState('');
  const [seasonYear, setSeasonYear] = useState('');
  const [seedVariety, setSeedVariety] = useState('');
  const [area, setArea] = useState('');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState('');
  const [expectedHarvestDate, setExpectedHarvestDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [investmentAmount, setInvestmentAmount] = useState('');
  const [selectedCropId, setSelectedCropId] = useState(null);

  const fetchCrops = async () => {
    try {
      setLoading(true);
      const response = await cropCyclesApi.getAll();
      setCrops(response.data || []);
    } catch (error) {
      console.error('Error fetching crop cycles:', error);
      toast.error('Failed to load crop cycles.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCrops();
  }, []);

  const handleOpenAddModal = () => {
    setSelectedCropId(null);
    setCropName('');
    setSeasonYear('');
    setSeedVariety('');
    setArea('');
    setLocation('');
    setStartDate('');
    setExpectedHarvestDate('');
    setEndDate('');
    setInvestmentAmount('');
    setModalOpen(true);
  };

  const handleOpenEditModal = (e, crop) => {
    e.stopPropagation(); // prevent card click navigation
    setSelectedCropId(crop._id);
    setCropName(crop.cropName);
    setSeasonYear(crop.seasonYear || '');
    setSeedVariety(crop.seedVariety || '');
    setArea(crop.area || '');
    setLocation(crop.location || '');
    setStartDate(crop.startDate ? new Date(crop.startDate).toISOString().split('T')[0] : '');
    setExpectedHarvestDate(crop.expectedHarvestDate ? new Date(crop.expectedHarvestDate).toISOString().split('T')[0] : '');
    setEndDate(crop.endDate ? new Date(crop.endDate).toISOString().split('T')[0] : '');
    setInvestmentAmount(crop.investmentAmount || '');
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const data = {
        cropName,
        seasonYear,
        seedVariety,
        area: area ? parseFloat(area) : undefined,
        location,
        startDate: startDate ? new Date(startDate).toISOString() : undefined,
        expectedHarvestDate: expectedHarvestDate ? new Date(expectedHarvestDate).toISOString() : undefined,
        endDate: endDate ? new Date(endDate).toISOString() : undefined,
        investmentAmount: investmentAmount ? parseFloat(investmentAmount) : 0,
      };

      if (selectedCropId) {
        await cropCyclesApi.update(selectedCropId, data);
        toast.success('Crop cycle updated!');
      } else {
        await cropCyclesApi.create(data);
        toast.success('Crop cycle created!');
      }
      setModalOpen(false);
      fetchCrops();
    } catch (error) {
      console.error(error);
      toast.error(error.message || 'Action failed.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loader fullPage />;

  return (
    <div className="crop-cycles-page fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Crop Cycles</h1>
          <p className="page-subtitle">Manage crop seasons and associated expenses</p>
        </div>
        <Button variant="primary" icon={FiPlus} onClick={handleOpenAddModal}>
          New Crop Cycle
        </Button>
      </div>

      {crops.length === 0 ? (
        <div className="empty-state glass-card">
          <div className="empty-state-icon">🌾</div>
          <h3>No Crop Cycles Created</h3>
          <p>Create a crop cycle to start logging expenses and tracking sales.</p>
          <Button variant="primary" onClick={handleOpenAddModal} className="mt-4">
            Create First Crop Cycle
          </Button>
        </div>
      ) : (
        <div className="crop-grid">
          {crops.map((crop) => (
            <div
              key={crop._id}
              className="crop-card glass-card hover-glow"
              onClick={() => navigate(`/farmer/crop-cycles/${crop._id}`)}
            >
              <div className="crop-card-header">
                <div className="crop-icon-title-group">
                  <span className="crop-icon">🌾</span>
                  <div>
                    <h3 className="crop-name">{crop.cropName}</h3>
                    <p className="crop-season">{crop.seasonYear || 'No Season Specified'}</p>
                  </div>
                </div>
                <button className="crop-edit-btn" onClick={(e) => handleOpenEditModal(e, crop)}>
                  <FiEdit2 />
                </button>
              </div>

              <div className="crop-card-body">
                <div className="crop-detail-row">
                  <FiCalendar className="crop-detail-icon" />
                  <span>Started: {formatDate(crop.startDate)}</span>
                </div>
                {crop.expectedHarvestDate && (
                  <div className="crop-detail-row">
                    <FiCalendar className="crop-detail-icon" />
                    <span>Expected Harvest: {formatDate(crop.expectedHarvestDate)}</span>
                  </div>
                )}
                {(crop.area || crop.location) && (
                  <div className="crop-detail-row text-gray-400">
                    <FiMapPin className="crop-detail-icon" />
                    <span>
                      {crop.area ? `${crop.area} Acres` : ''} 
                      {crop.area && crop.location ? ' | ' : ''} 
                      {crop.location || ''}
                    </span>
                  </div>
                )}
                <div className="crop-detail-row">
                  <FiActivity className="crop-detail-icon" />
                  <span>Status: 
                    <span className={`badge badge-${crop.cropStatus?.toLowerCase().replace(/_/g, '-')}`}>
                      {crop.cropStatus?.replace(/_/g, ' ')}
                    </span>
                  </span>
                </div>
              </div>

              <div className="crop-card-footer flex flex-col gap-1 border-t border-zinc-700 pt-3">
                <div className="flex justify-between">
                  <span className="text-gray-400 text-sm">Investment:</span>
                  <span className="text-amber-400 font-bold">{formatMoney(crop.investmentAmount || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 text-sm">Total Expenses:</span>
                  <span className="text-red-400 font-bold">{formatMoney(crop.totalExpenses || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 text-sm">Total Revenue:</span>
                  <span className="text-green-400 font-bold">{formatMoney(crop.totalRevenue || 0)}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-zinc-800 mt-1">
                  <span className="text-gray-300 font-bold">Net Profit:</span>
                  <span className={`font-bold ${(crop.totalRevenue || 0) - (crop.totalExpenses || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {formatMoney((crop.totalRevenue || 0) - (crop.totalExpenses || 0))}
                  </span>
                </div>
                <div className="text-center mt-3">
                  <span className="text-sm text-green-500 group-hover:text-green-400 font-semibold cursor-pointer">Click for Details →</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={selectedCropId ? 'Edit Crop Cycle' : 'Create Crop Cycle'}
      >
        <form onSubmit={handleSubmit} className="modal-form">
          <Input
            label="Crop Name"
            name="cropName"
            value={cropName}
            onChange={(e) => setCropName(e.target.value)}
            placeholder="Wheat, Rice, Sugarcane..."
            required
          />
          <Input
            label="Season & Year"
            name="seasonYear"
            value={seasonYear}
            onChange={(e) => setSeasonYear(e.target.value)}
            placeholder="Rabi 2026, Kharif 2025..."
          />
          <Input
            label="Seed Variety"
            name="seedVariety"
            value={seedVariety}
            onChange={(e) => setSeedVariety(e.target.value)}
            placeholder="e.g. Shriram 303"
          />
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                label="Area (Acres)"
                type="number"
                name="area"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                placeholder="e.g. 2.5"
                min="0"
                step="0.1"
              />
            </div>
            <div className="flex-1">
              <Input
                label="Location"
                name="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Field A"
              />
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                label="Start Date"
                type="date"
                name="startDate"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <Input
                label="Expected Harvest Date"
                type="date"
                name="expectedHarvestDate"
                value={expectedHarvestDate}
                onChange={(e) => setExpectedHarvestDate(e.target.value)}
              />
            </div>
          </div>
          {selectedCropId && (
            <Input
              label="End Date (Optional)"
              type="date"
              name="endDate"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          )}

          <Input
            label="Investment Amount (₹)"
            type="number"
            name="investmentAmount"
            value={investmentAmount}
            onChange={(e) => setInvestmentAmount(e.target.value)}
            placeholder="Total capital invested (seeds, labour, etc.)"
            min="0"
            step="0.01"
          />

          <div className="modal-actions">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={submitting}>
              {selectedCropId ? 'Save Changes' : 'Create Cycle'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CropCycles;
