import { Request, Response } from 'express';
import * as txService from '../services/transaction.service';
import { asyncHandler } from '../utils/asyncHandler';
import { apiResponse } from '../utils/apiResponse';
import { AppError } from '../utils/AppError';

import { parseSms } from '../services/smsParser.service';
import { categorizeTransaction } from '../services/categorizer.service';
import { hashSms } from '../utils/hash';
import { Transaction, ITransaction } from '../models/Transaction.model';
import { evaluateBudgetAlerts } from '../services/budgetAlert.service';

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

// Bulk SMS import
export const bulkImportTransactions = asyncHandler(
  async (req: Request, res: Response) => {
    const { smsMessages } = req.body as { smsMessages: string[] };

    if (!Array.isArray(smsMessages) || smsMessages.length === 0) {
      throw new AppError('smsMessages must be a non-empty array', 400);
    }
    if (smsMessages.length > 100) {
      throw new AppError('Maximum 100 SMS per bulk import', 400);
    }

    const userId = uid(req);

    let imported = 0;
    let duplicates = 0;
    let failed = 0;
    const details: Array<{
      index: number;
      status: 'imported' | 'duplicate' | 'failed';
      reason?: string;
      transactionId?: string;
    }> = [];

    for (let i = 0; i < smsMessages.length; i++) {
      const sms = smsMessages[i];

      try {
        const smsHash = hashSms(sms, userId);
        const existing = await Transaction.findOne({ smsHash });
        if (existing) {
          duplicates++;
          details.push({ index: i, status: 'duplicate' });
          continue;
        }

        const result = parseSms(sms);
        if (!result.success || !result.data) {
          failed++;
          details.push({
            index: i,
            status: 'failed',
            reason: result.error || 'Parse failed',
          });
          continue;
        }

        const parsed = result.data;

        if (parsed.amount === null) {
          failed++;
          details.push({
            index: i,
            status: 'failed',
            reason: 'Could not extract amount',
          });
          continue;
        }

        const catResult = await categorizeTransaction(
          parsed.merchant,
          parsed.rawSms,
          userId
        );

        const tx: ITransaction = await Transaction.create({
          userId,
          amount: parsed.amount,
          type: parsed.type ?? 'debit',
          bank: parsed.bank ?? undefined,
          merchant: parsed.merchant ?? undefined,
          category: catResult.category,
          categorySource: 'auto',
          channel: 'sms',
          date: parsed.date ?? new Date(),
          rawSms: parsed.rawSms,
          smsHash,
        });

        if (tx.type === 'debit') {
          evaluateBudgetAlerts(userId, tx.category, tx.date).catch((err) =>
            console.error('Budget alert failed:', err)
          );
        }

        imported++;
        details.push({
          index: i,
          status: 'imported',
          transactionId: tx._id.toString(),
        });
      } catch (err) {
        failed++;
        details.push({
          index: i,
          status: 'failed',
          reason: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    return apiResponse(
      res,
      { imported, duplicates, failed, total: smsMessages.length, details },
      'Bulk import complete',
      201
    );
  }
);