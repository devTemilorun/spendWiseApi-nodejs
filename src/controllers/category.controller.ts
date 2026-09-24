import { Request, Response } from 'express';
import * as catService from '../services/category.service';
import { asyncHandler } from '../utils/asyncHandler';
import { apiResponse } from '../utils/apiResponse';
import { AppError } from '../utils/AppError';

const uid = (req: Request): string => {
  if (!req.user) throw new AppError('Not authenticated', 401);
  return req.user.userId;
};

export const listCategories = asyncHandler(
  async (req: Request, res: Response) => {
    const cats = await catService.listCategories(uid(req));
    return apiResponse(res, cats, 'Categories fetched');
  }
);

export const createCategory = asyncHandler(
  async (req: Request, res: Response) => {
    const cat = await catService.addCustomCategory(uid(req), req.body);
    return apiResponse(res, cat, 'Category created', 201);
  }
);

export const deleteCategory = asyncHandler(
  async (req: Request, res: Response) => {
    await catService.deleteCustomCategory(req.params.id as string, uid(req));
    return apiResponse(res, null, 'Category deleted');
  }
);