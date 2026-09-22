import { Request, Response } from 'express';
import * as authService from '../services/auth.service';
import { asyncHandler } from '../utils/asyncHandler';
import { apiResponse } from '../utils/apiResponse';
import { AppError } from '../utils/AppError';

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

export const me = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError('Not authenticated', 401);
  return apiResponse(res, { userId: req.user.userId, email: req.user.email }, 'OK');
});