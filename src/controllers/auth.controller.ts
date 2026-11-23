import { Request, Response } from 'express';
import * as authService from '../services/auth.service';
import { asyncHandler } from '../utils/asyncHandler';
import { apiResponse } from '../utils/apiResponse';
import { AppError } from '../utils/AppError';
import { User } from '../models/User.model';

export const register = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.register(req.body);
  return apiResponse(res, result, 'Registered successfully', 201);
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.login(req.body);
  return apiResponse(res, result, 'Login successful');
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  const tokens = await authService.refresh(refreshToken);
  return apiResponse(res, tokens, 'Token refreshed');
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError('Not authenticated', 401);
  const result = await authService.logout(req.user.userId);
  return apiResponse(res, result, 'Logged out');
});

export const changePassword = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) throw new AppError('Not authenticated', 401);
    const result = await authService.changePassword(req.user.userId, req.body);
    return apiResponse(res, result, 'Password changed');
  }
);

export const forgotPasswordController = asyncHandler(
  async (req: Request, res: Response) => {
    const rawToken = await authService.forgotPassword(req.body.email);
    // Never leak whether the email exists.
    const payload: Record<string, unknown> = {};
    if (rawToken && process.env.NODE_ENV !== 'production') {
      payload.resetToken = rawToken; // dev/test convenience 
    }
    return apiResponse(
      res,
      payload,
      'If that email exists, a reset link has been sent'
    );
  }
);

export const resetPasswordController = asyncHandler(
  async (req: Request, res: Response) => {
    await authService.resetPassword(req.body.token, req.body.newPassword);
    return apiResponse(res, null, 'Password reset successful');
  }
);

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError('Not authenticated', 401);
  const user = await User.findById(req.user.userId);
  if (!user) throw new AppError('User not found', 404);
  return apiResponse(res, user, 'Profile fetched');
});