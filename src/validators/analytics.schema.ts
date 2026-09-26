import { z } from 'zod';

const monthRegex = /^\d{4}-\d{2}$/;

export const monthQuerySchema = z.object({
  month: z.string().regex(monthRegex, 'month must be YYYY-MM'),
});

export const trendQuerySchema = z.object({
  months: z.coerce.number().int().min(1).max(24).default(6),
});

export const compareQuerySchema = z.object({
  monthA: z.string().regex(monthRegex, 'monthA must be YYYY-MM'),
  monthB: z.string().regex(monthRegex, 'monthB must be YYYY-MM'),
});

export const topMerchantsQuerySchema = z.object({
  month: z.string().regex(monthRegex, 'month must be YYYY-MM'),
  limit: z.coerce.number().int().min(1).max(50).default(5),
});