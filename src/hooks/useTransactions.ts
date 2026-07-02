'use client';

import { useEffect, useMemo, useState } from 'react';
import { addTransaction, editTransaction, removeTransaction, subscribeTransactions } from '@/lib/db';
import { PLAN_LIMITS, Transaction, TransactionType } from '@/types';

export function useTransactions(userId?: string, plan: 'free' | 'individual' | 'groups' | 'special' = 'free') {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setTransactions([]);
      setLoading(false);
      return;
    }

    const unsubscribe = subscribeTransactions(userId, (list) => {
      setTransactions(list);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  const currentMonthCount = useMemo(() => {
    const now = new Date();
    return transactions.filter((item) => item.date.getMonth() === now.getMonth() && item.date.getFullYear() === now.getFullYear()).length;
  }, [transactions]);

  const totals = useMemo(() => {
    const totalIncome = transactions.filter((item) => item.type === 'income').reduce((sum, item) => sum + item.amount, 0);
    const totalExpenses = transactions.filter((item) => item.type === 'expense').reduce((sum, item) => sum + item.amount, 0);
    return {
      totalIncome,
      totalExpenses,
      netBalance: totalIncome - totalExpenses,
    };
  }, [transactions]);

  async function createTransaction(payload: { type: TransactionType; amount: number; category: string; description: string }) {
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const limit = PLAN_LIMITS[plan].transactionsPerMonth;
    if (Number.isFinite(limit) && currentMonthCount >= limit) {
      throw new Error('MONTHLY_LIMIT_REACHED');
    }

    await addTransaction(userId, payload);
  }

  async function updateTransaction(transactionId: string, payload: { type: TransactionType; amount: number; category: string; description: string }) {
    if (!userId) {
      throw new Error('User not authenticated');
    }

    await editTransaction(userId, transactionId, payload);
  }

  async function deleteTransaction(transactionId: string) {
    if (!userId) {
      throw new Error('User not authenticated');
    }

    await removeTransaction(userId, transactionId);
  }

  return {
    transactions,
    loading,
    totals,
    createTransaction,
    updateTransaction,
    deleteTransaction,
  };
}
