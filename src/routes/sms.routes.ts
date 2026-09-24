import { Router } from 'express';
import * as smsController from '../controllers/sms.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.post('/parse', smsController.parseSmsEndpoint);

export default router;