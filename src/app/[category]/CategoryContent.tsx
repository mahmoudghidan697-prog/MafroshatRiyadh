'use client';

import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useSiteData } from '@/hooks/useSiteData';
import { loc, formatPrice } from '@/lib/i18n';
import { useContacts } from '@/hooks/useContacts';
import { ContactEditBadge } from '@/components/ContactEditBadge';
import { ProductCard } from '@/components/ProductCard';
import { ScrollReveal } from '@/components/ScrollReveal';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  WhatsAppIcon,
  PhoneIcon,
  ArrowRightIcon,
  ChevronDownIcon,
  SparkleIcon,
} from '@/components/Icons';

export default function CategoryContent({ categoryId }: { categoryId: string }) {
  const { locale, t } = useApp();
  const { waLink, phoneLink, number: contactNumber } = useContacts();
  const { products, categories, loading, refresh } = useSiteData();
  const [activeImage, setActiveImage] = useState(0);
  const [openSpec, setOpenSpec] = useState(true);

  const category = categories.find((c) => c.id === categoryId);

  // Only call notFound after loading is complete to avoid false 404s
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

  // Primary product: from admin setting, or first product in category
  const primaryProduct = category.primaryProductId
    ? products.find((p) => p.slug === category.primaryProductId) || categoryProducts[0]
    : categoryProducts[0];

  // Related products (other products in same category)
  const related = categoryProducts.filter((p) => p.slug !== primaryProduct?.slug).slice(0, 4);

  // Prefilled WhatsApp message for this product
  const detailName = primaryProduct ? (locale === 'ar' ? primaryProduct.name.ar : primaryProduct.name.en) : '';
  const detailNameLabel = locale === 'ar' ? 'اسم المنتج' : 'Product';
  const detailSkuLabel = locale === 'ar' ? 'رمز المنتج' : 'SKU';
  let detailWaMsg = `${t.whatsappMessageDefault}\n${detailNameLabel}: ${detailName}`;
  if (primaryProduct?.sku) detailWaMsg += `\n${detailSkuLabel}: ${primaryProduct.sku}`;

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
          <ScrollReveal>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-charcoal dark:text-ivory mb-3 font-arabic">
              {categoryName}
            </h1>
            <p className="text-charcoal/60 dark:text-ivory/60 max-w-2xl leading-relaxed">
              {categoryDescription}
            </p>
          </ScrollReveal>
        </div>
      </div>

      {/* Primary product display */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        {!primaryProduct ? (
          <EmptyState />
        ) : (
          <>
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-14">
              {/* ═══ Gallery ═══ */}
              <div>
                <div className="aspect-[4/3] rounded-2xl overflow-hidden relative bg-sand-100 dark:bg-charcoal-elevated">
                  <img
                    key={primaryProduct.images[activeImage]}
                    src={primaryProduct.images[activeImage]}
                    alt={`${loc(locale, primaryProduct.name)} — ${t.galleryImage} ${activeImage + 1}`}
                    className="w-full h-full object-cover"
                    loading="eager"
                    decoding="async"
                  />
                  {primaryProduct.featured && (
                    <span className="absolute top-4 inset-inline-start-4 inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-forest text-ivory text-xs font-semibold">
                      <SparkleIcon className="w-3 h-3" />
                      {t.featured}
                    </span>
                  )}
                </div>
                {/* Thumbnails */}
                {primaryProduct.images.length > 1 && (
                  <div className="flex gap-2 mt-4 overflow-x-auto pb-2 scrollbar-hide max-w-full">
                    {primaryProduct.images.map((img, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveImage(i)}
                        aria-label={`${t.galleryImage} ${i + 1}`}
                        aria-current={activeImage === i}
                        className={`shrink-0 basis-16 sm:basis-24 grow-0 w-16 h-16 sm:w-24 sm:h-24 rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                          activeImage === i
                            ? 'border-forest dark:border-forest-light'
                            : 'border-transparent'
                        }`}
                      >
                        <img
                          src={img}
                          alt={`${t.galleryImage} ${i + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* ═══ Info ═══ */}
              <div>
                <span className="text-xs uppercase tracking-wider text-olive dark:text-olive/80 font-semibold">
                  {categoryName}
                </span>
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-charcoal dark:text-ivory mt-2 mb-3 leading-tight">
                  {loc(locale, primaryProduct.name)}
                </h2>

                <div className="flex items-baseline gap-3 mb-5">
                  {primaryProduct.price ? (
                    <span className="text-xl sm:text-2xl font-bold text-forest dark:text-forest-light">
                      {formatPrice(locale, primaryProduct.price.amount, primaryProduct.price.currency)}
                    </span>
                  ) : (
                    <span className="text-lg font-semibold text-charcoal/70 dark:text-ivory/60">
                      {t.priceOnRequest}
                    </span>
                  )}
                  {primaryProduct.unit && (
                    <span className="text-sm text-charcoal/50 dark:text-ivory/45">
                      {loc(locale, primaryProduct.unit)}
                    </span>
                  )}
                </div>

                {/* Quick specs */}
                <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm sm:text-base text-charcoal/70 dark:text-ivory/65 mb-6">
                  {primaryProduct.dimensions && (
                    <span>
                      <span className="font-medium text-charcoal dark:text-ivory">{t.dimensions}:</span>{' '}
                      {loc(locale, primaryProduct.dimensions)}
                    </span>
                  )}
                  <span>
                    <span className="font-medium text-charcoal dark:text-ivory">{t.material}:</span>{' '}
                    {loc(locale, primaryProduct.material)}
                  </span>
                  <span>
                    <span className="font-medium text-charcoal dark:text-ivory">{t.colorLabel}:</span>{' '}
                    {loc(locale, primaryProduct.color)}
                  </span>
                  {primaryProduct.sku && (
                    <span className="font-mono text-xs bg-sand-100 dark:bg-charcoal-elevated px-2 py-1 rounded">
                      {t.sku}: {primaryProduct.sku}
                    </span>
                  )}
                </div>

                {/* Contact CTAs */}
                <div className="flex flex-wrap gap-3 mb-8">
                  <div className="relative">
                    <a
                      href={waLink('product_detail_whatsapp', detailWaMsg)}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-contact-key="product_detail_whatsapp"
                      className="inline-flex items-center gap-2 h-12 px-6 rounded-xl bg-[#25D366] text-white font-medium hover:brightness-95 transition-all"
                    >
                      <WhatsAppIcon className="w-5 h-5" />
                      {t.inquireWhatsapp}
                    </a>
                    <span className="absolute -top-1 -end-1">
                      <ContactEditBadge contactKey="product_detail_whatsapp" currentNumber={contactNumber('product_detail_whatsapp')} onSaved={refresh} />
                    </span>
                  </div>
                  <div className="relative">
                    <a
                      href={phoneLink('product_detail_phone')}
                      data-contact-key="product_detail_phone"
                      className="inline-flex items-center gap-2 h-12 px-6 rounded-xl bg-forest text-ivory font-medium hover:bg-forest-light transition-colors"
                    >
                      <PhoneIcon className="w-5 h-5" />
                      {t.callNow}
                    </a>
                    <span className="absolute -top-1 -end-1">
                      <ContactEditBadge contactKey="product_detail_phone" currentNumber={contactNumber('product_detail_phone')} onSaved={refresh} />
                    </span>
                  </div>
                </div>

                {/* Description */}
                <div className="mb-8">
                  <h3 className="font-bold text-lg text-charcoal dark:text-ivory mb-3">
                    {t.description}
                  </h3>
                  <p className="text-charcoal/70 dark:text-ivory/70 leading-relaxed">
                    {loc(locale, primaryProduct.description)}
                  </p>
                </div>

                {/* Variations */}
                {primaryProduct.variations && primaryProduct.variations.length > 0 && (
                  <div className="mb-8">
                    <h3 className="font-semibold text-charcoal dark:text-ivory mb-3">
                      {t.variations}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {primaryProduct.variations.map((v, i) => (
                        <span
                          key={i}
                          className="px-3 py-1.5 rounded-full border border-charcoal/15 dark:border-charcoal-border text-sm"
                        >
                          {loc(locale, v)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Specs accordion */}
                <div className="rounded-2xl border border-charcoal/10 dark:border-charcoal-border overflow-hidden">
                  <button
                    onClick={() => setOpenSpec(!openSpec)}
                    aria-expanded={openSpec}
                    className="w-full flex items-center justify-between p-4 bg-sand-50 dark:bg-charcoal-light text-start"
                  >
                    <span className="font-semibold text-charcoal dark:text-ivory">
                      {t.specifications}
                    </span>
                    <ChevronDownIcon
                      className={`w-4 h-4 transition-transform ${openSpec ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {openSpec && (
                    <table className="w-full text-sm">
                      <tbody>
                        {primaryProduct.specs.map((spec, i) => (
                          <tr
                            key={i}
                            className="border-t border-charcoal/5 dark:border-charcoal-border"
                          >
                            <td className="p-3 text-charcoal/60 dark:text-ivory/55 w-1/3">
                              {loc(locale, spec.label)}
                            </td>
                            <td className="p-3 font-medium text-charcoal dark:text-ivory">
                              {loc(locale, spec.value)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>

            {/* ═══ Related products ═══ */}
            {related.length > 0 && (
              <section className="mt-16 lg:mt-20">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xl lg:text-2xl font-bold text-charcoal dark:text-ivory">
                    {t.relatedProducts}
                  </h2>
                  <Link
                    href="/catalog"
                    className="inline-flex items-center gap-2 text-sm font-medium text-forest dark:text-forest-light hover:gap-3 transition-all"
                  >
                    {t.backToCatalog}
                    <ArrowRightIcon className="w-4 h-4 flip-rtl" />
                  </Link>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                  {related.map((rp) => (
                    <ProductCard key={rp.slug} product={rp} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="bg-ivory dark:bg-charcoal min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-14">
          <div className="aspect-[4/3] rounded-2xl bg-sand-100 dark:bg-charcoal-elevated animate-pulse" />
          <div className="space-y-4">
            <div className="h-6 w-24 rounded bg-sand-100 dark:bg-charcoal-elevated animate-pulse" />
            <div className="h-10 w-3/4 rounded bg-sand-100 dark:bg-charcoal-elevated animate-pulse" />
            <div className="h-12 w-full rounded-xl bg-sand-100 dark:bg-charcoal-elevated animate-pulse" />
            <div className="h-20 w-full rounded bg-sand-100 dark:bg-charcoal-elevated animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-16">
      <p className="text-charcoal/60 dark:text-ivory/60 mb-6">
        لا توجد منتجات في هذا القسم حالياً.
      </p>
      <Link
        href="/catalog"
        className="inline-flex items-center gap-2 h-12 px-6 rounded-xl bg-forest text-ivory font-medium hover:bg-forest-light transition-colors"
      >
        تصفح الكتالوج
        <ArrowRightIcon className="w-4 h-4 flip-rtl" />
      </Link>
    </div>
  );
}
