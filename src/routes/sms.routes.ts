import { Router } from 'express';
import * as smsController from '../controllers/sms.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import {
  smsWebhookLimiter,
  smsParseLimiter,
} from '../middlewares/rateLimiter.middleware';

const router = Router();

router.post(
  '/webhook',
  smsWebhookLimiter,
  smsController.handleSmsWebhook
);

router.post(
  '/parse',
  authMiddleware,
  smsParseLimiter,
  smsController.parseSmsEndpoint
);

export default router;