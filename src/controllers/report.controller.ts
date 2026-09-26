import { Request, Response } from 'express';
import { generateMonthlyReport } from '../services/report.service';
import { asyncHandler } from '../utils/asyncHandler';
import { apiResponse } from '../utils/apiResponse';
import { AppError } from '../utils/AppError';

const uid = (req: Request): string => {
  if (!req.user) throw new AppError('Not authenticated', 401);
  return req.user.userId;
};

export const getMonthlyReport = asyncHandler(
  async (req: Request, res: Response) => {
    const { month } = req.query as { month: string };
    const report = await generateMonthlyReport(uid(req), month);
    return apiResponse(res, report, 'Monthly report generated');
  }
);