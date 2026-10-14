'use client';

import { useApp } from '@/context/AppContext';
import type { Product } from '@/data/site';
import { getCategory } from '@/data/site';
import { loc, formatPrice } from '@/lib/i18n';
import { useContacts } from '@/hooks/useContacts';
import { useSiteData } from '@/hooks/useSiteData';
import { ContactEditBadge } from '@/components/ContactEditBadge';
import { WhatsAppIcon, PhoneIcon, SparkleIcon, ArrowRightIcon, HeartIcon } from './Icons';
import { AdminProductActions } from './AdminProductActions';
import { useFavorites } from '@/hooks/useFavorites';

export function ProductCard({ product }: { product: Product }) {
  const { locale, t } = useApp();
  const { waLink, phoneLink, number: contactNumber } = useContacts();
  const { refresh } = useSiteData();
  const category = getCategory(product.category);
  const { isFavorite, toggle } = useFavorites();
  const fav = isFavorite(product.slug);

  // Prefilled WhatsApp message for this specific product
  const productName = locale === 'ar' ? product.name.ar : product.name.en;
  const nameLabel = locale === 'ar' ? 'اسم المنتج' : 'Product';
  const skuLabel = locale === 'ar' ? 'رمز المنتج' : 'SKU';
  let waMsg = `${t.whatsappMessageDefault}\n${nameLabel}: ${productName}`;
  if (product.sku) waMsg += `\n${skuLabel}: ${product.sku}`;

  return (
    <article className="card-lift group flex flex-col h-full rounded-2xl bg-ivory dark:bg-charcoal-light border border-charcoal/10 dark:border-charcoal-border overflow-hidden hover:shadow-card hover:border-forest/25 dark:hover:border-forest-light/25 relative">
      {/* Image */}
      <div className="block relative aspect-[4/3] overflow-hidden bg-sand-100 dark:bg-charcoal-elevated">
        {/* Stretched link makes the whole card clickable (no nested-interactive problem) */}
        <a href={`/products/${product.slug}`} className="absolute inset-0 z-[5]" aria-label={loc(locale, product.name)} />

        {/* Product image with alt text */}
        <img
          src={product.images[0]}
          alt={loc(locale, product.name)}
          className="w-full h-full object-cover img-zoom"
          loading="lazy"
        />

        {/* Admin quick actions — only rendered when logged in as admin */}
        <AdminProductActions product={product} />

        {/* Badges — top RIGHT corner (physical, always right) */}
        <div className="absolute top-3 right-3 flex flex-col gap-1.5 z-10 pointer-events-none">
          {product.featured && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-forest text-ivory text-[11px] font-semibold">
              <SparkleIcon className="w-3 h-3" />
              {t.featured}
            </span>
          )}
        </div>

        {/* Favorite (wishlist) toggle — top LEFT corner (physical left),
            sibling of the stretched link */}
        <button
          type="button"
          onClick={() => toggle(product.slug)}
          aria-label={fav ? (locale === 'ar' ? 'إزالة من المفضلة' : 'Remove from favorites') : locale === 'ar' ? 'أضف للمفضلة' : 'Add to favorites'}
          aria-pressed={fav}
          className={`absolute top-3 left-3 z-20 w-9 h-9 rounded-full flex items-center justify-center shadow-md transition-all duration-200 hover:scale-110 active:scale-95 ${
            fav
              ? 'bg-red-500 text-white'
              : 'bg-ivory/90 dark:bg-charcoal/90 text-charcoal/70 dark:text-ivory/70 hover:text-red-500'
          }`}
        >
          <HeartIcon className="w-4 h-4" filled={fav} />
        </button>

        {/* Quick actions — appear on hover (desktop) */}
        <div className="absolute bottom-3 inset-inline-end-3 flex gap-2 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-200 z-20 pointer-events-none group-hover:pointer-events-auto">
          <div className="relative flex items-center">
            <a
              href={waLink('product_whatsapp', waMsg)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t.inquireWhatsapp}
              title={t.inquireWhatsapp}
              data-contact-key="product_whatsapp"
              className="w-9 h-9 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-md hover:brightness-95"
            >
              <WhatsAppIcon className="w-4 h-4" />
            </a>
            <span className="absolute -top-1 -end-1">
              <ContactEditBadge contactKey="product_whatsapp" currentNumber={contactNumber('product_whatsapp')} onSaved={refresh} />
            </span>
          </div>
          <div className="relative flex items-center">
            <a
              href={phoneLink('product_phone')}
              aria-label={t.callNow}
              title={t.callNow}
              data-contact-key="product_phone"
              className="w-9 h-9 rounded-full bg-forest text-ivory flex items-center justify-center shadow-md hover:bg-forest-light"
            >
              <PhoneIcon className="w-4 h-4" />
            </a>
            <span className="absolute -top-1 -end-1">
              <ContactEditBadge contactKey="product_phone" currentNumber={contactNumber('product_phone')} onSaved={refresh} />
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4 lg:p-5">
        {category && (
          <span className="text-[11px] uppercase tracking-wider text-olive dark:text-olive/80 font-semibold mb-1.5">
            {loc(locale, category.name)}
          </span>
        )}

        <h3 className="font-semibold text-base lg:text-lg text-charcoal dark:text-ivory leading-snug mb-2">
          <a href={`/products/${product.slug}`} className="hover:text-forest dark:hover:text-forest-light transition-colors">
            {loc(locale, product.name)}
          </a>
        </h3>

        {/* Specs */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-charcoal/60 dark:text-ivory/55 mb-3">
          {product.dimensions && (
            <span>
              <span className="font-medium">{t.dimensions}:</span> {loc(locale, product.dimensions)}
            </span>
          )}
          <span>
            <span className="font-medium">{t.material}:</span> {loc(locale, product.material)}
          </span>
        </div>

        {/* Price + CTA */}
        <div className="mt-auto flex items-center justify-between pt-3 border-t border-charcoal/5 dark:border-charcoal-border/40">
          <div>
            {product.price ? (
              <span className="font-bold text-forest dark:text-forest-light">
                {formatPrice(locale, product.price.amount, product.price.currency)}
                {product.unit && (
                  <span className="text-xs font-normal text-charcoal/50 dark:text-ivory/45 ms-1">
                    {loc(locale, product.unit)}
                  </span>
                )}
              </span>
            ) : (
              <span className="text-sm text-charcoal/60 dark:text-ivory/55">
                {t.priceOnRequest}
              </span>
            )}
          </div>
          <a
            href={`/products/${product.slug}`}
            className="btn-press inline-flex items-center gap-1 text-sm font-medium text-forest dark:text-forest-light hover:gap-2 transition-all"
          >
            {t.viewDetails}
            <ArrowRightIcon className="w-3.5 h-3.5 flip-rtl" />
          </a>
        </div>
      </div>
    </article>
  );
}
