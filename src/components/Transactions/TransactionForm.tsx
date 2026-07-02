'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, Transaction, TransactionType } from '@/types';
import { sanitizeInput, transactionSchema } from '@/lib/validation';

interface Props {
  onSubmit: (payload: { type: TransactionType; amount: number; category: string; description: string }) => Promise<void>;
  initial?: Transaction | null;
}

export function TransactionForm({ onSubmit, initial = null }: Props) {
  const { t } = useTranslation('common');
  const [type, setType] = useState<TransactionType>(initial?.type ?? 'expense');
  const [amount, setAmount] = useState(initial ? String(initial.amount) : '');
  const [category, setCategory] = useState(initial?.category ?? 'other');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const categories = useMemo(() => (type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES), [type]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    const payload = {
      type,
      amount: Number(amount),
      category: sanitizeInput(category),
      description: sanitizeInput(description),
    };

    const parsed = transactionSchema.safeParse(payload);
    if (!parsed.success) {
      setError(t('requiredField'));
      return;
    }

    setSaving(true);
    try {
      await onSubmit(payload);
      setAmount('');
      setDescription('');
    } catch (err) {
      const code = err instanceof Error ? err.message : 'UNKNOWN';
      setError(code === 'MONTHLY_LIMIT_REACHED' ? t('monthlyLimitReached') : t('requiredField'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="space-y-3 rounded-lg border bg-white p-4" onSubmit={handleSubmit}>
      <h2 className="font-semibold">{t('addTransaction')}</h2>
      <div className="grid gap-3 md:grid-cols-2">
        <select className="rounded border p-2" value={type} onChange={(e) => setType(e.target.value as TransactionType)}>
          <option value="income">{t('income')}</option>
          <option value="expense">{t('expense')}</option>
        </select>
        <input className="rounded border p-2" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={t('amount')} inputMode="decimal" />
        <select className="rounded border p-2" value={category} onChange={(e) => setCategory(e.target.value)}>
          {categories.map((item) => (
            <option key={item} value={item}>
              {t(type === 'income' ? `income${item.charAt(0).toUpperCase()}${item.slice(1)}` : `expense${item.charAt(0).toUpperCase()}${item.slice(1)}`)}
            </option>
          ))}
        </select>
        <input className="rounded border p-2" value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t('description')} />
      </div>
      {error && <p className="text-sm text-rose-600">{error}</p>}
      <button type="submit" disabled={saving} className="rounded bg-sky-700 px-3 py-2 text-white disabled:opacity-60">
        {saving ? t('loading') : t('save')}
      </button>
    </form>
  );
}
