'use client';

import { useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { getCategory } from '@/data/site';
import { filterFacets } from '@/data/site';
import { loc, formatPrice } from '@/lib/i18n';
import { ProductCard } from '@/components/ProductCard';
import { AddProductButton } from '@/components/AddProductButton';
import { useSiteData } from '@/hooks/useSiteData';
import { WhatsAppIcon, PhoneIcon, SearchIcon, CloseIcon, ChevronDownIcon } from '@/components/Icons';

const PAGE_SIZE = 12;

type SortKey = 'newest' | 'price-low' | 'price-high' | 'name';

export default function CatalogPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-ivory dark:bg-charcoal" />}>
      <CatalogContent />
    </Suspense>
  );
}

function CatalogContent() {
  const { locale, t } = useApp();
  const searchParams = useSearchParams();

  // Live catalog data from the DB (falls back to static seed)
  const { products, categories } = useSiteData();

  const [search, setSearch] = useState(searchParams.get('search') ?? '');
  const [category, setCategory] = useState<string>(searchParams.get('category') ?? 'all');
  const [color, setColor] = useState<string>('all');
  const [material, setMaterial] = useState<string>('all');
  const [useCase, setUseCase] = useState<string>('all');
  const [sort, setSort] = useState<SortKey>('newest');
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const facets = useMemo(() => filterFacets(products), [products]);

  const filtered = useMemo(() => {
    let result = products.filter((p) => {
      if (category !== 'all' && p.category !== category) return false;
      if (color !== 'all' && p.color.en !== color) return false;
      if (material !== 'all' && p.material.en !== material) return false;
      if (useCase !== 'all' && !p.useCases.includes(useCase as never)) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const haystack = `${p.name.ar} ${p.name.en} ${p.sku} ${p.material.ar} ${p.material.en} ${p.color.ar} ${p.color.en}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });

    result = [...result].sort((a, b) => {
      switch (sort) {
        case 'price-low': {
          const pa = a.price?.amount ?? Number.POSITIVE_INFINITY;
          const pb = b.price?.amount ?? Number.POSITIVE_INFINITY;
          return pa - pb;
        }
        case 'price-high': {
          const pa = a.price?.amount ?? 0;
          const pb = b.price?.amount ?? 0;
          return pb - pa;
        }
        case 'name':
          return loc(locale, a.name).localeCompare(loc(locale, b.name), locale === 'ar' ? 'ar' : 'en');
        case 'newest':
        default:
          return b.createdAt.localeCompare(a.createdAt);
      }
    });

    return result;
  }, [products, search, category, color, material, useCase, sort, locale]);

  const shown = filtered.slice(0, visible);
  const hasMore = visible < filtered.length;
  const hasFilters =
    search.trim() || category !== 'all' || color !== 'all' || material !== 'all' || useCase !== 'all';

  const resetFilters = () => {
    setSearch('');
    setCategory('all');
    setColor('all');
    setMaterial('all');
    setUseCase('all');
    setVisible(PAGE_SIZE);
  };

  const filterPanel = (
    <div className="space-y-6">
      {/* Search */}
      <div>
        <label className="block text-sm font-semibold text-charcoal dark:text-ivory mb-2">
          {t.search}
        </label>
        <div className="relative">
          <input
            type="search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setVisible(PAGE_SIZE);
            }}
            placeholder={t.searchPlaceholder}
            className="w-full h-10 ps-3 pe-9 rounded-xl bg-sand-100 dark:bg-charcoal-elevated border border-charcoal/10 dark:border-charcoal-border text-sm"
          />
          <SearchIcon className="absolute top-1/2 -translate-y-1/2 left-3 w-4 h-4 text-charcoal/40 dark:text-ivory/40 pointer-events-none" />
        </div>
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-semibold text-charcoal dark:text-ivory mb-2">
          {t.filterCategory}
        </label>
        <select
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setVisible(PAGE_SIZE);
          }}
          className="w-full h-10 px-3 rounded-xl bg-sand-100 dark:bg-charcoal-elevated border border-charcoal/10 dark:border-charcoal-border text-sm"
        >
          <option value="all">{t.filterAll}</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {loc(locale, c.name)}
            </option>
          ))}
        </select>
      </div>

      {/* Color */}
      <div>
        <label className="block text-sm font-semibold text-charcoal dark:text-ivory mb-2">
          {t.filterColor}
        </label>
        <select
          value={color}
          onChange={(e) => {
            setColor(e.target.value);
            setVisible(PAGE_SIZE);
          }}
          className="w-full h-10 px-3 rounded-xl bg-sand-100 dark:bg-charcoal-elevated border border-charcoal/10 dark:border-charcoal-border text-sm"
        >
          <option value="all">{t.filterAll}</option>
          {facets.colors.map((c) => (
            <option key={c.en} value={c.en}>
              {loc(locale, c)}
            </option>
          ))}
        </select>
      </div>

      {/* Material */}
      <div>
        <label className="block text-sm font-semibold text-charcoal dark:text-ivory mb-2">
          {t.filterMaterial}
        </label>
        <select
          value={material}
          onChange={(e) => {
            setMaterial(e.target.value);
            setVisible(PAGE_SIZE);
          }}
          className="w-full h-10 px-3 rounded-xl bg-sand-100 dark:bg-charcoal-elevated border border-charcoal/10 dark:border-charcoal-border text-sm"
        >
          <option value="all">{t.filterAll}</option>
          {facets.materials.map((m) => (
            <option key={m.en} value={m.en}>
              {loc(locale, m)}
            </option>
          ))}
        </select>
      </div>

      {/* Use */}
      <div>
        <label className="block text-sm font-semibold text-charcoal dark:text-ivory mb-2">
          {t.filterUse}
        </label>
        <div className="flex flex-wrap gap-2">
          {(['residential', 'commercial', 'mosque', 'kids'] as const).map((u) => {
            const labels = {
              residential: t.useResidential,
              commercial: t.useCommercial,
              mosque: t.useMosque,
              kids: t.useKids,
            } as const;
            const active = useCase === u;
            return (
              <button
                key={u}
                onClick={() => {
                  setUseCase(active ? 'all' : u);
                  setVisible(PAGE_SIZE);
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  active
                    ? 'bg-forest text-ivory border-forest'
                    : 'border-charcoal/15 dark:border-charcoal-border text-charcoal/70 dark:text-ivory/70 hover:border-forest dark:hover:border-forest-light'
                }`}
              >
                {labels[u]}
              </button>
            );
          })}
        </div>
      </div>

      {hasFilters && (
        <button
          onClick={resetFilters}
          className="w-full h-10 rounded-xl border border-charcoal/15 dark:border-charcoal-border text-sm font-medium hover:border-forest dark:hover:border-forest-light transition-colors"
        >
          {t.resetFilters}
        </button>
      )}
    </div>
  );

  return (
    <div className="bg-ivory dark:bg-charcoal min-h-screen">
      {/* Page header */}
      <div className="bg-sand-50 dark:bg-charcoal-light border-b border-charcoal/5 dark:border-charcoal-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-charcoal dark:text-ivory mb-2">
                {category !== 'all' && getCategory(category)
                  ? loc(locale, getCategory(category)!.name)
                  : t.catalogTitle}
              </h1>
              <p className="text-charcoal/60 dark:text-ivory/60">{t.catalogSubtitle}</p>
            </div>
            {/* Admin: add product to the current category (only visible to admins) */}
            <AddProductButton
              categoryId={category !== 'all' ? category : categories[0]?.id || 'carpets-rugs'}
              categoryName={
                (category !== 'all' && getCategory(category)
                  ? getCategory(category)!.name
                  : categories[0]?.name) || { ar: '', en: '' }
              }
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="lg:grid lg:grid-cols-[260px_1fr] lg:gap-10">
          {/* Desktop sidebar */}
          <aside className="hidden lg:block">
            <div className="sticky top-28">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-bold text-lg text-charcoal dark:text-ivory">{t.filters}</h2>
              </div>
              {filterPanel}
            </div>
          </aside>

          {/* Results */}
          <div>
            {/* Toolbar */}
            <div className="flex items-center justify-between gap-4 mb-6">
              <p className="text-sm text-charcoal/60 dark:text-ivory/60">
                {filtered.length} {t.productsFound}
              </p>
              <div className="flex items-center gap-2">
                {/* Mobile filter toggle */}
                <button
                  onClick={() => setDrawerOpen(true)}
                  className="lg:hidden inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-charcoal/15 dark:border-charcoal-border text-sm font-medium"
                >
                  <ChevronDownIcon className="w-4 h-4" />
                  {t.showFilters}
                </button>
                {/* Sort */}
                <label className="flex items-center gap-2 text-sm">
                  <span className="text-charcoal/60 dark:text-ivory/60 hidden sm:inline">
                    {t.sortBy}
                  </span>
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value as SortKey)}
                    className="h-10 px-3 rounded-xl bg-sand-100 dark:bg-charcoal-elevated border border-charcoal/10 dark:border-charcoal-border text-sm"
                  >
                    <option value="newest">{t.sortNewest}</option>
                    <option value="price-low">{t.sortPriceLow}</option>
                    <option value="price-high">{t.sortPriceHigh}</option>
                    <option value="name">{t.sortName}</option>
                  </select>
                </label>
              </div>
            </div>

            {/* Grid or empty state */}
            {shown.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="text-5xl mb-4 opacity-30" aria-hidden="true">🔍</div>
                <h3 className="text-lg font-semibold text-charcoal dark:text-ivory mb-2">
                  {t.noProducts}
                </h3>
                <p className="text-sm text-charcoal/60 dark:text-ivory/60 mb-6">
                  {t.noProductsHint}
                </p>
                <button
                  onClick={resetFilters}
                  className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-forest text-ivory text-sm font-medium hover:bg-forest-light transition-colors"
                >
                  {t.resetFilters}
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                  {shown.map((product) => (
                    <ProductCard key={product.slug} product={product} />
                  ))}
                </div>

                {/* Load more */}
                {hasMore && (
                  <div className="flex justify-center mt-10">
                    <button
                      onClick={() => setVisible((v) => v + PAGE_SIZE)}
                      className="h-11 px-8 rounded-xl border-2 border-forest/20 dark:border-forest-light/30 text-forest dark:text-forest-light font-medium hover:border-forest dark:hover:border-forest-light transition-colors"
                    >
                      {t.loadMore}
                    </button>
                  </div>
                )}
                {!hasMore && filtered.length > PAGE_SIZE && (
                  <p className="text-center text-sm text-charcoal/50 dark:text-ivory/45 mt-8">
                    {t.showingAll}
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ═══ Mobile filter drawer ═══ */}
      {drawerOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-3xl bg-ivory dark:bg-charcoal p-6 pb-24">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-bold text-lg text-charcoal dark:text-ivory">{t.filters}</h2>
              <button
                onClick={() => setDrawerOpen(false)}
                aria-label={t.close}
                className="w-9 h-9 flex items-center justify-center rounded-full border border-charcoal/15 dark:border-charcoal-border"
              >
                <CloseIcon className="w-4 h-4" />
              </button>
            </div>
            {filterPanel}
            <button
              onClick={() => setDrawerOpen(false)}
              className="absolute bottom-6 inset-x-6 h-12 rounded-xl bg-forest text-ivory font-medium"
            >
              {t.applyFilters}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
