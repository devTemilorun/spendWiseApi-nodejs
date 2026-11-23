import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { updateProfileSchema, linkBankSchema } from '../validators/user.schema';
import {
  getMe,
  updateMe,
  deleteMe,
  linkBank,
} from '../controllers/user.controller';

const router = Router();

router.use(authMiddleware);

router.get('/me', getMe);
router.put('/me', validate(updateProfileSchema), updateMe);
router.delete('/me', deleteMe);
router.post('/link-bank', validate(linkBankSchema), linkBank);

export default router;