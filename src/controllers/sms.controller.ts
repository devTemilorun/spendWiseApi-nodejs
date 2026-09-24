import { Request, Response } from 'express';
import { parseSms } from '../services/smsParser.service';
import { categorizeTransaction } from '../services/categorizer.service';
import { Transaction } from '../models/Transaction.model';
import { asyncHandler } from '../utils/asyncHandler';
import { apiResponse } from '../utils/apiResponse';
import { AppError } from '../utils/AppError';

const uid = (req: Request): string => {
  if (!req.user) throw new AppError('Not authenticated', 401);
  return req.user.userId;
};

export const parseSmsEndpoint = asyncHandler(
  async (req: Request, res: Response) => {
    const { sms, senderId } = req.body;

    if (!sms || typeof sms !== 'string') {
      throw new AppError('sms field is required', 400);
    }

    const result = parseSms(sms, senderId);

    if (!result.success || !result.data) {
      return apiResponse(
        res,
        { bank: result.bank, parsed: result.data },
        result.error || 'Parsing failed',
        422
      );
    }

    const parsed = result.data;

    if (parsed.amount === null) {
      return apiResponse(
        res,
        { bank: parsed.bank, parsed },
        'Failed to extract amount from SMS',
        422
      );
    }

    // Auto-categorize
    const catResult = await categorizeTransaction(
      parsed.merchant,
      parsed.rawSms,
      uid(req)
    );

    const tx = await Transaction.create({
      userId: uid(req),
      amount: parsed.amount,
      type: parsed.type ?? 'debit',
      bank: parsed.bank ?? undefined,
      merchant: parsed.merchant ?? undefined,
      category: catResult.category,
      categorySource: 'auto',
      channel: 'sms',
      date: parsed.date ?? new Date(),
      rawSms: parsed.rawSms,
    });

    return apiResponse(
      res,
      { bank: parsed.bank, transaction: tx, isFlagged: catResult.isFlagged },
      'SMS parsed and saved',
      201
    );
  }
);