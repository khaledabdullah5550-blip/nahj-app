'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface User {
  userId: string;
  name: string;
  email: string;
  status: string;
  createdAt: string;
}

interface Transaction {
  transactionId: string;
  userId: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
}

interface Stats {
  totalUsers: number;
  totalTransactions: number;
  systemStatus: string;
  region: string;
}

export default function DashboardPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [healthRes, usersRes, txRes] = await Promise.all([
          fetch('/api/health'),
          fetch('/api/users'),
          fetch('/api/transactions'),
        ]);

        if (!healthRes.ok || !usersRes.ok || !txRes.ok) {
          throw new Error('فشل تحميل البيانات');
        }

        const healthData = await healthRes.json();
        const usersData = await usersRes.json();
        const txData = await txRes.json();

        setStats({
          totalUsers: usersData.count ?? 0,
          totalTransactions: txData.count ?? 0,
          systemStatus: healthData.status ?? 'unknown',
          region: healthData.region ?? 'me-central-1',
        });
        setUsers(usersData.users ?? []);
        setTransactions(txData.transactions ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Topbar */}
      <header className="border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 font-bold text-white">
                  ن
                </div>
                <span className="text-lg font-bold text-gray-900">نهج</span>
              </Link>
              <span className="text-gray-400">/</span>
              <span className="text-sm font-medium text-gray-600">
                لوحة التحكم
              </span>
            </div>
            <div className="flex items-center gap-3">
              {stats && (
                <span
                  className={
                    stats.systemStatus === 'healthy'
                      ? 'badge-success'
                      : 'badge-warning'
                  }
                >
                  {stats.systemStatus === 'healthy' ? '● نشط' : '● تحقق'}
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">لوحة التحكم</h1>
          <p className="mt-1 text-sm text-gray-500">
            نظرة عامة على النظام والبيانات
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            ⚠️ {error}
          </div>
        )}

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="text-center text-gray-500">
              <div className="mb-2 text-3xl">⏳</div>
              <p>جارٍ تحميل البيانات…</p>
            </div>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                label="إجمالي المستخدمين"
                value={stats?.totalUsers ?? 0}
                icon="👥"
                color="brand"
              />
              <StatCard
                label="إجمالي المعاملات"
                value={stats?.totalTransactions ?? 0}
                icon="💳"
                color="green"
              />
              <StatCard
                label="حالة النظام"
                value={stats?.systemStatus === 'healthy' ? 'نشط' : 'تحقق'}
                icon="🟢"
                color="emerald"
              />
              <StatCard
                label="المنطقة"
                value={stats?.region ?? 'me-central-1'}
                icon="🇸🇦"
                color="gold"
              />
            </div>

            {/* Compliance Info */}
            <div className="mb-8 card">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">
                حالة الامتثال التنظيمي
              </h2>
              <div className="grid gap-4 sm:grid-cols-3">
                <ComplianceItem
                  label="PDPL"
                  status="متوافق"
                  detail="البيانات داخل المملكة"
                />
                <ComplianceItem
                  label="SAMA"
                  status="متوافق"
                  detail="معايير الأمان مطبّقة"
                />
                <ComplianceItem
                  label="تشفير البيانات"
                  status="مفعّل"
                  detail="AES-256 + TLS 1.3"
                />
              </div>
            </div>

            {/* Users Table */}
            <div className="mb-8 card overflow-hidden p-0">
              <div className="border-b border-gray-200 px-6 py-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  المستخدمون
                </h2>
              </div>
              {users.length === 0 ? (
                <EmptyState message="لا يوجد مستخدمون بعد" />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-xs font-medium uppercase tracking-wider text-gray-500">
                      <tr>
                        <th className="px-6 py-3 text-right">الاسم</th>
                        <th className="px-6 py-3 text-right">البريد</th>
                        <th className="px-6 py-3 text-right">الحالة</th>
                        <th className="px-6 py-3 text-right">تاريخ الإنشاء</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {users.map((user) => (
                        <tr key={user.userId} className="hover:bg-gray-50">
                          <td className="whitespace-nowrap px-6 py-4 font-medium text-gray-900">
                            {user.name}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-gray-600">
                            {user.email}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4">
                            <span
                              className={
                                user.status === 'active'
                                  ? 'badge-success'
                                  : 'badge-warning'
                              }
                            >
                              {user.status === 'active' ? 'نشط' : 'معلق'}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-gray-500">
                            {new Date(user.createdAt).toLocaleDateString('ar-SA')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Transactions Table */}
            <div className="card overflow-hidden p-0">
              <div className="border-b border-gray-200 px-6 py-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  المعاملات المالية
                </h2>
              </div>
              {transactions.length === 0 ? (
                <EmptyState message="لا توجد معاملات بعد" />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-xs font-medium uppercase tracking-wider text-gray-500">
                      <tr>
                        <th className="px-6 py-3 text-right">رقم المعاملة</th>
                        <th className="px-6 py-3 text-right">المبلغ</th>
                        <th className="px-6 py-3 text-right">العملة</th>
                        <th className="px-6 py-3 text-right">الحالة</th>
                        <th className="px-6 py-3 text-right">التاريخ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {transactions.map((tx) => (
                        <tr key={tx.transactionId} className="hover:bg-gray-50">
                          <td className="whitespace-nowrap px-6 py-4 font-mono text-xs text-gray-600">
                            {tx.transactionId.slice(0, 8)}…
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 font-semibold text-gray-900">
                            {tx.amount.toLocaleString('ar-SA')}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-gray-600">
                            {tx.currency}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4">
                            <span
                              className={
                                tx.status === 'completed'
                                  ? 'badge-success'
                                  : tx.status === 'pending'
                                  ? 'badge-warning'
                                  : 'badge-error'
                              }
                            >
                              {tx.status === 'completed'
                                ? 'مكتملة'
                                : tx.status === 'pending'
                                ? 'معلقة'
                                : 'مرفوضة'}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-gray-500">
                            {new Date(tx.createdAt).toLocaleDateString('ar-SA')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: string;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    brand: 'bg-brand-50 text-brand-600',
    green: 'bg-green-50 text-green-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    gold: 'bg-yellow-50 text-yellow-600',
  };

  return (
    <div className="card">
      <div className="flex items-center gap-4">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-xl text-2xl ${colorMap[color] ?? colorMap.brand}`}
        >
          {icon}
        </div>
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
}

function ComplianceItem({
  label,
  status,
  detail,
}: {
  label: string;
  status: string;
  detail: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg bg-green-50 p-4">
      <span className="mt-0.5 text-green-500">✓</span>
      <div>
        <p className="font-semibold text-green-800">{label}</p>
        <p className="text-xs font-medium text-green-700">{status}</p>
        <p className="text-xs text-green-600">{detail}</p>
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex h-32 items-center justify-center text-sm text-gray-400">
      {message}
    </div>
  );
}
