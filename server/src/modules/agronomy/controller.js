import { success } from '../../utils/apiResponse.js';
import * as agronomyService from './service.js';

export const getWeatherDecisions = async (req, res, next) => {
  try {
    const { temp, rainProb, windSpeed } = req.query;
    const recommendations = await agronomyService.getWeatherRecommendations(
      parseFloat(temp || 25),
      parseFloat(rainProb || 0),
      parseFloat(windSpeed || 10),
      req.user.id
    );
    return success(res, recommendations, 'Weather recommendations generated.');
  } catch (err) {
    next(err);
  }
};

export const getMarketPriceIntelligence = async (req, res, next) => {
  try {
    const prices = await agronomyService.getMarketPrices();
    return success(res, prices, 'Market prices fetched.');
  } catch (err) {
    next(err);
  }
};

export const getYieldPrediction = async (req, res, next) => {
  try {
    const prediction = await agronomyService.predictYield(req.params.cropCycleId, req.user.id);
    return success(res, prediction, 'Yield prediction complete.');
  } catch (err) {
    next(err);
  }
};

export const queryAI = async (req, res, next) => {
  try {
    const { prompt } = req.body;
    const aiResponse = await agronomyService.getAIResponse(prompt, req.user.id);
    return success(res, aiResponse, 'AI response fetched.');
  } catch (err) {
    next(err);
  }
};

export const getWeather = async (req, res, next) => {
  try {
    const data = await agronomyService.getLiveWeatherForFarmer(req.user.id);
    return success(res, data, 'Live weather and agronomy suggestions fetched.');
  } catch (err) {
    next(err);
  }
};

export const getMarketTrends = async (req, res, next) => {
  try {
    const data = await agronomyService.getMarketPriceIntelligence();
    return success(res, data, 'Market trends intelligence fetched.');
  } catch (err) {
    next(err);
  }
};

export const getInsights = async (req, res, next) => {
  try {
    const data = await agronomyService.getDecisionCenterInsights(req.user.id);
    return success(res, data, 'Decision Center insights fetched.');
  } catch (err) {
    next(err);
  }
};

export const detectDisease = async (req, res, next) => {
  try {
    const fileName = req.file ? req.file.originalname : (req.body.fileName || 'leaf.jpg');
    const result = await agronomyService.detectDisease(fileName);
    return success(res, result, 'Disease analysis complete.');
  } catch (err) {
    next(err);
  }
};
