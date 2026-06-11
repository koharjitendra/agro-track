import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { FiDollarSign, FiTrendingUp, FiShoppingBag, FiActivity, FiArrowRight, FiCloudRain } from 'react-icons/fi';
import Loader from '../../../components/common/Loader.jsx';
import ChartWrapper from '../../../components/charts/ChartWrapper.jsx';
import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import * as analyticsApi from '../../../api/analytics.api.js';
import * as agronomyApi from '../../../api/agronomy.api.js';
import * as transactionsApi from '../../../api/transactions.api.js';
import { getListItems } from '../../../utils/apiPayload.js';
import { formatMoney } from '../../../utils/money.js';
import { formatDate } from '../../../utils/date.js';

const mapWeatherCode = (code) => {
  if (code === undefined || code === null) return { condition: 'Unknown', icon: '🌤️' };
  if (code === 0) return { condition: 'Sunny', icon: '☀️' };
  if ([1, 2, 3].includes(code)) return { condition: 'Cloudy', icon: '☁️' };
  if ([45, 48].includes(code)) return { condition: 'Foggy', icon: '🌫️' };
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return { condition: 'Rainy', icon: '🌧️' };
  if ([71, 73, 75, 85, 86].includes(code)) return { condition: 'Snowy', icon: '❄️' };
  if ([95, 96, 99].includes(code)) return { condition: 'Thunderstorm', icon: '⛈️' };
  return { condition: 'Partly Cloudy', icon: '🌤️' };
};

const FarmerDashboard = () => {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [breakdown, setBreakdown] = useState([]);
  const [cropPerformance, setCropPerformance] = useState([]);
  const [weather, setWeather] = useState(null);
  const [weatherError, setWeatherError] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [marketTrends, setMarketTrends] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchWeather = async (silent = false) => {
    if (!silent) setWeatherLoading(true);
    try {
      const wRes = await agronomyApi.getLiveWeather();
      if (wRes.data?.weather) {
        setWeather(wRes.data.weather);
        setWeatherError(null);
      } else {
        setWeatherError('No weather data returned from provider.');
      }
    } catch (wErr) {
      console.warn('Weather fetch failed:', wErr.message);
      const msg = wErr.message || '';
      const responseMsg = wErr.response?.data?.message || '';
      const isLocationError = wErr.response?.status === 400 || 
        msg.toLowerCase().includes('location') || 
        msg.toLowerCase().includes('coordinates') || 
        msg.toLowerCase().includes('profile') ||
        responseMsg.toLowerCase().includes('location') || 
        responseMsg.toLowerCase().includes('coordinates') || 
        responseMsg.toLowerCase().includes('profile');

      if (isLocationError) {
        setWeatherError('Weather Sync Offline: Profile coordinates not configured.');
      } else {
        setWeatherError(responseMsg || msg || 'Failed to sync live weather.');
      }
      setWeather(null);
    } finally {
      if (!silent) setWeatherLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [sumRes, breakRes, perfRes] = await Promise.all([
          analyticsApi.getFarmerProfitSummary(),
          analyticsApi.getFarmerExpenseBreakdown(),
          analyticsApi.getFarmerSalesVsExpenses()
        ]);
        setSummary(sumRes.data);
        setBreakdown(breakRes.data || []);
        setCropPerformance(perfRes.data || []);

        // Fetch Weather
        await fetchWeather();

        // Fetch Market Trends from backend
        try {
          const trendsRes = await agronomyApi.getMarketTrends();
          setMarketTrends(trendsRes.data || []);
        } catch (tErr) {
          console.warn('Market trends fetch failed:', tErr.message);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast.error(error.message || 'Failed to load dashboard.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();

    // Auto-refresh weather every 30 minutes (1,800,000 ms)
    const interval = setInterval(() => {
      fetchWeather(true);
    }, 1800000);

    return () => clearInterval(interval);
  }, []);

  if (loading) return <Loader fullPage />;

  const COLORS = ['#2D6A4F', '#40916C', '#52B788', '#74C69D', '#95D5B2', '#B7E4C7', '#D4A373', '#E76F51', '#4EA8DE', '#9B72CF'];

  const statCards = [
    { title: 'Total Revenue', value: formatMoney(summary?.totalRevenue), sub: 'From finalized transactions', icon: FiShoppingBag, color: 'green' },
    { title: 'Total Expenses', value: formatMoney(summary?.totalExpenses), sub: 'Auto-summed from crops', icon: FiDollarSign, color: 'coral' },
    { title: 'Net Profit', value: formatMoney(summary?.profit), sub: 'Revenue - Expenses', icon: FiTrendingUp, color: summary?.profit >= 0 ? 'green-bright' : 'danger', isProfit: true },
    { title: 'Active Crops', value: summary?.activeCrops || 0, sub: 'Currently growing', icon: FiActivity, color: 'info' },
    { title: 'Outstanding Due (Udhaar)', value: formatMoney(summary?.totalDue), sub: 'Pending collection', icon: FiDollarSign, color: 'amber' },
  ];

  const renderWeatherRecommendation = () => {
    if (!weather) return null;
    const { temperature_2m, precipitation_probability, windspeed_10m } = weather.current;
    
    if (precipitation_probability > 70) {
      return <div className="p-3 mb-2 bg-amber-500/20 text-amber-300 rounded border border-amber-500/50 text-sm">⚠️ Heavy rain expected. Avoid fertilizer application and harvesting today.</div>;
    }
    if (windspeed_10m > 20) {
      return <div className="p-3 mb-2 bg-amber-500/20 text-amber-300 rounded border border-amber-500/50 text-sm">⚠️ High winds. Avoid pesticide spraying — chemical drift risk.</div>;
    }
    if (temperature_2m > 36 && precipitation_probability < 20) {
      return <div className="p-3 mb-2 bg-blue-500/20 text-blue-300 rounded border border-blue-500/50 text-sm">💧 Dry and hot conditions. Consider irrigation within 48 hours.</div>;
    }
    return <div className="p-3 mb-2 bg-green-500/20 text-green-300 rounded border border-green-500/50 text-sm">✅ Conditions look good for general farming activities.</div>;
  };

  return (
    <div className="dashboard-wrapper fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Farmer Dashboard</h1>
          <p className="page-subtitle">Track your farming yields, expenses, and buyer ledger</p>
        </div>
        
        {/* Weather Widget Section */}
        {weather && (
          <div className="glass-card flex items-center gap-3 px-4 py-2 rounded-lg border border-zinc-700/60 max-h-[58px]">
            <span className="text-2xl" role="img" aria-label="weather-icon">
              {mapWeatherCode(weather.current.weather_code).icon}
            </span>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-white">{weather.current.temperature_2m}°C</span>
                <span className="text-[10px] font-semibold text-green-400 bg-green-500/10 border border-green-500/20 px-1.5 py-0.5 rounded">
                  {mapWeatherCode(weather.current.weather_code).condition}
                </span>
              </div>
              <div className="text-[10px] text-gray-400 mt-0.5">
                Humidity: {weather.current.relative_humidity_2m}% | Wind: {weather.current.windspeed_10m} km/h
              </div>
            </div>
          </div>
        )}

        {weatherError && (
          <div className="glass-card flex items-center gap-2.5 px-4 py-2 rounded-lg border border-red-500/25 bg-red-500/5 text-red-400 text-[10px] max-w-xs max-h-[58px]">
            <span className="text-base">⚠️</span>
            <div>
              <p className="font-semibold text-white">Weather Sync Offline</p>
              <p className="text-[9px] text-gray-400 mt-0.5">
                {weatherError.includes('coordinates') || weatherError.includes('profile')
                  ? 'Configure coordinates in profile'
                  : 'Weather provider unreachable'}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className={`stat-card glass-card border-accent-${card.color}`}>
              <div className="stat-card-left">
                <p className="stat-card-title">{card.title}</p>
                <p className={`stat-card-value ${card.isProfit && summary?.profit < 0 ? 'text-coral' : ''}`}>{card.value}</p>
                <p className="stat-card-subtitle">{card.sub}</p>
              </div>
              <div className="stat-card-right">
                <div className={`stat-card-icon-wrapper bg-${card.color}`}>
                  <Icon />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="dashboard-grid">
        {/* Chart Column */}
        <div className="dashboard-chart-col">
          <ChartWrapper title="Expense Breakdown by Category" height={320}>
            {breakdown.length === 0 ? (
              <div className="empty-chart-state">No expense records found.</div>
            ) : (
              <PieChart>
                <Pie
                  data={breakdown}
                  dataKey="total"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  label={({ category, percent }) => `${category || ''} (${(percent * 100).toFixed(0)}%)`}
                >
                  {breakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatMoney(value)} />
                <Legend />
              </PieChart>
            )}
          </ChartWrapper>
        </div>

        <div className="dashboard-table-col glass-card">
          <div className="dashboard-card-header">
            <h2 className="dashboard-card-title">Crop Performance</h2>
            <Link to="/farmer/crop-cycles" className="btn btn-ghost btn-sm">
              View All <FiArrowRight className="ml-1" />
            </Link>
          </div>
          
          {renderWeatherRecommendation()}

          <div className="table-container mt-4">
            {cropPerformance.length === 0 ? (
              <p className="empty-text">No crop performance data.</p>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Crop</th>
                    <th>Expenses</th>
                    <th>Revenue</th>
                    <th>Profit</th>
                  </tr>
                </thead>
                <tbody>
                  {cropPerformance.map((perf) => (
                    <tr key={perf.cropCycleId} className="cursor-pointer hover:bg-zinc-800/30" onClick={() => navigate(`/farmer/crop-cycles/${perf.cropCycleId}`)}>
                      <td className="font-bold">{perf.cropName} {perf.seasonYear ? `(${perf.seasonYear})` : ''}</td>
                      <td className="text-red-400">{formatMoney(perf.totalExpenses)}</td>
                      <td className="text-green-400">{formatMoney(perf.totalSales)}</td>
                      <td>
                        <span className={`font-bold ${perf.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {formatMoney(perf.profit)} {perf.profit >= 0 ? '✅' : '❌'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      <div className="glass-card p-6 mt-6">
        <h2 className="dashboard-card-title mb-4">Market Demand & Intelligence Trends</h2>
        {marketTrends.length === 0 ? (
          <p className="empty-text">No market intelligence data available yet. Please complete some orders.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {marketTrends.map((trend, idx) => (
              <div key={idx} className="p-4 bg-zinc-800/40 rounded-lg border border-zinc-700/50 flex flex-col gap-1">
                <h3 className="font-bold text-gray-200 text-lg">{trend.category}</h3>
                <div className="flex justify-between text-sm mt-2">
                  <span className="text-gray-400">Weekly Demand:</span>
                  <span className="font-semibold text-gray-200">{trend.weeklyDemand} orders</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Previous Week:</span>
                  <span className="font-semibold text-gray-200">{trend.prevWeekDemand} orders</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Demand Trend:</span>
                  <span className={`font-bold capitalize ${
                    trend.demandTrend === 'rising' ? 'text-green-400' :
                    trend.demandTrend === 'falling' ? 'text-red-400' :
                    'text-gray-400'
                  }`}>{trend.demandTrend}</span>
                </div>
                <div className="flex justify-between text-sm mt-2 pt-2 border-t border-zinc-700/50">
                  <span className="text-gray-400 font-medium">Avg Price Paid (30d):</span>
                  <span className="font-bold text-green-400">
                    {typeof trend.avgPricePaid === 'number' ? formatMoney(trend.avgPricePaid) : trend.avgPricePaid}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FarmerDashboard;
