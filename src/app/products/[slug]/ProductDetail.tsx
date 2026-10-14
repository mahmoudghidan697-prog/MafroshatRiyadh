'use client';

import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { getCategory as staticGetCategory, productWhatsappLink, phoneLink } from '@/data/site';
import { loc, formatPrice } from '@/lib/i18n';
import { ProductCard } from '@/components/ProductCard';
import { AddProductImagesButton } from '@/components/AddProductImagesButton';
import { useSiteData } from '@/hooks/useSiteData';
import {
  WhatsAppIcon,
  PhoneIcon,
  ArrowRightIcon,
  ChevronDownIcon,
  SparkleIcon,
} from '@/components/Icons';

export default function ProductPage({ params }: { params: { slug: string } }) {
  const { locale, t } = useApp();
  const [activeImage, setActiveImage] = useState(0);
  const [openSpec, setOpenSpec] = useState(true);

  // Live catalog data from the DB (falls back to static seed)
  const { products, categories, loading } = useSiteData();
  const product = products.find((p) => p.slug === params.slug);
  const category = categories.find((c) => c.id === product?.category) || staticGetCategory(product?.category || '');

  // Still loading and product not found yet — show a loading state
  if (loading && !product) {
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

  // Truly not found (after load completed)
  if (!product) {
    return (
      <div className="bg-ivory dark:bg-charcoal min-h-screen flex flex-col items-center justify-center text-center px-4 py-20">
        <div className="text-6xl mb-4 opacity-30" aria-hidden="true">🔍</div>
        <h1 className="text-2xl font-bold text-charcoal dark:text-ivory mb-3">
          {t.notFoundTitle}
        </h1>
        <p className="text-charcoal/60 dark:text-ivory/60 mb-8 max-w-md">
          {t.notFoundText}
        </p>
        <a
          href="/catalog"
          className="inline-flex items-center gap-2 h-12 px-6 rounded-xl bg-forest text-ivory font-medium hover:bg-forest-light transition-colors"
        >
          {t.backToCatalog}
        </a>
      </div>
    );
  }

  // Related products from the live catalog (same category first)
  const related = [
    ...products.filter((p) => p.category === product.category && p.slug !== product.slug),
    ...products.filter((p) => p.category !== product.category && p.slug !== product.slug),
  ].slice(0, 4);

  return (
    <div className="bg-ivory dark:bg-charcoal">
      {/* Breadcrumb */}
      <div className="border-b border-charcoal/5 dark:border-charcoal-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav aria-label="breadcrumb" className="flex items-center gap-2 text-sm text-charcoal/50 dark:text-ivory/45 flex-wrap">
            <a href="/" className="hover:text-forest dark:hover:text-forest-light">
              {t.home}
            </a>
            <span aria-hidden="true">/</span>
            <a href="/catalog" className="hover:text-forest dark:hover:text-forest-light">
              {t.catalogTitle}
            </a>
            {category && (
              <>
                <span aria-hidden="true">/</span>
                <span className="text-charcoal dark:text-ivory font-medium">
                  {loc(locale, category.name)}
                </span>
              </>
            )}
            <span aria-hidden="true">/</span>
            <span className="text-charcoal dark:text-ivory font-medium">
              {loc(locale, product.name)}
            </span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-14">
          {/* ═══ Gallery ═══ */}
          <div>
            <div className="aspect-[4/3] rounded-2xl overflow-hidden relative bg-sand-100 dark:bg-charcoal-elevated">
              <img
                key={product.images[activeImage]}
                src={product.images[activeImage]}
                alt={`${loc(locale, product.name)} — ${t.galleryImage} ${activeImage + 1}`}
                className="w-full h-full object-cover"
                loading="eager"
                decoding="async"
              />
              {product.featured && (
                <span className="absolute top-4 inset-inline-start-4 inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-forest text-ivory text-xs font-semibold">
                  <SparkleIcon className="w-3 h-3" />
                  {t.featured}
                </span>
              )}
            </div>
            {/* Thumbnails */}
            {product.images.length > 1 && (
              <div className="flex gap-3 mt-4">
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    aria-label={`${t.galleryImage} ${i + 1}`}
                    aria-current={activeImage === i}
                    className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition-colors ${
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
            {/* Admin: add/change product images (only visible to logged-in admins) */}
            <div className="mt-4">
              <AddProductImagesButton product={product} />
            </div>
          </div>

          {/* ═══ Info ═══ */}
          <div>
            {category && (
              <span className="text-xs uppercase tracking-wider text-olive dark:text-olive/80 font-semibold">
                {loc(locale, category.name)}
              </span>
            )}
            <h1 className="text-2xl lg:text-4xl font-bold text-charcoal dark:text-ivory mt-2 mb-4 leading-tight">
              {loc(locale, product.name)}
            </h1>

            <div className="flex items-baseline gap-3 mb-6">
              {product.price ? (
                <span className="text-2xl lg:text-3xl font-bold text-forest dark:text-forest-light">
                  {formatPrice(locale, product.price.amount, product.price.currency)}
                </span>
              ) : (
                <span className="text-xl font-semibold text-charcoal/70 dark:text-ivory/60">
                  {t.priceOnRequest}
                </span>
              )}
              {product.unit && (
                <span className="text-sm text-charcoal/50 dark:text-ivory/45">
                  {loc(locale, product.unit)}
                </span>
              )}
            </div>

            {/* Quick specs */}
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-charcoal/70 dark:text-ivory/65 mb-6">
              {product.dimensions && (
                <span>
                  <span className="font-medium text-charcoal dark:text-ivory">{t.dimensions}:</span>{' '}
                  {loc(locale, product.dimensions)}
                </span>
              )}
              <span>
                <span className="font-medium text-charcoal dark:text-ivory">{t.material}:</span>{' '}
                {loc(locale, product.material)}
              </span>
              <span>
                <span className="font-medium text-charcoal dark:text-ivory">{t.colorLabel}:</span>{' '}
                {loc(locale, product.color)}
              </span>
              <span className="font-mono text-xs bg-sand-100 dark:bg-charcoal-elevated px-2 py-1 rounded">
                {t.sku}: {product.sku}
              </span>
            </div>

            {/* Contact CTAs */}
            <div className="flex flex-wrap gap-3 mb-8">
              <a
                href={productWhatsappLink(product, locale)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 h-12 px-6 rounded-xl bg-[#25D366] text-white font-medium hover:brightness-95 transition-all"
              >
                <WhatsAppIcon className="w-5 h-5" />
                {t.inquireWhatsapp}
              </a>
              <a
                href={phoneLink()}
                className="inline-flex items-center gap-2 h-12 px-6 rounded-xl bg-forest text-ivory font-medium hover:bg-forest-light transition-colors"
              >
                <PhoneIcon className="w-5 h-5" />
                {t.callNow}
              </a>
            </div>

            {/* Description */}
            <div className="mb-8">
              <h2 className="font-bold text-lg text-charcoal dark:text-ivory mb-3">
                {t.description}
              </h2>
              <p className="text-charcoal/70 dark:text-ivory/70 leading-relaxed">
                {loc(locale, product.description)}
              </p>
            </div>

            {/* Variations */}
            {product.variations && product.variations.length > 0 && (
              <div className="mb-8">
                <h3 className="font-semibold text-charcoal dark:text-ivory mb-3">
                  {t.variations}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {product.variations.map((v, i) => (
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
                    {product.specs.map((spec, i) => (
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

        {/* ═══ Related ═══ */}
        <section className="mt-16 lg:mt-20">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl lg:text-2xl font-bold text-charcoal dark:text-ivory">
              {t.relatedProducts}
            </h2>
            <a
              href="/catalog"
              className="inline-flex items-center gap-2 text-sm font-medium text-forest dark:text-forest-light hover:gap-3 transition-all"
            >
              {t.backToCatalog}
              <ArrowRightIcon className="w-4 h-4 flip-rtl" />
            </a>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {related.map((rp) => (
              <ProductCard key={rp.slug} product={rp} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
