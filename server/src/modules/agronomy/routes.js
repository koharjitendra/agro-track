import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middlewares/validate.middleware.js';
import * as agronomyController from './controller.js';

const router = Router();

const aiQuerySchema = z.object({
  prompt: z.string().min(1, 'Prompt is required'),
});

router.get('/weather-recommendations', agronomyController.getWeatherDecisions);
router.get('/market-prices', agronomyController.getMarketPriceIntelligence);
router.get('/weather', agronomyController.getWeather);
router.get('/market-trends', agronomyController.getMarketTrends);
router.get('/insights', agronomyController.getInsights);
router.get('/decision-center', agronomyController.getInsights);
router.get('/crop-cycles/:cropCycleId/predict-yield', agronomyController.getYieldPrediction);
router.post('/ai/chat', validate(aiQuerySchema), agronomyController.queryAI);
router.post('/ai/disease-detect', agronomyController.detectDisease);

export default router;
