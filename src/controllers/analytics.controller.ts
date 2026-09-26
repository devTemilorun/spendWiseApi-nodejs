import { Request, Response } from 'express';
import * as analytics from '../services/analytics.service';
import { asyncHandler } from '../utils/asyncHandler';
import { apiResponse } from '../utils/apiResponse';
import { AppError } from '../utils/AppError';

const uid = (req: Request): string => {
  if (!req.user) throw new AppError('Not authenticated', 401);
  return req.user.userId;
};

export const monthlySummary = asyncHandler(
  async (req: Request, res: Response) => {
    const { month } = req.query as { month: string };
    const data = await analytics.getMonthlySummary(uid(req), month);
    return apiResponse(res, data, 'Monthly summary fetched');
  }
);

export const categoryBreakdown = asyncHandler(
  async (req: Request, res: Response) => {
    const { month } = req.query as { month: string };
    const data = await analytics.getCategoryBreakdown(uid(req), month);
    return apiResponse(res, data, 'Category breakdown fetched');
  }
);

export const spendingTrend = asyncHandler(
  async (req: Request, res: Response) => {
    const { months } = req.query as unknown as { months: number };
    const data = await analytics.getSpendingTrend(uid(req), months);
    return apiResponse(res, data, 'Spending trend fetched');
  }
);

export const compare = asyncHandler(async (req: Request, res: Response) => {
  const { monthA, monthB } = req.query as { monthA: string; monthB: string };
  const data = await analytics.compareMonths(uid(req), monthA, monthB);
  return apiResponse(res, data, 'Month comparison fetched');
});

export const topMerchants = asyncHandler(
  async (req: Request, res: Response) => {
    const { month, limit } = req.query as unknown as {
      month: string;
      limit: number;
    };
    const data = await analytics.getTopMerchants(uid(req), month, limit);
    return apiResponse(res, data, 'Top merchants fetched');
  }
);

export const alerts = asyncHandler(async (req: Request, res: Response) => {
  const { month } = req.query as { month: string };
  const data = await analytics.getAlerts(uid(req), month);
  return apiResponse(res, data, 'Alerts fetched');
});