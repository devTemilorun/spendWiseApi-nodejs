import { Router } from 'express';
import * as analyticsController from '../controllers/analytics.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  monthQuerySchema,
  trendQuerySchema,
  compareQuerySchema,
  topMerchantsQuerySchema,
} from '../validators/analytics.schema';

const router = Router();

router.use(authMiddleware);

router.get(
  '/monthly',
  validate(monthQuerySchema, 'query'),
  analyticsController.monthlySummary
);
router.get(
  '/category-breakdown',
  validate(monthQuerySchema, 'query'),
  analyticsController.categoryBreakdown
);
router.get(
  '/trend',
  validate(trendQuerySchema, 'query'),
  analyticsController.spendingTrend
);
router.get(
  '/compare',
  validate(compareQuerySchema, 'query'),
  analyticsController.compare
);
router.get(
  '/top-merchants',
  validate(topMerchantsQuerySchema, 'query'),
  analyticsController.topMerchants
);
router.get(
  '/alerts',
  validate(monthQuerySchema, 'query'),
  analyticsController.alerts
);

export default router;