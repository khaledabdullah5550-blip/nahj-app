export type PlanTier = 'free' | 'individual' | 'groups' | 'special';
export type TransactionType = 'income' | 'expense';

export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  plan: PlanTier;
  createdAt: Date;
  updatedAt: Date;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  description: string;
  date: Date;
  createdAt: Date;
}

export interface Budget {
  id: string;
  category: string;
  limit: number;
  spent: number;
  month: string;
  createdAt: Date;
}

export const PLAN_LIMITS: Record<PlanTier, { transactionsPerMonth: number; aiEnabled: boolean; storage: string; maxPersons: number }> = {
  free: { transactionsPerMonth: 30, aiEnabled: false, storage: '1GB', maxPersons: 1 },
  individual: { transactionsPerMonth: Number.POSITIVE_INFINITY, aiEnabled: true, storage: '10GB', maxPersons: 1 },
  groups: { transactionsPerMonth: Number.POSITIVE_INFINITY, aiEnabled: true, storage: 'Unlimited', maxPersons: 4 },
  special: { transactionsPerMonth: Number.POSITIVE_INFINITY, aiEnabled: true, storage: '10GB', maxPersons: 1 },
};

export const INCOME_CATEGORIES = ['salary', 'investment', 'bonus', 'sales', 'interest', 'other'] as const;
export const EXPENSE_CATEGORIES = ['shopping', 'food', 'transport', 'entertainment', 'health', 'education', 'bills', 'rent', 'other'] as const;
