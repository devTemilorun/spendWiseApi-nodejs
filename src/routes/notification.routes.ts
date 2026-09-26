import { Router } from 'express';
import * as notifController from '../controllers/notification.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { listNotificationsQuerySchema } from '../validators/notification.schema';

const router = Router();

router.use(authMiddleware);

router.get(
  '/',
  validate(listNotificationsQuerySchema, 'query'),
  notifController.list
);
router.patch('/:id/read', notifController.markRead);

export default router;