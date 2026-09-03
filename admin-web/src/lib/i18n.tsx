'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { DICT, type Lang } from './dictionary';

const LANG_KEY = 'sut_admin_lang';

type I18nContextValue = {
  lang: Lang;
  t: (key: string) => string;
  toggleLanguage: () => void;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  // Lazy initializer instead of an effect: localStorage is a synchronous
  // browser API, so there is no external subscription to set up - reading it
  // once during the client's first render is enough (guarded for SSR, where
  // window/localStorage don't exist).
  const [lang, setLangState] = useState<Lang>(() => {
    if (typeof window === 'undefined') return 'th';
    const saved = localStorage.getItem(LANG_KEY) as Lang | null;
    return saved === 'th' || saved === 'en' ? saved : 'th';
  });

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const toggleLanguage = useCallback(() => {
    setLangState((prev) => {
      const next: Lang = prev === 'th' ? 'en' : 'th';
      localStorage.setItem(LANG_KEY, next);
      return next;
    });
  }, []);

  const t = useCallback((key: string) => DICT[lang]?.[key] ?? DICT.en[key] ?? key, [lang]);

  return <I18nContext.Provider value={{ lang, t, toggleLanguage }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
