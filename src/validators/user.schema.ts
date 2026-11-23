import { z } from 'zod';

export const updateProfileSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  phone: z.string().min(6).max(20).optional(),
  monthlyIncome: z.number().nonnegative().optional(),
  smsForwardingNumber: z
    .string()
    .regex(/^\+?[0-9]{7,15}$/, 'Invalid phone number')
    .optional(),
});

export const linkBankSchema = z.object({
  bank: z.string().min(1).max(40),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type LinkBankInput = z.infer<typeof linkBankSchema>;