import { z } from 'zod';

export const createTransactionSchema = z.object({
  amount: z.number().positive('Amount must be greater than 0'),
  type: z.enum(['debit', 'credit']),
  bank: z.string().trim().optional(),
  merchant: z.string().trim().optional(),
  category: z.string().trim().optional(),
  date: z.coerce.date().optional(),
  rawSms: z.string().optional(),
});

export const updateTransactionSchema = createTransactionSchema.partial();

export const listTransactionsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  category: z.string().trim().optional(),
  type: z.enum(['debit', 'credit']).optional(),
  bank: z.string().trim().optional(),
});

export const createCategorySchema = z.object({
  name: z.string().trim().min(2).toLowerCase(),
  keywords: z.array(z.string().trim()).default([]),
});

export const bulkImportSchema = z.object({
  smsMessages: z.array(z.string().min(10)).min(1).max(100),
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;
export type ListTransactionsQuery = z.infer<typeof listTransactionsQuerySchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;