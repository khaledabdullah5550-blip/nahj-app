'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { AppNav } from '@/components/Navigation/AppNav';

export default function HomePage() {
  const { t } = useTranslation('common');

  return (
    <main className="mx-auto min-h-screen max-w-5xl p-4">
      <AppNav authenticated={false} />
      <section className="rounded-lg border bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold">{t('heroTitle')}</h1>
        <p className="mt-2 text-gray-600">{t('heroSubtitle')}</p>
        <p className="mt-2 text-sm text-gray-500">{t('securityNotice')}</p>
        <div className="mt-6 flex gap-3">
          <Link className="rounded bg-sky-700 px-4 py-2 text-white" href="/register">
            {t('register')}
          </Link>
          <Link className="rounded border px-4 py-2" href="/login">
            {t('login')}
          </Link>
        </div>
      </section>
    </main>
  );
}
