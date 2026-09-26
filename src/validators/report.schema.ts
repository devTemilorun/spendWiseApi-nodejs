import { z } from 'zod';

const monthRegex = /^\d{4}-\d{2}$/;

export const monthlyReportQuerySchema = z.object({
  month: z.string().regex(monthRegex, 'month must be YYYY-MM'),
});

export const exportCsvQuerySchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  category: z.string().trim().optional(),
});