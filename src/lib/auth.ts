import { passwordSchema } from './validation';

export const INACTIVITY_TIMEOUT_MS = 10 * 60 * 1000;

export function isStrongPassword(password: string): boolean {
  return passwordSchema.safeParse(password).success;
}

export function formatCurrency(amount: number, locale: 'en' | 'ar'): string {
  return new Intl.NumberFormat(locale === 'ar' ? 'ar-SA' : 'en-US', {
    style: 'currency',
    currency: 'SAR',
    maximumFractionDigits: 2,
  }).format(amount);
}
