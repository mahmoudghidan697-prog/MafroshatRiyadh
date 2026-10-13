'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { useFavorites } from '@/hooks/useFavorites';
import { HeartIcon } from '@/components/Icons';

/**
 * FavoritesBadge — a heart icon linking to /favorites, with a live
 * count of saved items. Persists across pages via the useFavorites hook.
 * Rendered inside the header's right cluster.
 */
export function FavoritesBadge({ className = '' }: { className?: string }) {
  const { locale } = useApp();
  const { favorites } = useFavorites();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const count = mounted ? favorites.length : 0;

  return (
    <Link
      href="/favorites"
      aria-label={locale === 'ar' ? 'المفضلة' : 'Favorites'}
      title={locale === 'ar' ? 'منتجاتك المفضلة' : 'Your favorites'}
      className={`relative w-9 h-9 flex items-center justify-center rounded-full border transition-colors hover:scale-105 ${className}`}
    >
      <HeartIcon className="w-4 h-4" filled={count > 0} />
      {count > 0 && (
        <span className="absolute -top-1 -end-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-ivory dark:border-charcoal">
          {count}
        </span>
      )}
    </Link>
  );
}
