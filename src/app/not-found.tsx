'use client';

import { useApp } from '@/context/AppContext';

export default function NotFound() {
  const { locale, t } = useApp();
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 py-20 bg-ivory dark:bg-charcoal">
      <div className="text-7xl font-bold text-forest dark:text-forest-light mb-4">٤٠٤</div>
      <h1 className="text-2xl font-bold text-charcoal dark:text-ivory mb-3">
        {t.notFoundTitle}
      </h1>
      <p className="text-charcoal/60 dark:text-ivory/60 mb-8 max-w-md">
        {t.notFoundText}
      </p>
      <a
        href="/"
        className="inline-flex items-center gap-2 h-12 px-6 rounded-xl bg-forest text-ivory font-medium hover:bg-forest-light transition-colors"
      >
        {t.backHome}
      </a>
    </div>
  );
}
