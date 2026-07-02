'use client';

import { PropsWithChildren, createContext, useContext, useEffect, useMemo, useState } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n, { initI18n } from '@/lib/i18n';

type LanguageContextType = {
  language: 'en' | 'ar';
  setLanguage: (language: 'en' | 'ar') => void;
};

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => undefined,
});

export function I18nProvider({ children }: PropsWithChildren) {
  const [language, setLanguage] = useState<'en' | 'ar'>('en');

  useEffect(() => {
    const savedLanguage = (localStorage.getItem('nahj-language') as 'en' | 'ar' | null) ?? 'en';
    setLanguage(savedLanguage);
    initI18n(savedLanguage);
  }, []);

  useEffect(() => {
    void i18n.changeLanguage(language);
    localStorage.setItem('nahj-language', language);
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  const value = useMemo(() => ({ language, setLanguage }), [language]);

  return (
    <LanguageContext.Provider value={value}>
      <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
