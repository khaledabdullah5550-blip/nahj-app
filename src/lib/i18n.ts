'use client';

import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from '../../public/locales/en/common.json';
import ar from '../../public/locales/ar/common.json';

const resources = {
  en: { common: en },
  ar: { common: ar },
} as const;

let initialized = false;

export function initI18n(language: 'en' | 'ar' = 'en') {
  if (initialized) {
    void i18next.changeLanguage(language);
    return;
  }

  void i18next.use(initReactI18next).init({
    resources,
    lng: language,
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    defaultNS: 'common',
    ns: ['common'],
  });

  initialized = true;
}

export default i18next;

initI18n();
