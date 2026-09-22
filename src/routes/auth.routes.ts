import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { validate } from '../middlewares/validate.middleware';
import { authMiddleware } from '../middlewares/auth.middleware';
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  changePasswordSchema,
} from '../validators/auth.schema';

const router = Router();

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh', validate(refreshSchema), authController.refresh);
router.post('/logout', authMiddleware, authController.logout);
router.post(
  '/change-password',
  authMiddleware,
  validate(changePasswordSchema),
  authController.changePassword
);
router.get('/me', authMiddleware, authController.me);

export default router;