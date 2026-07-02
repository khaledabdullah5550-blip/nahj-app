'use client';

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { AppNav } from '@/components/Navigation/AppNav';
import { SummaryCards } from '@/components/Dashboard/SummaryCards';
import { TransactionForm } from '@/components/Transactions/TransactionForm';
import { TransactionList } from '@/components/Transactions/TransactionList';
import { ChatPanel } from '@/components/AIAdvisor/ChatPanel';
import { useAuth } from '@/hooks/useAuth';
import { useTransactions } from '@/hooks/useTransactions';
import { PLAN_LIMITS } from '@/types';
import { useLanguage } from '@/components/Common/I18nProvider';

export default function DashboardPage() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const { user, profile, loading: authLoading, isAuthenticated, logout } = useAuth();
  const { language } = useLanguage();

  const plan = profile?.plan ?? 'free';
  const { transactions, loading, totals, createTransaction, deleteTransaction } = useTransactions(user?.uid, plan);

  const insight = useMemo(() => {
    if (!transactions.length) {
      return '';
    }

    const food = transactions.filter((item) => item.type === 'expense' && item.category === 'food').reduce((sum, item) => sum + item.amount, 0);
    if (!food) {
      return '';
    }

    return language === 'ar' ? `أكبر مصروف حاليًا هو الطعام: ${food.toFixed(2)} ريال` : `Biggest expense currently: Food (${food.toFixed(2)} SAR)`;
  }, [language, transactions]);

  if (!authLoading && !isAuthenticated) {
    router.push('/login');
    return null;
  }

  return (
    <main className="mx-auto min-h-screen max-w-6xl p-4">
      <AppNav authenticated />
      <section className="mb-4 flex items-center justify-between rounded-lg border bg-white p-4 text-sm">
        <p>
          {t('welcome')} {profile?.name ?? user?.email}
        </p>
        <div className="flex items-center gap-3">
          <span className="rounded bg-slate-100 px-2 py-1">{plan}</span>
          <button className="rounded border px-3 py-1" type="button" onClick={() => void logout()}>
            {t('logout')}
          </button>
        </div>
      </section>

      <SummaryCards totalIncome={totals.totalIncome} totalExpenses={totals.totalExpenses} netBalance={totals.netBalance} />

      {insight && <p className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{insight}</p>}

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <TransactionForm onSubmit={createTransaction} />
          <TransactionList transactions={transactions} onDelete={deleteTransaction} />
          {loading && <p className="text-sm text-gray-500">{t('loading')}</p>}
        </div>

        <div className="space-y-4">
          <ChatPanel language={language} plan={plan} transactions={transactions} />
          <p className="rounded-lg border bg-white p-3 text-sm text-gray-500">
            {t('activityAutoLogout')} {PLAN_LIMITS[plan].aiEnabled ? '' : t('aiUnavailable')}
          </p>
        </div>
      </div>
    </main>
  );
}
