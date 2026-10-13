'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { useFavorites } from '@/hooks/useFavorites';
import { useSiteData } from '@/hooks/useSiteData';
import { ScrollReveal } from '@/components/ScrollReveal';
import { HeartIcon, SparkleIcon } from '@/components/Icons';

export default function FavoritesPage() {
  const { locale, t } = useApp();
  const { favorites, toggle } = useFavorites();
  const { products, loading } = useSiteData();
  const [mounted, setMounted] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);

  useEffect(() => setMounted(true), []);

  const isAr = locale === 'ar';
  const favProducts = products.filter((p) => favorites.includes(p.slug));

  // Remove from favorites with a quick fade-out, then toggle the state.
  function handleRemove(slug: string) {
    setRemoving(slug);
    // let the fade animation play, then update favorites
    window.setTimeout(() => {
      toggle(slug);
      setRemoving(null);
    }, 280);
  }

  return (
    <div className="bg-ivory dark:bg-charcoal min-h-[60vh] py-12 lg:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <ScrollReveal>
          <div className="text-center mb-10">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-semibold mb-4">
              <HeartIcon className="w-3.5 h-3.5" filled />
              {isAr ? 'المفضلة' : 'Favorites'}
            </span>
            <h1 className="font-arabic text-3xl sm:text-4xl font-bold text-charcoal dark:text-ivory tracking-tight mb-3">
              {isAr ? 'منتجاتك المفضلة' : 'Your Favorite Products'}
            </h1>
            <p className="text-charcoal/70 dark:text-ivory/70 max-w-xl mx-auto">
              {isAr
                ? 'كل اللي ضفت عليه ♥ — بيرجعلك في أي وقت على نفس الجهاز.'
                : 'Everything you hearted — waiting for you anytime on this device.'}
            </p>
          </div>
        </ScrollReveal>

        {/* Content */}
        {!mounted || loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 rounded-2xl bg-sand-100 dark:bg-charcoal-light animate-pulse" />
            ))}
          </div>
        ) : favProducts.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">💔</div>
            <h2 className="text-xl font-bold text-charcoal dark:text-ivory mb-2">
              {isAr ? 'مفيش حاجة في المفضلة لسه' : 'Nothing in favorites yet'}
            </h2>
            <p className="text-charcoal/60 dark:text-ivory/60 mb-6 max-w-md mx-auto">
              {isAr
                ? 'تصفّح المنتجات واضغط على ❤️ اللي يعجبك عشان يظهر هنا.'
                : 'Browse products and tap the ❤️ on anything you like — it will show up here.'}
            </p>
            <Link
              href="/catalog"
              className="btn-press inline-flex items-center gap-2 h-12 px-6 rounded-xl bg-forest text-ivory font-medium hover:bg-forest-light"
            >
              <SparkleIcon className="w-4 h-4" />
              {isAr ? 'تصفّح الكتالوج' : 'Browse the catalog'}
            </Link>
          </div>
        ) : (
          <>
            <p className="text-sm text-charcoal/60 dark:text-ivory/60 mb-6 text-center">
              {isAr ? `${favProducts.length} منتج في المفضلة` : `${favProducts.length} item(s) in favorites`}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {favProducts.map((product, i) => (
                <ScrollReveal
                  key={product.slug}
                  delay={i * 60}
                  className={`h-full transition-all duration-300 ${
                    removing === product.slug ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
                  }`}
                >
                  <div className="group relative flex flex-col h-full rounded-2xl bg-ivory dark:bg-charcoal-light border border-charcoal/10 dark:border-charcoal-border overflow-hidden hover:shadow-card hover:border-forest/25 dark:hover:border-forest-light/25 transition-all card-lift">
                    {/* Image is a link to the product */}
                    <Link href={`/products/${product.slug}`} className="block">
                      <div className="relative aspect-[4/3] overflow-hidden bg-sand-100 dark:bg-charcoal-elevated">
                        <img
                          src={product.images[0]}
                          alt={isAr ? product.name.ar : product.name.en}
                          className="w-full h-full object-cover img-zoom"
                          loading="lazy"
                        />
                      </div>
                    </Link>

                    {/* Remove-from-favorites button — top corner, NOT inside the link */}
                    <button
                      type="button"
                      onClick={() => handleRemove(product.slug)}
                      aria-label={isAr ? 'إزالة من المفضلة' : 'Remove from favorites'}
                      title={isAr ? 'إزالة من المفضلة' : 'Remove from favorites'}
                      className="absolute top-3 end-3 z-10 w-9 h-9 rounded-full bg-red-500 text-white flex items-center justify-center shadow-md transition-all hover:scale-110 active:scale-95"
                    >
                      <HeartIcon className="w-4 h-4" filled />
                    </button>

                    {/* Text area — also a link */}
                    <Link href={`/products/${product.slug}`} className="p-5 flex-1 flex flex-col">
                      <h3 className="font-semibold text-base text-charcoal dark:text-ivory mb-1 group-hover:text-forest dark:group-hover:text-forest-light transition-colors">
                        {isAr ? product.name.ar : product.name.en}
                      </h3>
                      {product.sku && (
                        <p className="text-xs text-charcoal/50 dark:text-ivory/50 mb-3" dir="ltr">
                          {product.sku}
                        </p>
                      )}
                      <div className="mt-auto pt-3 flex items-center justify-between gap-2">
                        <span className="text-sm text-forest dark:text-forest-light font-medium">
                          {isAr ? '← عرض التفاصيل' : 'View details →'}
                        </span>
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleRemove(product.slug);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              e.stopPropagation();
                              handleRemove(product.slug);
                            }
                          }}
                          className="text-xs text-charcoal/50 dark:text-ivory/50 hover:text-red-500 dark:hover:text-red-400 transition-colors cursor-pointer"
                        >
                          {isAr ? 'إزالة' : 'Remove'}
                        </span>
                      </div>
                    </Link>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
