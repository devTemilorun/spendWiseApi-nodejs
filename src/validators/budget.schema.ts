import { z } from 'zod';

export const setBudgetSchema = z.object({
  category: z.string().trim().toLowerCase().min(2),
  monthlyLimit: z.number().positive('Monthly limit must be greater than 0'),
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Month must be in YYYY-MM format'),
  alertThresholds: z
    .array(z.number().min(1).max(100))
    .optional()
    .default([50, 80, 100]),
});

export const getBudgetQuerySchema = z.object({
  category: z.string().trim().toLowerCase(),
  month: z.string().regex(/^\d{4}-\d{2}$/),
});

export const listBudgetsQuerySchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/),
});

export type SetBudgetInput = z.infer<typeof setBudgetSchema>;
export type GetBudgetQuery = z.infer<typeof getBudgetQuerySchema>;
export type ListBudgetsQuery = z.infer<typeof listBudgetsQuerySchema>;