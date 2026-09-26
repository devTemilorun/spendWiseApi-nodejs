import { Request, Response } from 'express';
import { parseSms } from '../services/smsParser.service';
import { categorizeTransaction } from '../services/categorizer.service';
import { Transaction } from '../models/Transaction.model';
import { asyncHandler } from '../utils/asyncHandler';
import { apiResponse } from '../utils/apiResponse';
import { AppError } from '../utils/AppError';
import { evaluateBudgetAlerts } from '../services/budgetAlert.service';
import { User } from '../models/User.model';
import { hashSms } from '../utils/hash';
import { env } from '../config/env';
import { ITransaction } from '../models/Transaction.model';



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

    const smsHash = hashSms(sms, uid(req));
    const existing = await Transaction.findOne({ smsHash });
    const parsed = result.data;

    if (parsed.amount === null) {
      return apiResponse(
        res,
        { bank: parsed.bank, parsed },
        'Failed to extract amount from SMS',
        422
      );
    }

    
    if (existing) {
      return apiResponse(
        res,
        { bank: result.bank, transaction: existing, duplicate: true },
        'Duplicate SMS — already processed',
        200
      );
    }

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
      smsHash,
      date: parsed.date ?? new Date(),
      rawSms: parsed.rawSms,
    });

    if (tx.type === 'debit') {
      evaluateBudgetAlerts(uid(req), tx.category, tx.date).catch((err) =>
        console.error('Budget alert failed:', err)
      );
    }

    return apiResponse(
      res,
      { bank: parsed.bank, transaction: tx, isFlagged: catResult.isFlagged },
      'SMS parsed and saved',
      201
    );
  }
);




export const handleSmsWebhook = asyncHandler(
  async (req: Request, res: Response) => {
    // 1. Verify shared secret
    const secret = req.headers['x-webhook-secret'];
    if (!secret || secret !== env.SMS_WEBHOOK_SECRET) {
      // Gateways often expect 200; return 401 only for actual bad secret
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { from, to, text } = req.body as {
      from?: string;
      to?: string;
      text?: string;
    };

    if (!to || !text) {
      // Gateways expect 200 even on malformed 
      console.warn('[WEBHOOK] Missing "to" or "text" in payload');
      return res.status(200).json({ success: true, message: 'Ignored' });
    }

    // 2. Identify user by forwarding number
    const user = await User.findOne({ smsForwardingNumber: to });
    if (!user) {
      console.warn(`[WEBHOOK] No user found for number ${to}`);
      return res.status(200).json({ success: true, message: 'Ignored' });
    }

    const userId = user._id.toString();

    // 3. Duplicate check
    const smsHash = hashSms(text, userId);
    const existing = await Transaction.findOne({ smsHash });
    if (existing) {
      return res.status(200).json({
        success: true,
        status: 'duplicate',
        message: 'Already processed',
      });
    }

    const result = parseSms(text, from);
    if (!result.success || !result.data) {
      console.warn('[WEBHOOK] Parse failed:', result.error);
      return res.status(200).json({
        success: true,
        status: 'parse_failed',
        message: result.error || 'Could not parse',
      });
    }

    const parsed = result.data;

    // Narrow amount after we know `parsed` exists
    if (parsed.amount === null) {
      console.warn('[WEBHOOK] Could not extract amount');
      return res.status(200).json({
        success: true,
        status: 'parse_failed',
        message: 'Could not extract amount',
      });
    }

    // 5. Categorize + save
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
      channel: 'webhook',
      date: parsed.date ?? new Date(),
      rawSms: parsed.rawSms,
      smsHash,
    });

    if (tx.type === 'debit') {
      evaluateBudgetAlerts(userId, tx.category, tx.date).catch((err) =>
        console.error('Budget alert failed:', err)
      );
    }

    return res.status(200).json({
      success: true,
      status: 'saved',
      transactionId: tx._id,
    });
  }
);