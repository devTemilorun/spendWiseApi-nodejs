import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { validate } from '../middlewares/validate.middleware';
import { authMiddleware } from '../middlewares/auth.middleware';
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  changePasswordSchema,
  resetPasswordSchema,
  forgotPasswordSchema,
} from '../validators/auth.schema';
import { authLimiter } from '../middlewares/rateLimiter.middleware';
import { forgotPasswordController, resetPasswordController } from '../controllers/auth.controller';



const router = Router();

router.post('/register', authLimiter, validate(registerSchema), authController.register);
router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.post('/refresh', validate(refreshSchema), authController.refresh);
router.post('/logout', authMiddleware, authController.logout);
router.post(
  '/change-password',
  authMiddleware,
  validate(changePasswordSchema),
  authController.changePassword
);
router.post(
  '/forgot-password',
  authLimiter,
  validate(forgotPasswordSchema),
  forgotPasswordController
);

router.post(
  '/reset-password',
  authLimiter,
  validate(resetPasswordSchema),
  resetPasswordController
);

export default router;