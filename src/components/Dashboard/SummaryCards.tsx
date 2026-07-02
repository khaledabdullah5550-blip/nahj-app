'use client';

import { useTranslation } from 'react-i18next';
import { formatCurrency } from '@/lib/auth';
import { useLanguage } from '@/components/Common/I18nProvider';

export function SummaryCards({ totalIncome, totalExpenses, netBalance }: { totalIncome: number; totalExpenses: number; netBalance: number }) {
  const { t } = useTranslation('common');
  const { language } = useLanguage();

  const cards = [
    { label: t('totalIncome'), value: totalIncome, className: 'text-emerald-600' },
    { label: t('totalExpenses'), value: totalExpenses, className: 'text-rose-600' },
    { label: t('netBalance'), value: netBalance, className: 'text-sky-600' },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {cards.map((card) => (
        <div key={card.label} className="rounded-lg border bg-white p-4 shadow-sm">
          <div className="text-sm text-gray-500">{card.label}</div>
          <div className={`text-xl font-semibold ${card.className}`}>{formatCurrency(card.value, language)}</div>
        </div>
      ))}
    </div>
  );
}
