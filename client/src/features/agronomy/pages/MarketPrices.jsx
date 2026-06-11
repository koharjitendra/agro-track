import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { FiTrendingUp, FiTrendingDown, FiMinus, FiMapPin, FiActivity } from 'react-icons/fi';
import Loader from '../../../components/common/Loader.jsx';
import ChartWrapper from '../../../components/charts/ChartWrapper.jsx';
import { LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';
import * as agronomyApi from '../../../api/agronomy.api.js';
import { formatMoney } from '../../../utils/money.js';
import { formatDate } from '../../../utils/date.js';

const MarketPrices = () => {
  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCrop, setSelectedCrop] = useState(null);

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        setLoading(true);
        const res = await agronomyApi.getMarketPrices();
        const data = res.data || [];
        setPrices(data);
        if (data.length > 0) {
          setSelectedCrop(data[0]);
        }
      } catch (err) {
        toast.error('Failed to load market prices.');
      } finally {
        setLoading(false);
      }
    };
    fetchPrices();
  }, []);

  if (loading) return <Loader fullPage />;

  const chartData = selectedCrop?.history?.map((item) => ({
    date: formatDate(item.date).split(' ').slice(0, 2).join(' '),
    price: item.price,
  })) || [];

  return (
    <div className="market-prices-page fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Market Price Intelligence</h1>
          <p className="page-subtitle">Real-time agricultural market rates and historic crop price trends</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Prices list table */}
        <div className="lg:col-span-2 glass-card p-0 overflow-hidden">
          <div className="p-4 border-b border-zinc-800">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <FiActivity className="text-green-400" /> Current Market Rates
            </h3>
          </div>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Crop</th>
                  <th>Location</th>
                  <th>Price / KG</th>
                  <th>Trend</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {prices.map((crop) => (
                  <tr 
                    key={crop._id} 
                    className={`cursor-pointer hover:bg-zinc-800/20 ${selectedCrop?._id === crop._id ? 'bg-zinc-800/40' : ''}`}
                    onClick={() => setSelectedCrop(crop)}
                  >
                    <td className="font-bold text-gray-100">{crop.cropName}</td>
                    <td>
                      <span className="flex items-center gap-1 text-sm text-gray-400">
                        <FiMapPin /> {crop.district}, {crop.state}
                      </span>
                    </td>
                    <td className="font-bold text-green-400">{formatMoney(crop.pricePerKg)}</td>
                    <td>
                      {crop.trend === 'UP' && (
                        <span className="flex items-center gap-0.5 text-green-400 font-bold text-sm">
                          <FiTrendingUp /> Upward
                        </span>
                      )}
                      {crop.trend === 'DOWN' && (
                        <span className="flex items-center gap-0.5 text-red-400 font-bold text-sm">
                          <FiTrendingDown /> Downward
                        </span>
                      )}
                      {crop.trend === 'STABLE' && (
                        <span className="flex items-center gap-0.5 text-gray-400 font-bold text-sm">
                          <FiMinus /> Stable
                        </span>
                      )}
                    </td>
                    <td className="text-right">
                      <button className="btn btn-ghost btn-sm text-green-400 font-semibold">
                        View Chart
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Historic Trend Graph */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-card p-6 rounded-lg">
            <h3 className="text-lg font-bold mb-1">Price Trend Analysis</h3>
            {selectedCrop ? (
              <div>
                <p className="text-gray-400 text-sm mb-6">Crop: <span className="text-green-400 font-bold uppercase">{selectedCrop.cropName}</span></p>
                <ChartWrapper title="Historic Rate Curve (₹/KG)" height={240}>
                  <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <XAxis dataKey="date" stroke="#95D5B2" />
                    <YAxis stroke="#95D5B2" />
                    <Tooltip formatter={(value) => `₹${value}`} />
                    <Line type="monotone" dataKey="price" stroke="#52B788" strokeWidth={3} dot={{ r: 5 }} activeDot={{ r: 8 }} />
                  </LineChart>
                </ChartWrapper>
                <div className="mt-4 p-3 bg-zinc-800/40 rounded-lg border border-zinc-800/80 text-xs text-gray-400 leading-relaxed">
                  💡 <strong>Market Intel:</strong> Prices for {selectedCrop.cropName} in {selectedCrop.district} are currently showing a {selectedCrop.trend?.toLowerCase()} path. Plan sales transactions accordingly.
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">Select a crop from the list to view historic charts.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketPrices;
