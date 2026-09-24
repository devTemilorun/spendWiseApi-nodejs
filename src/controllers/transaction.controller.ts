import { Request, Response } from 'express';
import * as txService from '../services/transaction.service';
import { asyncHandler } from '../utils/asyncHandler';
import { apiResponse } from '../utils/apiResponse';
import { AppError } from '../utils/AppError';

const uid = (req: Request): string => {
  if (!req.user) throw new AppError('Not authenticated', 401);
  return req.user.userId;
};

export const createTransaction = asyncHandler(
  async (req: Request, res: Response) => {
    const tx = await txService.createManualTransaction(uid(req), req.body);
    return apiResponse(res, tx, 'Transaction created', 201);
  }
);

export const listTransactions = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await txService.getTransactions(uid(req), req.query as any);
    return apiResponse(res, result, 'Transactions fetched');
  }
);

export const getTransaction = asyncHandler(
  async (req: Request, res: Response) => {
    const tx = await txService.getTransactionById(req.params.id as string, uid(req));
    return apiResponse(res, tx, 'Transaction fetched');
  }
);

export const updateTransaction = asyncHandler(
  async (req: Request, res: Response) => {
    const tx = await txService.updateTransaction(
      req.params.id as string,
      uid(req),
      req.body
    );
    return apiResponse(res, tx, 'Transaction updated');
  }
);

export const deleteTransaction = asyncHandler(
  async (req: Request, res: Response) => {
    await txService.deleteTransaction(req.params.id as string, uid(req));
    return apiResponse(res, null, 'Transaction deleted');
  }
);
