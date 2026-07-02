'use client';

import { useLanguage } from './I18nProvider';
import { useTranslation } from 'react-i18next';

export function LanguageToggle() {
  const { t } = useTranslation('common');
  const { language, setLanguage } = useLanguage();

  return (
    <button
      type="button"
      className="rounded-md border px-3 py-1 text-sm"
      onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
    >
      {language === 'ar' ? t('english') : t('arabic')}
    </button>
  );
}
