'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';

interface Transaction {
  transactionId: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  createdAt: string;
  category: string;
  currency: string;
}

interface DashboardStats {
  totalCredit: number;
  totalDebit: number;
  savingsRate: number;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ar-SA', {
    style: 'currency',
    currency: 'SAR',
    minimumFractionDigits: 0,
  }).format(amount);
}

function computeStats(transactions: Transaction[]): DashboardStats {
  const totalCredit = transactions
    .filter((t) => t.type === 'credit')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalDebit = transactions
    .filter((t) => t.type === 'debit')
    .reduce((sum, t) => sum + t.amount, 0);
  const savingsRate =
    totalCredit > 0 ? Math.round(((totalCredit - totalDebit) / totalCredit) * 1000) / 10 : 0;
  return { totalCredit, totalDebit, savingsRate };
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'reports'>('overview');
  const [darkMode, setDarkMode] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      window.location.href = '/login';
    }
  }, [status]);

  useEffect(() => {
    if (status !== 'authenticated') return;

    setLoading(true);
    setError(null);

    fetch('/api/transactions')
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || `HTTP ${res.status}`);
        }
        return res.json();
      })
      .then((json) => {
        setTransactions(json.data ?? []);
      })
      .catch((err: Error) => {
        console.error('خطأ في جلب المعاملات:', err);
        setError('فشل تحميل المعاملات - تحقق من اتصالك وحاول مجدداً');
      })
      .finally(() => setLoading(false));
  }, [status]);

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-nahj-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">جارٍ التحميل…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-center max-w-sm">
          <p className="text-red-600 dark:text-red-400 font-semibold text-lg mb-2">⚠️ خطأ</p>
          <p className="text-slate-600 dark:text-slate-400">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-nahj-500 text-white rounded-lg text-sm hover:bg-nahj-600 transition-colors"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  const stats = computeStats(transactions);

  return (
    <div className={`min-h-screen ${darkMode ? 'dark' : ''}`}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
        {/* Header */}
        <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-3">
                <Link href="/" className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-nahj-500 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">ن</span>
                  </div>
                  <span className="text-slate-900 dark:text-white font-bold text-lg">نهج</span>
                </Link>
              </div>

              <nav className="hidden sm:flex items-center gap-1">
                {[
                  { id: 'overview', label: 'نظرة عامة' },
                  { id: 'transactions', label: 'المعاملات' },
                  { id: 'reports', label: 'التقارير' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'bg-nahj-500 text-white'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                  aria-label="تبديل الوضع الليلي"
                >
                  {darkMode ? '☀️' : '🌙'}
                </button>
                <div className="w-8 h-8 bg-nahj-100 rounded-full flex items-center justify-center">
                  <span className="text-nahj-600 font-bold text-sm">
                    {session?.user?.name?.[0] ?? 'م'}
                  </span>
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                >
                  خروج
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="animate-fade-in">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
                لوحة التحكم المالية
              </h1>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-slate-500 dark:text-slate-400 text-sm">إجمالي الدخل</span>
                    <span className="text-2xl">📈</span>
                  </div>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {formatCurrency(stats.totalCredit)}
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-slate-500 dark:text-slate-400 text-sm">إجمالي المصروفات</span>
                    <span className="text-2xl">📉</span>
                  </div>
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {formatCurrency(stats.totalDebit)}
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-slate-500 dark:text-slate-400 text-sm">نسبة الادخار</span>
                    <span className="text-2xl">🎯</span>
                  </div>
                  <div className="text-2xl font-bold text-nahj-600 dark:text-nahj-400">
                    {stats.savingsRate}%
                  </div>
                </div>
              </div>

              {/* Recent Transactions */}
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="p-5 border-b border-slate-200 dark:border-slate-700">
                  <h2 className="font-bold text-slate-900 dark:text-white">آخر المعاملات</h2>
                </div>
                {transactions.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                    لا توجد معاملات بعد
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-700">
                    {transactions.slice(0, 5).map((tx) => (
                      <div key={tx.transactionId} className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                            tx.type === 'credit'
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                              : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                          }`}>
                            {tx.type === 'credit' ? '+' : '-'}
                          </div>
                          <div>
                            <div className="font-medium text-slate-900 dark:text-white text-sm">{tx.description}</div>
                            <div className="text-slate-400 text-xs">{tx.category} • {new Date(tx.createdAt).toLocaleDateString('ar-SA')}</div>
                          </div>
                        </div>
                        <div className={`font-bold text-sm ${
                          tx.type === 'credit'
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          {tx.type === 'credit' ? '+' : '-'}{formatCurrency(tx.amount)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="p-4 text-center">
                  <button
                    onClick={() => setActiveTab('transactions')}
                    className="text-nahj-500 hover:text-nahj-600 text-sm font-medium transition-colors"
                  >
                    عرض كل المعاملات →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Transactions Tab */}
          {activeTab === 'transactions' && (
            <div className="animate-fade-in">
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">المعاملات المالية</h1>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                {transactions.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                    لا توجد معاملات بعد
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 dark:bg-slate-750 border-b border-slate-200 dark:border-slate-700">
                        <tr>
                          <th className="text-right px-4 py-3 font-medium text-slate-600 dark:text-slate-400">التاريخ</th>
                          <th className="text-right px-4 py-3 font-medium text-slate-600 dark:text-slate-400">الوصف</th>
                          <th className="text-right px-4 py-3 font-medium text-slate-600 dark:text-slate-400">الفئة</th>
                          <th className="text-right px-4 py-3 font-medium text-slate-600 dark:text-slate-400">النوع</th>
                          <th className="text-right px-4 py-3 font-medium text-slate-600 dark:text-slate-400">المبلغ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {transactions.map((tx) => (
                          <tr key={tx.transactionId} className="hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors">
                            <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{new Date(tx.createdAt).toLocaleDateString('ar-SA')}</td>
                            <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{tx.description}</td>
                            <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{tx.category}</td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                tx.type === 'credit'
                                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                  : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                              }`}>
                                {tx.type === 'credit' ? 'دخل' : 'مصروف'}
                              </span>
                            </td>
                            <td className={`px-4 py-3 font-bold ${
                              tx.type === 'credit'
                                ? 'text-green-600 dark:text-green-400'
                                : 'text-red-600 dark:text-red-400'
                            }`}>
                              {tx.type === 'credit' ? '+' : '-'}{formatCurrency(tx.amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Reports Tab */}
          {activeTab === 'reports' && (
            <div className="animate-fade-in">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">التقارير المالية</h1>

              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                <h2 className="font-bold text-slate-900 dark:text-white mb-4">ملخص المعاملات</h2>
                <div className="space-y-4">
                  {[
                    { label: 'إجمالي الدخل', amount: stats.totalCredit, color: 'text-green-600', percent: 100 },
                    { label: 'إجمالي المصروفات', amount: stats.totalDebit, color: 'text-red-600', percent: stats.totalCredit > 0 ? Math.min(100, (stats.totalDebit / stats.totalCredit) * 100) : 0 },
                    { label: 'صافي الادخار', amount: stats.totalCredit - stats.totalDebit, color: 'text-nahj-600', percent: stats.savingsRate },
                  ].map((item) => (
                    <div key={item.label}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-600 dark:text-slate-400">{item.label}</span>
                        <span className={`font-bold ${item.color}`}>{formatCurrency(item.amount)}</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${item.color.replace('text-', 'bg-')}`}
                          style={{ width: `${Math.max(0, item.percent)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
