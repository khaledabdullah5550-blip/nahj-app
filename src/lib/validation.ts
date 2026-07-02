import { z } from 'zod';

export const passwordSchema = z
  .string()
  .min(8)
  .regex(/[A-Z]/)
  .regex(/[a-z]/)
  .regex(/[0-9]/)
  .regex(/[^A-Za-z0-9]/);

export const transactionSchema = z.object({
  type: z.enum(['income', 'expense']),
  amount: z.number().positive(),
  category: z.string().min(1).max(40),
  description: z.string().min(1).max(200),
});

export const aiMessageSchema = z.object({
  message: z.string().min(3).max(800),
  language: z.enum(['en', 'ar']),
  plan: z.enum(['free', 'individual', 'groups', 'special']),
});

export function sanitizeInput(value: string): string {
  return value.replace(/[<>]/g, '').trim();
}
