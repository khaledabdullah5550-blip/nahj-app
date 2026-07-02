'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { LanguageToggle } from '@/components/Common/LanguageToggle';

export function AppNav({ authenticated }: { authenticated: boolean }) {
  const { t } = useTranslation('common');

  return (
    <nav className="mb-6 flex items-center justify-between rounded-lg border bg-white p-4 shadow-sm">
      <div className="font-semibold">{t('appName')}</div>
      <div className="flex items-center gap-4 text-sm">
        <Link href="/dashboard">{t('dashboard')}</Link>
        <Link href="/transactions">{t('transactions')}</Link>
        <Link href="/settings">{t('settings')}</Link>
        {!authenticated && <Link href="/login">{t('login')}</Link>}
        <LanguageToggle />
      </div>
    </nav>
  );
}
