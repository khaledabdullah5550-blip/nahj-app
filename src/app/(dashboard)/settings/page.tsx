'use client';

import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppNav } from '@/components/Navigation/AppNav';
import { useAuth } from '@/hooks/useAuth';
import { addBudget } from '@/lib/db';

export default function SettingsPage() {
  const { t } = useTranslation('common');
  const { user } = useAuth();
  const [category, setCategory] = useState('food');
  const [limit, setLimit] = useState('');
  const [created, setCreated] = useState(false);

  const month = useMemo(() => new Date().toISOString().slice(0, 7), []);

  async function createBudget() {
    if (!user || !Number(limit)) {
      return;
    }

    await addBudget(user.uid, {
      category,
      limit: Number(limit),
      month,
    });

    setCreated(true);
    setLimit('');
  }

  return (
    <main className="mx-auto min-h-screen max-w-4xl p-4">
      <AppNav authenticated />
      <section className="space-y-3 rounded-lg border bg-white p-4">
        <h1 className="text-xl font-semibold">{t('settings')}</h1>
        <p className="text-sm text-gray-500">{t('securityNotice')}</p>
        <div className="grid gap-2 md:grid-cols-3">
          <input className="rounded border p-2" value={category} onChange={(event) => setCategory(event.target.value)} placeholder={t('category')} />
          <input className="rounded border p-2" value={limit} onChange={(event) => setLimit(event.target.value)} placeholder={t('budgetLimit')} inputMode="decimal" />
          <button type="button" className="rounded bg-sky-700 px-3 py-2 text-white" onClick={() => void createBudget()}>
            {t('createBudget')}
          </button>
        </div>
        {created && <p className="text-sm text-emerald-600">{t('save')}</p>}
      </section>
    </main>
  );
}
