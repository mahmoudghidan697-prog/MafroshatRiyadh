'use client';

import { useApp } from '@/context/AppContext';
import { useSiteData } from '@/hooks/useSiteData';
import { loc } from '@/lib/i18n';
import { ProductCard } from '@/components/ProductCard';
import { ScrollReveal } from '@/components/ScrollReveal';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export default function CategoryContent({ categoryId }: { categoryId: string }) {
  const { locale, t } = useApp();
  const { products, categories, loading } = useSiteData();

  const category = categories.find((c) => c.id === categoryId);

  // Only call notFound after loading is complete to avoid false 404s
  // when the category exists in the DB but hasn't arrived yet.
  if (!loading && !category) {
    notFound();
  }

  // During loading or before the category is resolved, show a skeleton.
  if (loading || !category) {
    return <LoadingState />;
  }

  const categoryProducts = products.filter((p) => p.category === categoryId);
  const categoryName = loc(locale, category.name);
  const categoryDescription = loc(locale, category.description);

  return (
    <div className="bg-ivory dark:bg-charcoal min-h-screen">
      {/* Breadcrumb */}
      <div className="border-b border-charcoal/5 dark:border-charcoal-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav
            aria-label="breadcrumb"
            className="flex items-center gap-2 text-sm text-charcoal/50 dark:text-ivory/45 flex-wrap"
          >
            <Link
              href="/"
              className="hover:text-forest dark:hover:text-forest-light transition-colors"
            >
              {t.home}
            </Link>
            <span aria-hidden="true">/</span>
            <span className="text-charcoal dark:text-ivory font-medium">
              {categoryName}
            </span>
          </nav>
        </div>
      </div>

      {/* Category header */}
      <div className="bg-sand-50 dark:bg-charcoal-light border-b border-charcoal/5 dark:border-charcoal-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
          <ScrollReveal>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-charcoal dark:text-ivory mb-3 font-arabic">
              {categoryName}
            </h1>
            <p className="text-charcoal/60 dark:text-ivory/60 max-w-2xl leading-relaxed">
              {categoryDescription}
            </p>
            <p className="mt-4 text-sm text-charcoal/50 dark:text-ivory/45">
              {categoryProducts.length} {t.productsFound}
            </p>
          </ScrollReveal>
        </div>
      </div>

      {/* Products */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        {categoryProducts.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            {categoryProducts.map((product) => (
              <ProductCard key={product.slug} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Loading skeleton ─── */
function LoadingState() {
  return (
    <div className="bg-ivory dark:bg-charcoal min-h-screen">
      <div className="border-b border-charcoal/5 dark:border-charcoal-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="h-4 w-32 bg-sand-100 dark:bg-charcoal-elevated rounded animate-pulse" />
        </div>
      </div>
      <div className="bg-sand-50 dark:bg-charcoal-light border-b border-charcoal/5 dark:border-charcoal-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
          <div className="h-8 w-48 bg-sand-100 dark:bg-charcoal-elevated rounded animate-pulse mb-3" />
          <div className="h-4 w-96 max-w-full bg-sand-100 dark:bg-charcoal-elevated rounded animate-pulse" />
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl bg-ivory dark:bg-charcoal-light border border-charcoal/10 dark:border-charcoal-border overflow-hidden"
            >
              <div className="aspect-[4/3] bg-sand-100 dark:bg-charcoal-elevated animate-pulse" />
              <div className="p-4 lg:p-5 space-y-3">
                <div className="h-3 w-16 bg-sand-100 dark:bg-charcoal-elevated rounded animate-pulse" />
                <div className="h-4 w-3/4 bg-sand-100 dark:bg-charcoal-elevated rounded animate-pulse" />
                <div className="h-3 w-1/2 bg-sand-100 dark:bg-charcoal-elevated rounded animate-pulse" />
                <div className="pt-3 border-t border-charcoal/5 dark:border-charcoal-border/40 flex items-center justify-between">
                  <div className="h-5 w-20 bg-sand-100 dark:bg-charcoal-elevated rounded animate-pulse" />
                  <div className="h-4 w-16 bg-sand-100 dark:bg-charcoal-elevated rounded animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Empty state ─── */
function EmptyState() {
  const { t } = useApp();
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="text-5xl mb-4 opacity-30" aria-hidden="true">
        🔍
      </div>
      <h3 className="text-lg font-semibold text-charcoal dark:text-ivory mb-2">
        {t.noProducts}
      </h3>
      <p className="text-sm text-charcoal/60 dark:text-ivory/60 mb-6 max-w-md">
        {t.noProductsHint}
      </p>
      <Link
        href="/catalog"
        className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-forest text-ivory text-sm font-medium hover:bg-forest-light transition-colors"
      >
        {t.backToCatalog}
      </Link>
    </div>
  );
}
