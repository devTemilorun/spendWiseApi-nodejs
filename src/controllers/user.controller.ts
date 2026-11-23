import { Request, Response } from 'express';
import * as userService from '../services/user.service';
import { asyncHandler } from '../utils/asyncHandler';
import { apiResponse } from '../utils/apiResponse';
import { AppError } from '../utils/AppError';

const uid = (req: Request): string => {
  if (!req.user) throw new AppError('Not authenticated', 401);
  return req.user.userId;
};

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.getProfile(uid(req));
  return apiResponse(res, user, 'Profile fetched');
});

export const updateMe = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.updateProfile(uid(req), req.body);
  return apiResponse(res, user, 'Profile updated');
});

export const deleteMe = asyncHandler(async (req: Request, res: Response) => {
  await userService.deleteAccount(uid(req));
  return apiResponse(res, null, 'Account deleted');
});

export const linkBank = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.linkBank(uid(req), req.body.bank);
  return apiResponse(res, user, 'Bank linked');
});