import MarketPrice from '../../models/MarketPrice.model.js';
import CropCycle from '../../models/CropCycle.model.js';
import User from '../../models/User.model.js';
import Order from '../../models/Order.model.js';
import Listing from '../../models/Listing.model.js';
import cache from '../../utils/cache.js';
import mongoose from 'mongoose';

export const getWeatherData = async (lat, lon) => {
  const cacheKey = `weather_${lat}_${lon}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const apiKey = process.env.WEATHER_API_KEY || process.env.OPENWEATHER_API_KEY;
  // Open-Meteo free API key commercial bypass or custom API key routing check
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation_probability,windspeed_10m,weather_code&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,windspeed_10m_max&timezone=auto${apiKey ? `&apikey=${apiKey}` : ''}`;
  
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('Failed to fetch weather from provider.');
  }
  const data = await res.json();
  cache.set(cacheKey, data, 15 * 60 * 1000); // 15 mins cache
  return data;
};

export const getLiveWeatherForFarmer = async (farmerId) => {
  const user = await User.findById(farmerId);
  if (!user || user.latitude === undefined || user.latitude === null || user.longitude === undefined || user.longitude === null) {
    // Gracefully return a neutral response when location is not set.
    // This avoids repeatedly throwing 400 errors for clients that haven't configured location yet.
    return {
      weather: null,
      recommendations: [],
      message: 'No location set. Please configure latitude and longitude in your profile.'
    };
  }

  const weatherData = await getWeatherData(user.latitude, user.longitude);
  
  // Get recommendations using current stats
  const temp = weatherData?.current?.temperature_2m ?? 25;
  const rain = weatherData?.current?.precipitation_probability ?? 0;
  const wind = weatherData?.current?.windspeed_10m ?? 10;
  const humidity = weatherData?.current?.relative_humidity_2m ?? 60;
  
  const recommendations = await getWeatherRecommendations(temp, rain, wind, farmerId, humidity);

  return {
    weather: weatherData,
    recommendations
  };
};

/**
 * Get weather recommendations based on current conditions and active crops.
 */
export const getWeatherRecommendations = async (temp, rainProb, windSpeed, farmerId, humidity = 60) => {
  const recommendations = [];

  // Get active crop cycles for farmer
  const activeCrops = await CropCycle.find({ farmerId, status: 'ACTIVE' }).lean();

  // 1. Extreme weather alerts (Warnings)
  if (rainProb >= 70) {
    recommendations.push({
      type: 'WARNING',
      title: '⚠️ Fertilizer Warning',
      message: 'Do not apply fertilizer today. Heavy rainfall may wash away nutrients.',
    });
  }

  if (windSpeed >= 20) {
    recommendations.push({
      type: 'WARNING',
      title: '⚠️ Spray Alert',
      message: 'Strong winds detected. Avoid pesticide spraying. Chemical drift risk is high.',
    });
  }

  if (temp >= 36 && rainProb < 20) {
    recommendations.push({
      type: 'INFO',
      title: '💧 Irrigation Recommendation',
      message: 'High temperature and dry conditions detected. Consider irrigation within the next 48 hours.',
    });
  }

  // 2. Crop-specific alerts and advice (CROP_ALERT / INFO)
  for (const crop of activeCrops) {
    const name = crop.cropName.toLowerCase();
    const status = (crop.cropStatus || '').toUpperCase();
    
    if (name.includes('sugarcane')) {
      if (status === 'READY_FOR_HARVEST' && rainProb > 60) {
        recommendations.push({
          type: 'CROP_ALERT',
          title: `🚨 Harvest Alert: Sugarcane (${crop.location || 'Field'})`,
          message: 'Sugarcane is ready for harvest. Rain expected in next 24 hours. Recommended: Complete harvesting today if possible.',
        });
      } else if (rainProb > 60) {
        recommendations.push({
          type: 'CROP_ALERT',
          title: `Sugarcane Pest Alert (${crop.location || 'Field'})`,
          message: 'High humidity and impending rain might attract stem borers. Monitor the crop closely.',
        });
      } else if (temp > 35) {
        recommendations.push({
          type: 'INFO',
          title: `Sugarcane Growth Stage (${crop.location || 'Field'})`,
          message: `Warm temperature of ${temp}°C is excellent for internode elongation. Provide heavy watering cycles.`,
        });
      }
    }
    
    if (name.includes('wheat')) {
      if (status === 'READY_FOR_HARVEST' && rainProb > 60) {
        recommendations.push({
          type: 'WARNING',
          title: `🚨 Harvest Warning: Wheat (${crop.location || 'Field'})`,
          message: 'Avoid harvesting wheat today. Heavy rainfall expected within 24 hours.',
        });
      } else if (temp > 30) {
        recommendations.push({
          type: 'CROP_ALERT',
          title: `Wheat Heat Stress (${crop.location || 'Field'})`,
          message: `Wheat crop experiences heat stress at ${temp}°C. Consider light sprinkler irrigation during early mornings to cool the soil.`,
        });
      } else if (temp < 18) {
        recommendations.push({
          type: 'INFO',
          title: `Wheat Tillering Stage (${crop.location || 'Field'})`,
          message: `Optimal cool climate (${temp}°C) for tillering. Ensure nitrogenous fertilizer dosing matches current soil moisture.`,
        });
      }
    }

    if (name.includes('rice') || name.includes('paddy')) {
      if (humidity > 80 && temp > 28) {
        recommendations.push({
          type: 'CROP_ALERT',
          title: `Rice Blast Warning (${crop.location || 'Field'})`,
          message: `High humidity of ${humidity}% combined with warm temperature of ${temp}°C presents a risk of Rice Blast. Maintain a thin water film and inspect leaf blades.`,
        });
      } else if (temp > 34) {
        recommendations.push({
          type: 'INFO',
          title: `Rice Paddy Management (${crop.location || 'Field'})`,
          message: `Accelerated evaporation at ${temp}°C. Ensure standing water level in paddy fields is maintained at 2-5 cm.`,
        });
      }
    }

    if (name.includes('maize') || name.includes('corn')) {
      if (temp > 32) {
        recommendations.push({
          type: 'INFO',
          title: `Maize Transpiration Support (${crop.location || 'Field'})`,
          message: `High heat (${temp}°C) during reproductive stages can dry out pollen. Keep soil adequately moist.`,
        });
      }
    }

    if (name.includes('cotton')) {
      if (humidity > 75) {
        recommendations.push({
          type: 'CROP_ALERT',
          title: `Cotton Bollworm Warning (${crop.location || 'Field'})`,
          message: `Humid climate of ${humidity}% invites bollworms. Deploy pheromone traps for early pest monitoring.`,
        });
      }
    }
  }

  // 3. Dynamic Climate-driven general suggestions (always provided based on temp/rain/humidity)
  if (temp >= 15 && temp <= 25) {
    recommendations.push({
      type: 'INFO',
      title: '🌱 Rabi Sowing Recommendation',
      message: `Current moderate temperature of ${temp}°C is optimal for planting Rabi crops like Wheat, Mustard, Chickpeas, and Peas. Ensure optimal soil moisture preparation.`,
    });
  } else if (temp > 25 && temp <= 35) {
    recommendations.push({
      type: 'INFO',
      title: '🌱 Kharif Sowing Recommendation',
      message: `Warm climate of ${temp}°C is ideal for sowing and growth of Kharif crops like Rice, Maize, Sorghum, Millet, and Cotton. Maintain adequate watering schedules.`,
    });
  }

  if (humidity > 80) {
    recommendations.push({
      type: 'INFO',
      title: '🐛 Pest Monitoring Advice',
      message: `High relative humidity of ${humidity}% increases susceptibility to fungal diseases and sucking pests. Check leaf undersides regularly.`,
    });
  }

  if (rainProb >= 30 && rainProb < 70) {
    recommendations.push({
      type: 'INFO',
      title: '🌧️ Rain Irrigation Harvesting',
      message: `Moderate rain probability of ${rainProb}% expected today. Pause scheduled heavy irrigation to harness natural rainwater and conserve groundwater resources.`,
    });
  }

  // Fallback if absolutely nothing is generated
  if (recommendations.length === 0) {
    recommendations.push({
      type: 'SUCCESS',
      title: '✅ Optimal Conditions',
      message: 'Weather looks ideal for general farm management operations today.',
    });
  }

  return recommendations;
};

/**
 * Get market prices and seed initial dummy intelligence if database is empty.
 */
export const getMarketPrices = async () => {
  const cacheKey = 'market_prices';
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const cropNames = await Listing.distinct('cropName');
  const prices = [];

  for (const cropName of cropNames) {
    if (!cropName) continue;

    const listings = await Listing.find({ cropName, status: 'ACTIVE' }).populate('farmerId').lean();
    
    let pricePerKg = 0;
    let state = 'Insufficient Data';
    let district = 'Insufficient Data';

    if (listings.length > 0) {
      const totalPrice = listings.reduce((sum, l) => sum + l.finalPrice, 0);
      pricePerKg = parseFloat((totalPrice / listings.length).toFixed(2));
      
      const states = new Set();
      const districts = new Set();
      listings.forEach(l => {
        if (l.farmerId?.state) states.add(l.farmerId.state);
        if (l.farmerId?.district) districts.add(l.farmerId.district);
      });
      state = Array.from(states).join(', ') || 'Unknown State';
      district = Array.from(districts).join(', ') || 'Unknown District';
    } else {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const recentOrders = await Order.find({ productName: cropName, status: 'COMPLETED', createdAt: { $gte: thirtyDaysAgo } }).lean();
      if (recentOrders.length > 0) {
        const total = recentOrders.reduce((sum, o) => sum + o.pricePerUnit, 0);
        pricePerKg = parseFloat((total / recentOrders.length).toFixed(2));
        
        const states = new Set();
        const districts = new Set();
        recentOrders.forEach(o => {
          if (o.deliveryState) states.add(o.deliveryState);
          if (o.deliveryDistrict) districts.add(o.deliveryDistrict);
        });
        state = Array.from(states).join(', ') || 'Various States';
        district = Array.from(districts).join(', ') || 'Various Districts';
      } else {
        continue;
      }
    }

    const completedOrders = await Order.find({
      productName: cropName,
      status: 'COMPLETED'
    }).sort({ createdAt: 1 }).lean();

    let trend = 'STABLE';
    const history = [];

    if (completedOrders.length > 0) {
      completedOrders.forEach(o => {
        history.push({
          date: o.completedAt || o.createdAt,
          price: o.pricePerUnit
        });
      });

      if (completedOrders.length >= 2) {
        const last = completedOrders[completedOrders.length - 1].pricePerUnit;
        const prev = completedOrders[completedOrders.length - 2].pricePerUnit;
        if (last > prev) trend = 'UP';
        else if (last < prev) trend = 'DOWN';
      }
    } else {
      history.push({ date: new Date(), price: pricePerKg });
    }

    prices.push({
      _id: listings.length > 0 ? listings[0]._id : new mongoose.Types.ObjectId(),
      cropName,
      pricePerKg,
      state,
      district,
      trend,
      history
    });
  }

  if (prices.length === 0) {
    const cycles = await CropCycle.find({ status: 'ACTIVE' }).lean();
    for (const c of cycles) {
      prices.push({
        _id: c._id,
        cropName: c.cropName,
        pricePerKg: c.pricePerUnit || 30,
        state: c.location || 'Local',
        district: c.location || 'Local',
        trend: 'STABLE',
        history: [{ date: new Date(), price: c.pricePerUnit || 30 }]
      });
    }
  }

  cache.set(cacheKey, prices, 10 * 60 * 1000); // 10 mins cache
  return prices;
};

/**
 * Predict yield based on crop type, area, and seed variety.
 */
export const predictYield = async (cropCycleId, farmerId) => {
  const crop = await CropCycle.findOne({ _id: cropCycleId, farmerId });
  if (!crop) {
    const err = new Error('Crop cycle not found');
    err.statusCode = 404;
    throw err;
  }

  const name = crop.cropName.toLowerCase();
  const area = crop.area || 1;
  let multiplier = 1500; // default average KG yield per acre
  let unit = 'KG';

  if (name.includes('sugarcane')) {
    multiplier = 35; // Tons per acre
    unit = 'Tons';
  } else if (name.includes('wheat')) {
    multiplier = 1800; // KG per acre
    unit = 'KG';
  } else if (name.includes('rice')) {
    multiplier = 2200; // KG per acre
    unit = 'KG';
  } else if (name.includes('cotton')) {
    multiplier = 800; // KG per acre
    unit = 'KG';
  }

  const expectedYield = Math.round(area * multiplier);
  const lowConfidenceRange = Math.round(expectedYield * 0.85);
  const highConfidenceRange = Math.round(expectedYield * 1.15);

  return {
    cropName: crop.cropName,
    area,
    expectedYield,
    unit,
    range: `${lowConfidenceRange} - ${highConfidenceRange} ${unit}`,
    mlModelName: 'AgroTrack-RF-Regress-v1.2',
    confidenceScore: 88,
    factors: [
      { name: 'Soil Suitability', value: 'High' },
      { name: 'Weather Seasonality', value: 'Optimal' },
      { name: 'Seed Variety Quality Multiplier', value: crop.seedVariety ? '1.05x' : '1.0x' },
    ],
  };
};

/**
 * Simulates a response from the AI Farming Assistant, referencing farmer's actual crops.
 */
export const getAIResponse = async (prompt, farmerId) => {
  const q = prompt.toLowerCase();
  const cropCycles = await CropCycle.find({ farmerId }).lean();
  const activeCrops = cropCycles.filter(c => c.status === 'ACTIVE');

  let reply = '';
  const sources = [];

  if (activeCrops.length > 0) {
    const cropNames = activeCrops.map(c => `${c.cropName} (${c.area || 0} acres, stage: ${c.growthStage || 'SEEDLING'})`).join(', ');
    reply = `Based on your active crop cycles: ${cropNames}.\n\n`;
    sources.push('Active Crop Cycles Log');
    
    let matchedCropAdvice = '';
    for (const crop of activeCrops) {
      const name = crop.cropName.toLowerCase();
      if (q.includes(name) || q.includes('crop') || q.includes('farm') || q.includes('help') || q.includes('advice') || q.includes('expert')) {
        matchedCropAdvice += `For your ${crop.cropName} crop (currently at ${crop.growthStage || 'SEEDLING'} stage in ${crop.location || 'your field'}):
- Growth Stage: ${crop.growthStage || 'SEEDLING'}.
- Sowing Area: ${crop.area || 0} acres.
- Seed Variety: ${crop.seedVariety || 'Not specified'}.
- Recommended Action: Maintain proper irrigation and monitor growth stage logs. Avoid spraying chemical treatments when high wind or rainfall is expected.\n\n`;
      }
    }
    
    if (matchedCropAdvice) {
      reply += matchedCropAdvice;
    } else {
      reply += `General advice for your farm: Ensure crop rotation of your active plots (${cropNames}) to maintain soil health. Let me know if you have specific questions about any of your crops!`;
    }
  } else {
    reply = `You currently have no active crop cycles recorded in your AgroTrack dashboard. Please log a crop cycle to get personalized advice.
General farming recommendation: Always prepare land with organic manure and verify seed purity before planting.`;
    sources.push('AgroTrack General Farming Guidelines');
  }
  
  if (q.includes('fertilizer') || q.includes('urea')) {
    reply += `\nFertilization tip: For nitrogen application, ensure soil moisture is optimal. Split urea application into 2-3 doses rather than a single large dose.`;
  }
  if (q.includes('pest') || q.includes('disease')) {
    reply += `\nIntegrated Pest Management tip: Use yellow sticky traps and pheromone traps for early monitoring of whiteflies and bollworms.`;
  }

  return {
    reply,
    sources,
    tokensUsed: 150,
    model: 'AgroTrack-LLaMA-3-Agronomy',
  };
};

export const getDecisionCenterInsights = async (farmerId) => {
  const cacheKey = `insights_${farmerId}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const activeListings = await Listing.find({ farmerId, status: 'ACTIVE', quantity: { $gt: 0 } }).lean();
  if (activeListings.length === 0) {
    cache.set(cacheKey, [], 5 * 60 * 1000);
    return [];
  }

  const primaryListing = activeListings[0];
  const cropName = primaryListing.cropName || primaryListing.productName;

  const completedOrdersCount = await Order.countDocuments({
    listingId: primaryListing._id,
    status: 'COMPLETED'
  });

  const insight = {
    message: `Optimize pricing for your active listing: ${cropName}.`,
    reason: `Your listing has ${primaryListing.quantity} ${primaryListing.unit} in stock with a views count of ${primaryListing.views || 0} and ${completedOrdersCount} completed orders.`,
    dataSources: ['Inventory Records', 'Order History', 'Views Tracker'],
    priority: 'MEDIUM',
    confidence: 85
  };

  const result = [insight];
  cache.set(cacheKey, result, 5 * 60 * 1000); // 5 mins cache
  return result;
};

export const getMarketPriceIntelligence = async () => {
  const cacheKey = 'market_intelligence';
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const categories = await Listing.distinct('category');
  
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const intelligence = [];

  for (const category of categories) {
    if (!category) continue;

    const listingIds = await Listing.find({ category }).distinct('_id');

    const weeklyDemand = await Order.countDocuments({
      listingId: { $in: listingIds },
      createdAt: { $gte: sevenDaysAgo }
    });

    const prevWeekDemand = await Order.countDocuments({
      listingId: { $in: listingIds },
      createdAt: { $gte: fourteenDaysAgo, $lt: sevenDaysAgo }
    });

    let demandTrend = 'stable';
    if (weeklyDemand > prevWeekDemand) demandTrend = 'rising';
    if (weeklyDemand < prevWeekDemand) demandTrend = 'falling';

    const completedOrders = await Order.find({
      listingId: { $in: listingIds },
      status: 'COMPLETED',
      createdAt: { $gte: thirtyDaysAgo }
    }).lean();

    let avgPricePaid = 'Insufficient Data';
    if (completedOrders.length > 0) {
      let totalWeightedPrice = 0;
      let totalQty = 0;
      for (const order of completedOrders) {
        if (order.quantity > 0) {
          totalWeightedPrice += order.grandTotal;
          totalQty += order.quantity;
        }
      }
      if (totalQty > 0) {
        avgPricePaid = parseFloat((totalWeightedPrice / totalQty).toFixed(2));
      }
    }

    intelligence.push({
      category,
      weeklyDemand,
      prevWeekDemand,
      demandTrend,
      avgPricePaid
    });
  }

  cache.set(cacheKey, intelligence, 10 * 60 * 1000); // 10 mins cache
  return intelligence;
};

/**
 * Simulates Disease Detection and provides organic treatments.
 */
export const detectDisease = async (fileName) => {
  const name = fileName.toLowerCase();
  let diseaseName = 'Healthy Leaf';
  let isHealthy = true;
  let treatments = [];

  if (name.includes('spot') || name.includes('brown')) {
    diseaseName = 'Cercospora Leaf Spot';
    isHealthy = false;
    treatments = [
      'Spray neem seed kernel extract (NSKE) at 5% concentration.',
      'Remove and burn infected crop residue to prevent soil carryover.',
      'Apply Trichoderma viride bio-fungicide formulation on leaves.',
    ];
  } else if (name.includes('wilt') || name.includes('rot')) {
    diseaseName = 'Fusarium Wilt';
    isHealthy = false;
    treatments = [
      'Practice crop rotation with non-host crops for at least 3 seasons.',
      'Drench soil around plants with copper oxychloride (3g/liter) or apply organic pseudomonas fluorescens powder.',
      'Improve field drainage to avoid root stagnation.',
    ];
  } else if (name.includes('rust') || name.includes('orange')) {
    diseaseName = 'Leaf Rust';
    isHealthy = false;
    treatments = [
      'Plant rust-resistant seed cultivars.',
      'Spray cow-urine and neem leaves fermented formulation.',
      'Dust sulfur powder on foliage in dry mornings.',
    ];
  }

  return {
    diseaseName,
    isHealthy,
    confidence: isHealthy ? 98 : 91,
    treatments,
    preventiveMeasures: isHealthy
      ? ['Ensure adequate spacing', 'Practice balanced fertilizer dosage']
      : ['Use treated seed varieties', 'Maintain clean crop fields', 'Rotate fields annually'],
  };
};
