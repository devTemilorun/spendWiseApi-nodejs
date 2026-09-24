import { Request, Response } from 'express';
import * as budgetService from '../services/budget.service';
import { asyncHandler } from '../utils/asyncHandler';
import { apiResponse } from '../utils/apiResponse';
import { AppError } from '../utils/AppError';

const uid = (req: Request): string => {
  if (!req.user) throw new AppError('Not authenticated', 401);
  return req.user.userId;
};

export const setBudget = asyncHandler(async (req: Request, res: Response) => {
  const budget = await budgetService.setBudget(uid(req), req.body);
  return apiResponse(res, budget, 'Budget set', 201);
});

export const listBudgets = asyncHandler(async (req: Request, res: Response) => {
  const { month } = req.query as { month: string };
  const budgets = await budgetService.listBudgets(uid(req), month);
  return apiResponse(res, budgets, 'Budgets fetched');
});

export const getBudget = asyncHandler(async (req: Request, res: Response) => {
  const { category, month } = req.query as { category: string; month: string };
  const budget = await budgetService.getBudget(uid(req), category, month);
  if (!budget) throw new AppError('Budget not found', 404);
  return apiResponse(res, budget, 'Budget fetched');
});

export const deleteBudget = asyncHandler(
  async (req: Request, res: Response) => {
    await budgetService.deleteBudget(uid(req), req.params.id as string);
    return apiResponse(res, null, 'Budget deleted');
  }
);