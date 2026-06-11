import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { FiCloudRain, FiWind, FiThermometer, FiActivity, FiAlertCircle } from 'react-icons/fi';
import Loader from '../../../components/common/Loader.jsx';
import * as agronomyApi from '../../../api/agronomy.api.js';

const WeatherSupport = () => {
  const [weather, setWeather] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const fetchWeatherData = async () => {
      try {
        setLoading(true);
        setErrorMsg('');
        const res = await agronomyApi.getLiveWeather();
        setWeather(res.data.weather);
        setRecommendations(res.data.recommendations);
      } catch (err) {
        const msg = err.response?.data?.message || err.message || 'Failed to load weather decision support.';
        setErrorMsg(msg);
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    };
    fetchWeatherData();
  }, []);

  if (loading) return <Loader fullPage />;

  return (
    <div className="weather-support-page fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Decision Support Center</h1>
          <p className="page-subtitle">Smart farming recommendations based on weather forecast and active crop cycles</p>
        </div>
      </div>

      {errorMsg ? (
        <div className="glass-card p-8 text-center rounded-lg border border-red-500/30 max-w-xl mx-auto mt-8">
          <FiAlertCircle className="mx-auto text-red-400 text-5xl mb-4" />
          <h3 className="text-xl font-bold text-gray-200 mb-2">Location Not Configured</h3>
          <p className="text-gray-400 text-sm leading-relaxed">{errorMsg}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Weather Status Card */}
          <div className="lg:col-span-1 space-y-6">
            <div className="glass-card p-6 rounded-lg text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <FiCloudRain size={120} />
              </div>
              <h3 className="text-xl font-bold mb-4">Today's Weather</h3>
              {weather ? (
                <div className="space-y-4">
                  <div className="text-5xl font-extrabold text-green-400">
                    {weather.current?.temperature_2m}°C
                  </div>
                  <p className="text-gray-400 text-sm">{weather.timezone || 'Your Stored Location'}</p>
                  <div className="grid grid-cols-3 gap-2 pt-4 border-t border-zinc-800 text-sm">
                    <div>
                      <FiThermometer className="mx-auto text-gray-500 mb-1" />
                      <p className="text-gray-400 text-xs">Humidity</p>
                      <p className="font-bold text-gray-200">{weather.current?.relative_humidity_2m}%</p>
                    </div>
                    <div>
                      <FiCloudRain className="mx-auto text-gray-500 mb-1" />
                      <p className="text-gray-400 text-xs">Rain Prob</p>
                      <p className="font-bold text-gray-200">{weather.current?.precipitation_probability}%</p>
                    </div>
                    <div>
                      <FiWind className="mx-auto text-gray-500 mb-1" />
                      <p className="text-gray-400 text-xs">Wind</p>
                      <p className="font-bold text-gray-200">{weather.current?.windspeed_10m} km/h</p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-sm">Weather data unavailable</p>
              )}
            </div>

            {/* 5 Day Forecast summary */}
            <div className="glass-card p-6 rounded-lg">
              <h3 className="text-lg font-bold mb-4">Weekly Forecast</h3>
              {weather?.daily ? (
                <div className="space-y-3">
                  {weather.daily.time.slice(0, 5).map((date, i) => (
                    <div key={date} className="flex justify-between items-center text-sm py-2 border-b border-zinc-800/50 last:border-0">
                      <span className="font-semibold text-gray-400">
                        {new Date(date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                      </span>
                      <span className="text-gray-200 font-medium">
                        {weather.daily.temperature_2m_min[i]}° - {weather.daily.temperature_2m_max[i]}°C
                      </span>
                      <span className="text-blue-400 font-bold flex items-center gap-0.5">
                        🌧 {weather.daily.precipitation_probability_max[i]}%
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">Forecast unavailable</p>
              )}
            </div>
          </div>

          {/* AI Recommendations */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-card p-6 rounded-lg">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <FiActivity className="text-green-400" /> Actionable Agronomy Warnings & Alerts
              </h3>
              <div className="space-y-4">
                {recommendations.length === 0 ? (
                  <div className="p-4 bg-green-500/10 text-green-400 rounded-lg border border-green-500/20 text-center">
                    All systems optimal! No immediate weather risks detected.
                  </div>
                ) : (
                  recommendations.map((rec, i) => (
                    <div 
                      key={i} 
                      className={`p-4 rounded-lg border flex gap-3 ${
                        rec.type === 'WARNING' ? 'bg-red-500/10 border-red-500/20 text-red-300' :
                        rec.type === 'CROP_ALERT' ? 'bg-amber-500/10 border-amber-500/20 text-amber-300' :
                        'bg-blue-500/10 border-blue-500/20 text-blue-300'
                      }`}
                    >
                      <FiAlertCircle className="text-2xl shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-bold text-gray-100">{rec.title}</h4>
                        <p className="text-sm mt-1 text-gray-300 leading-relaxed">{rec.message}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="glass-card p-6 rounded-lg">
              <h3 className="text-lg font-bold mb-3">Irrigation & Sprinkler Schedules</h3>
              <p className="text-gray-400 text-sm leading-relaxed mb-4">
                Based on evapotranspiration estimates, crops growing in sandy clay soils require water replenishment every 4-5 days. With the current warm winds and low cloud coverage, consider scheduling sprinkler runs early in the morning (5:00 AM - 8:00 AM) to limit evaporative loss.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WeatherSupport;
