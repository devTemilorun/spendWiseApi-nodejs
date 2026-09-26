import { Request, Response } from 'express';
import * as notif from '../services/notification.service';
import { asyncHandler } from '../utils/asyncHandler';
import { apiResponse } from '../utils/apiResponse';
import { AppError } from '../utils/AppError';

const uid = (req: Request): string => {
  if (!req.user) throw new AppError('Not authenticated', 401);
  return req.user.userId;
};

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit } = req.query as unknown as {
    page: number;
    limit: number;
  };
  const result = await notif.listNotifications(uid(req), page, limit);
  return apiResponse(res, result, 'Notifications fetched');
});

export const markRead = asyncHandler(async (req: Request, res: Response) => {
  const updated = await notif.markAsRead(uid(req), req.params.id as string);
  if (!updated) throw new AppError('Notification not found', 404);
  return apiResponse(res, updated, 'Notification marked as read');
});