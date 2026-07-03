'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Transaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  date: string;
  category: string;
}

interface DashboardStats {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  savingsRate: number;
}

const mockStats: DashboardStats = {
  totalBalance: 125000,
  monthlyIncome: 18500,
  monthlyExpenses: 9200,
  savingsRate: 50.3,
};

const mockTransactions: Transaction[] = [
  { id: '1', type: 'credit', amount: 18500, description: 'الراتب الشهري', date: '2024-01-01', category: 'دخل' },
  { id: '2', type: 'debit', amount: 2500, description: 'إيجار شقة', date: '2024-01-02', category: 'سكن' },
  { id: '3', type: 'debit', amount: 850, description: 'فواتير كهرباء وماء', date: '2024-01-05', category: 'مرافق' },
  { id: '4', type: 'debit', amount: 1200, description: 'مشتريات البقالة', date: '2024-01-08', category: 'طعام' },
  { id: '5', type: 'credit', amount: 3000, description: 'مكافأة أداء', date: '2024-01-10', category: 'دخل' },
  { id: '6', type: 'debit', amount: 450, description: 'اشتراك اتصالات', date: '2024-01-12', category: 'اتصالات' },
];

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ar-SA', {
    style: 'currency',
    currency: 'SAR',
    minimumFractionDigits: 0,
  }).format(amount);
}

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'reports'>('overview');
  const [darkMode, setDarkMode] = useState(false);

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
                  <span className="text-nahj-600 font-bold text-sm">م</span>
                </div>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-slate-500 dark:text-slate-400 text-sm">إجمالي الرصيد</span>
                    <span className="text-2xl">💰</span>
                  </div>
                  <div className="text-2xl font-bold text-nahj-600 dark:text-nahj-400">
                    {formatCurrency(mockStats.totalBalance)}
                  </div>
                  <div className="text-green-500 text-xs mt-1">↑ 12.5% هذا الشهر</div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-slate-500 dark:text-slate-400 text-sm">الدخل الشهري</span>
                    <span className="text-2xl">📈</span>
                  </div>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {formatCurrency(mockStats.monthlyIncome)}
                  </div>
                  <div className="text-green-500 text-xs mt-1">↑ 8.2% عن الشهر الماضي</div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-slate-500 dark:text-slate-400 text-sm">المصروفات الشهرية</span>
                    <span className="text-2xl">📉</span>
                  </div>
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {formatCurrency(mockStats.monthlyExpenses)}
                  </div>
                  <div className="text-red-500 text-xs mt-1">↓ 3.1% عن الشهر الماضي</div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-slate-500 dark:text-slate-400 text-sm">نسبة الادخار</span>
                    <span className="text-2xl">🎯</span>
                  </div>
                  <div className="text-2xl font-bold text-nahj-600 dark:text-nahj-400">
                    {mockStats.savingsRate}%
                  </div>
                  <div className="text-green-500 text-xs mt-1">↑ ممتاز - فوق المستهدف</div>
                </div>
              </div>

              {/* Recent Transactions */}
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="p-5 border-b border-slate-200 dark:border-slate-700">
                  <h2 className="font-bold text-slate-900 dark:text-white">آخر المعاملات</h2>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-700">
                  {mockTransactions.slice(0, 5).map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors">
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
                          <div className="text-slate-400 text-xs">{tx.category} • {tx.date}</div>
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
                <button className="bg-nahj-500 hover:bg-nahj-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                  + إضافة معاملة
                </button>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
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
                      {mockTransactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors">
                          <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{tx.date}</td>
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
              </div>
            </div>
          )}

          {/* Reports Tab */}
          {activeTab === 'reports' && (
            <div className="animate-fade-in">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">التقارير المالية</h1>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Monthly Summary */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                  <h2 className="font-bold text-slate-900 dark:text-white mb-4">ملخص يناير 2024</h2>
                  <div className="space-y-4">
                    {[
                      { label: 'إجمالي الدخل', amount: 21500, color: 'text-green-600', percent: 100 },
                      { label: 'إجمالي المصروفات', amount: 9200, color: 'text-red-600', percent: 42.8 },
                      { label: 'صافي الادخار', amount: 12300, color: 'text-nahj-600', percent: 57.2 },
                    ].map((item) => (
                      <div key={item.label}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-slate-600 dark:text-slate-400">{item.label}</span>
                          <span className={`font-bold ${item.color}`}>{formatCurrency(item.amount)}</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${item.color.replace('text-', 'bg-')}`}
                            style={{ width: `${item.percent}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Category Breakdown */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                  <h2 className="font-bold text-slate-900 dark:text-white mb-4">توزيع المصروفات</h2>
                  <div className="space-y-3">
                    {[
                      { category: 'سكن', amount: 2500, percent: 27.2, emoji: '🏠' },
                      { category: 'طعام', amount: 1200, percent: 13.0, emoji: '🛒' },
                      { category: 'مرافق', amount: 850, percent: 9.2, emoji: '⚡' },
                      { category: 'اتصالات', amount: 450, percent: 4.9, emoji: '📱' },
                      { category: 'أخرى', amount: 4200, percent: 45.7, emoji: '📦' },
                    ].map((item) => (
                      <div key={item.category} className="flex items-center gap-3">
                        <span className="text-lg w-7">{item.emoji}</span>
                        <div className="flex-1">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-slate-700 dark:text-slate-300">{item.category}</span>
                            <span className="text-slate-500 dark:text-slate-400">{item.percent}%</span>
                          </div>
                          <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5">
                            <div
                              className="h-1.5 rounded-full bg-nahj-500"
                              style={{ width: `${item.percent}%` }}
                            />
                          </div>
                        </div>
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300 w-20 text-left">
                          {formatCurrency(item.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
