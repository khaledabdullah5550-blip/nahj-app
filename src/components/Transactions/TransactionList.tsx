'use client';

import { useTranslation } from 'react-i18next';
import { Transaction } from '@/types';
import { formatCurrency } from '@/lib/auth';
import { useLanguage } from '@/components/Common/I18nProvider';

export function TransactionList({ transactions, onDelete }: { transactions: Transaction[]; onDelete: (id: string) => Promise<void> }) {
  const { t } = useTranslation('common');
  const { language } = useLanguage();

  if (!transactions.length) {
    return <p className="rounded-lg border bg-white p-4 text-sm text-gray-500">{t('emptyTransactions')}</p>;
  }

  return (
    <div className="rounded-lg border bg-white p-2">
      {transactions.map((item) => (
        <div key={item.id} className="flex items-center justify-between border-b p-3 last:border-b-0">
          <div>
            <p className="font-medium">{item.description}</p>
            <p className="text-xs text-gray-500">
              {item.category} · {item.date.toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US')}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className={item.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}>{formatCurrency(item.amount, language)}</span>
            <button type="button" className="text-sm text-rose-600" onClick={() => void onDelete(item.id)}>
              {t('delete')}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
