import { Request, Response } from 'express';
import { exportTransactionsCSV } from '../services/export.service';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/AppError';

const uid = (req: Request): string => {
  if (!req.user) throw new AppError('Not authenticated', 401);
  return req.user.userId;
};

export const exportCsv = asyncHandler(async (req: Request, res: Response) => {
  const { startDate, endDate, category } = req.query as {
    startDate?: Date;
    endDate?: Date;
    category?: string;
  };

  const csv = await exportTransactionsCSV(uid(req), {
    startDate,
    endDate,
    category,
  });

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="transactions-${Date.now()}.csv"`
  );
  res.status(200).send(csv);
});