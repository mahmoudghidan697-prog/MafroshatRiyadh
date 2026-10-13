'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import type { Locale } from '@/data/site';
import { site } from '@/data/site';
import { t as translate } from '@/lib/i18n';

type Theme = 'light' | 'dark';

interface AppState {
  locale: Locale;
  setLocale: (l: Locale) => void;
  dir: 'rtl' | 'ltr';
  theme: Theme;
  toggleTheme: () => void;
  t: ReturnType<typeof translate>;
}

const AppContext = createContext<AppState | null>(null);

const LOCALE_KEY = 'ms_locale';
const THEME_KEY = 'ms_theme';

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(site.defaultLocale);
  // Default theme = dark (user's preference). Light only if explicitly stored.
  const [theme, setTheme] = useState<Theme>('dark');

  // Hydrate from storage on mount (system preference is intentionally
  // NOT consulted — dark is the site default regardless of OS setting).
  useEffect(() => {
    const storedLocale = localStorage.getItem(LOCALE_KEY) as Locale | null;
    if (storedLocale === 'en' || storedLocale === 'ar') {
      setLocaleState(storedLocale);
    }
    const storedTheme = localStorage.getItem(THEME_KEY) as Theme | null;
    if (storedTheme === 'light' || storedTheme === 'dark') {
      setTheme(storedTheme);
    }
  }, []);

  // Apply locale → <html dir> and font
  useEffect(() => {
    const dir = locale === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.dir = dir;
    document.documentElement.lang = locale;
  }, [locale]);

  // Apply theme → <html class="dark">
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add('theme-transition');
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
    const timer = window.setTimeout(
      () => root.classList.remove('theme-transition'),
      350,
    );
    return () => window.clearTimeout(timer);
  }, [theme]);

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    localStorage.setItem(LOCALE_KEY, l);
  };

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem(THEME_KEY, next);
      return next;
    });
  };

  const value: AppState = {
    locale,
    setLocale,
    dir: locale === 'ar' ? 'rtl' : 'ltr',
    theme,
    toggleTheme,
    t: translate(locale),
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
