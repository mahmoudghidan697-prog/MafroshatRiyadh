'use client';

import { useApp } from '@/context/AppContext';
import { whatsappLink, phoneLink, business } from '@/data/site';
import { loc } from '@/lib/i18n';
import { ProductCard } from '@/components/ProductCard';
import { SectionHeader } from '@/components/SectionHeader';
import { ScrollReveal } from '@/components/ScrollReveal';
import { useSiteData } from '@/hooks/useSiteData';
import { ReviewForm } from '@/components/ReviewForm';
import {
  WhatsAppIcon,
  PhoneIcon,
  ArrowRightIcon,
  SparkleIcon,
  StarIcon,
  RulerIcon,
  ChevronDownIcon,
} from '@/components/Icons';
import { ServiceIcon } from '@/components/Icons';
import { useState } from 'react';

export default function HomePage() {
  const { locale, t } = useApp();
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Live catalog data from the DB (falls back to static seed)
  const { products, categories, testimonials: testimonialsFromDb, services, faqs } = useSiteData();
  const featured = products.filter((p) => p.featured);
  const galleryItems = products.slice(0, 6);
  const waDefault = whatsappLink(t.whatsappMessageDefault, locale);

  const testimonials = [
    {
      name: { ar: 'أبو عبدالله', en: 'Abu Abdullah' },
      role: { ar: 'عميل — حي الملقا', en: 'Customer — Al Malqa' },
      quote: {
        ar: 'فرّشنا المجلس كامل بسجاد ممتاز، القياس والتركيب كانوا سريعين ونظيفين. الأسعار منطوية جداً والتعامل محترم.',
        en: 'We furnished the whole majlis with excellent carpet. Measurement and installation were fast and clean. Fair prices and respectful service.',
      },
    },
    {
      name: { ar: 'نورة العتيبي', en: 'Noura Al Otaibi' },
      role: { ar: 'عميلة — حي النرجس', en: 'Customer — Al Narjis' },
      quote: {
        ar: 'اختارت موكيت لغرف الأطفال وتخطوا توقعاتي بالجودة. الفريق ساعدني أختار الألوان المناسبة والتوصيل كان في الموعد.',
        en: 'I picked moquette for the kids rooms and the quality exceeded my expectations. The team helped me choose colors and delivery was on time.',
      },
    },
    {
      name: { ar: 'م. سلطان', en: 'Eng. Sultan' },
      role: { ar: 'عميل — مكتب إداري', en: 'Customer — Office' },
      quote: {
        ar: 'ركّبوا بلاط موكيت للمكتب باحترافية عالية، الشكل النهائي نظيف ومتين. أنصح بالتعامل معهم لأي مشروع تجاري.',
        en: 'They installed carpet tiles for our office with high professionalism. The final look is clean and durable. I recommend them for any commercial project.',
      },
    },
  ];

  // Static fallback testimonials, localized to plain strings (used only
  // until real approved reviews exist in the database).
  const localizedTestimonials = testimonials.map((item) => ({
    name: loc(locale, item.name),
    role: loc(locale, item.role),
    quote: loc(locale, item.quote),
    rating: 5,
  }));

  return (
    <>
      {/* ═══════════════ HERO ═══════════════ */}
      <section className="relative overflow-hidden min-h-[80vh] lg:min-h-[88vh] flex items-center">
        {/* Full-bleed background image */}
        <img
          src="/images/categories/carpets-rugs.jpg"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Dark overlay for text readability (light + dark mode) */}
        <div
          className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/55 to-black/70 dark:from-black/75 dark:via-black/60 dark:to-black/80"
          aria-hidden="true"
        />

        {/* Content */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28 w-full">
          <div className="max-w-2xl">
            <h1 className="hero-anim hero-anim-1 font-arabic text-3xl sm:text-4xl lg:text-5xl xl:text-[3.6rem] font-bold leading-[1.15] tracking-tight text-white mb-5 drop-shadow-lg">
              {t.heroTitle}
            </h1>
            <p className="hero-anim hero-anim-2 text-base lg:text-lg text-white/85 leading-relaxed mb-8 max-w-xl drop-shadow">
              {t.heroSubtitle}
            </p>
            <div className="hero-anim hero-anim-4 flex flex-wrap gap-3">
              <a
                href="/catalog"
                className="btn-press inline-flex items-center gap-2 h-12 px-6 rounded-xl bg-forest text-ivory font-medium hover:bg-forest-light shadow-lg hover:shadow-xl"
              >
                {t.heroCtaBrowse}
                <ArrowRightIcon className="w-4 h-4 flip-rtl" />
              </a>
              <a
                href={waDefault}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-press inline-flex items-center gap-2 h-12 px-6 rounded-xl bg-[#25D366] text-white font-medium hover:brightness-95 shadow-lg"
              >
                <WhatsAppIcon className="w-5 h-5" />
                {t.heroCtaWhatsapp}
              </a>
              <a
                href={phoneLink()}
                className="btn-press inline-flex items-center gap-2 h-12 px-6 rounded-xl border-2 border-white/30 text-white font-medium hover:border-white hover:bg-white/10 backdrop-blur-sm"
              >
                <PhoneIcon className="w-5 h-5" />
                {t.heroCtaCall}
              </a>
            </div>

            {/* Product count badge */}
            <div className="hero-anim hero-anim-4 mt-10 inline-flex items-center gap-3 px-5 py-3 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-sm">
              <span className="text-3xl font-bold text-white">{products.length}+</span>
              <span className="text-sm text-white/80">{t.productsAvailable}</span>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ CATEGORIES ═══════════════ */}
      <section id="categories" className="py-16 lg:py-24 bg-ivory dark:bg-charcoal">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow={business.name.ar}
            title={t.categoriesTitle}
            subtitle={t.categoriesSubtitle}
          />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 lg:gap-5">
            {categories.map((cat, i) => (
              <ScrollReveal key={cat.id} delay={i * 50} y={20} className="h-full">
                <a
                  id={`category-${cat.id}`}
                  href={`/catalog?category=${cat.id}`}
                  className="card-lift group flex flex-col h-full rounded-2xl bg-sand-50 dark:bg-charcoal-light border border-charcoal/5 dark:border-charcoal-border overflow-hidden hover:shadow-card hover:border-forest/25 dark:hover:border-forest-light/25"
                >
                  <div className="aspect-[4/3] overflow-hidden">
                    <img
                      src={cat.image}
                      alt={loc(locale, cat.name)}
                      loading="lazy"
                      className="w-full h-full object-cover img-zoom"
                    />
                  </div>
                  <div className="p-3 lg:p-4 text-center flex-1 flex items-center justify-center min-h-[3rem]">
                    <h3 className="font-semibold text-sm lg:text-base text-charcoal dark:text-ivory group-hover:text-forest dark:group-hover:text-forest-light transition-colors line-clamp-2">
                      {loc(locale, cat.name)}
                    </h3>
                  </div>
                </a>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ FEATURED PRODUCTS ═══════════════ */}
      <section id="featured" className="py-16 lg:py-24 bg-sand-50 dark:bg-charcoal-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8 lg:mb-14">
            <ScrollReveal>
              <h2 className="text-xl sm:text-3xl lg:text-4xl font-bold text-charcoal dark:text-ivory tracking-tight mb-2">
                {t.featuredTitle}
              </h2>
              <p className="text-sm sm:base text-charcoal/60 dark:text-ivory/60 max-w-xl">
                {t.featuredSubtitle}
              </p>
            </ScrollReveal>
            <ScrollReveal delay={100}>
              <a
                href="/catalog"
                className="btn-press inline-flex items-center gap-2 text-sm font-medium text-forest dark:text-forest-light hover:gap-3 transition-all shrink-0"
              >
                {t.viewProducts}
                <ArrowRightIcon className="w-4 h-4 flip-rtl" />
              </a>
            </ScrollReveal>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 lg:gap-6">
            {featured.map((product, i) => (
              <ScrollReveal key={product.slug} delay={(i % 4) * 80} y={20} className="h-full">
                <ProductCard product={product} />
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ SERVICES ═══════════════ */}
      <section id="services" className="py-16 lg:py-24 bg-ivory dark:bg-charcoal">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader title={t.servicesTitle} subtitle={t.servicesSubtitle} />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {services.map((service, i) => (
              <ScrollReveal key={service.icon} delay={i * 80} y={20}>
                <div className="card-lift h-full flex flex-col items-start p-6 rounded-2xl bg-sand-50 dark:bg-charcoal-light border border-charcoal/5 dark:border-charcoal-border hover:shadow-card hover:border-forest/20">
                  <div className="w-12 h-12 rounded-xl bg-forest/10 dark:bg-forest-light/15 text-forest dark:text-forest-light flex items-center justify-center mb-4">
                    <ServiceIcon name={service.icon} />
                  </div>
                  <h3 className="font-semibold text-charcoal dark:text-ivory mb-2">
                    {loc(locale, service.title)}
                  </h3>
                  <p className="text-sm text-charcoal/60 dark:text-ivory/60 leading-relaxed">
                    {loc(locale, service.description)}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ GALLERY ═══════════════ */}
      <section id="gallery" className="py-16 lg:py-24 bg-sand-50 dark:bg-charcoal-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader title={t.galleryTitle} subtitle={t.gallerySubtitle} />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 lg:gap-4">
            {galleryItems.map((item, i) => (
              <ScrollReveal key={item.slug} delay={(i % 3) * 80} y={20}>
                <div
                  className={`card-lift group relative rounded-2xl overflow-hidden ${
                    i === 0 ? 'aspect-[4/3] md:row-span-2 md:aspect-auto md:h-full' : 'aspect-[4/3]'
                  }`}
                >
                  <img
                    src={item.images[0]}
                    alt={loc(locale, item.name)}
                    loading="lazy"
                    className="w-full h-full object-cover img-zoom"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                    <span className="text-xs text-white font-medium">
                      {loc(locale, item.name)}
                    </span>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ ABOUT ═══════════════ */}
      <section id="about" className="py-14 lg:py-24 bg-ivory dark:bg-charcoal">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <ScrollReveal>
              <h2 className="text-xl sm:text-3xl lg:text-4xl font-bold text-charcoal dark:text-ivory tracking-tight mb-4 sm:mb-6">
                {t.aboutTitle}
              </h2>
              <p className="text-sm sm:text-base text-charcoal/70 dark:text-ivory/70 leading-relaxed mb-6">
                {t.aboutText}
              </p>
              <ul className="space-y-3">
                {[t.aboutPoint1, t.aboutPoint2, t.aboutPoint3].map((point) => (
                  <li key={point} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-forest/10 dark:bg-forest-light/15 flex items-center justify-center shrink-0 mt-0.5">
                      <svg className="w-3 h-3 text-forest dark:text-forest-light" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                        <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <span className="text-charcoal/80 dark:text-ivory/80 text-sm sm:text-base">{point}</span>
                  </li>
                ))}
              </ul>
            </ScrollReveal>
            <ScrollReveal delay={100}>
              <div className="aspect-[4/3] rounded-3xl overflow-hidden shadow-card ring-1 ring-black/5 dark:ring-white/5">
                <img
                  src="/images/categories/mosque-carpets.jpg"
                  alt={t.aboutTitle}
                  className="w-full h-full object-cover img-zoom"
                />
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ═══════════════ FAQ ═══════════════ */}
      <section id="faq" className="py-16 lg:py-24 bg-sand-50 dark:bg-charcoal-light">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader title={t.faqTitle} subtitle={t.faqSubtitle} />
          <ScrollReveal className="space-y-3">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="rounded-2xl bg-ivory dark:bg-charcoal border border-charcoal/5 dark:border-charcoal-border overflow-hidden transition-colors hover:border-forest/20 dark:hover:border-forest-light/20"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  aria-expanded={openFaq === i}
                  className="btn-press w-full flex items-center justify-between gap-4 p-5 text-start hover:bg-sand-50 dark:hover:bg-charcoal-light"
                >
                  <span className="font-medium text-charcoal dark:text-ivory">
                    {loc(locale, faq.question)}
                  </span>
                  <ChevronDownIcon
                    className={`w-4 h-4 shrink-0 text-charcoal/40 dark:text-ivory/40 transition-transform duration-300 ${
                      openFaq === i ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {openFaq === i && (
                  <div className="slide-down px-5 pb-5 text-sm text-charcoal/70 dark:text-ivory/70 leading-relaxed">
                    {loc(locale, faq.answer)}
                  </div>
                )}
              </div>
            ))}
          </ScrollReveal>
        </div>
      </section>

      {/* ═══════════════ TESTIMONIALS ═══════════════ */}
      <section id="testimonials" className="py-16 lg:py-24 bg-sand-50 dark:bg-charcoal-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader title={t.testimonialsTitle} subtitle={t.testimonialsSubtitle} />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6">
            {(testimonialsFromDb.length > 0 ? testimonialsFromDb : localizedTestimonials).map(
              (item: any, i: number) => (
                <ScrollReveal key={item.id ?? i} delay={i * 80} className="h-full">
                  <figure className="h-full flex flex-col p-6 rounded-2xl bg-ivory dark:bg-charcoal border border-charcoal/5 dark:border-charcoal-border hover:shadow-card transition-shadow">
                    <div className="flex gap-0.5 text-amber-400 mb-3" aria-label={`${item.rating ?? 5}`}>
                      {Array.from({ length: item.rating ?? 5 }).map((_, s) => (
                        <StarIcon key={s} className="w-4 h-4" />
                      ))}
                    </div>
                    <blockquote className="flex-1 text-sm text-charcoal/80 dark:text-ivory/80 leading-relaxed mb-4">
                      “{item.quote}”
                    </blockquote>
                    <figcaption className="flex items-center gap-3 pt-4 border-t border-charcoal/5 dark:border-charcoal-border">
                      <div className="w-10 h-10 rounded-full bg-forest/10 dark:bg-forest-light/15 text-forest dark:text-forest-light flex items-center justify-center font-bold font-arabic">
                        {String(item.name ?? '').charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold text-sm text-charcoal dark:text-ivory">
                          {item.name}
                        </div>
                        <div className="text-xs text-charcoal/50 dark:text-ivory/50">{item.role}</div>
                      </div>
                    </figcaption>
                  </figure>
                </ScrollReveal>
              ),
            )}
          </div>

          {/* ── Submit a review ── */}
          <ScrollReveal delay={100}>
            <div className="mt-12 max-w-2xl mx-auto">
              <ReviewForm />
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ═══════════════ CTA ═══════════════ */}
      <section className="py-16 lg:py-24 bg-forest dark:bg-forest-deep text-ivory relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 opacity-10" aria-hidden="true">
          <div className="absolute -top-20 -end-20 w-80 h-80 rounded-full bg-ivory blur-3xl" />
        </div>
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <ScrollReveal>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 tracking-tight">
              {t.contactTitle}
            </h2>
            <p className="text-ivory/70 mb-8 max-w-xl mx-auto leading-relaxed">
              {t.contactSubtitle}
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <a
                href={whatsappLink(
                  locale === 'ar'
                    ? 'مرحباً، أرغب في طلب قياس مجاني للمكان'
                    : 'Hello, I would like to request a free measurement',
                  locale,
                )}
                target="_blank"
                rel="noopener noreferrer"
                title={t.freeMeasureTooltip}
                className="btn-press inline-flex items-center gap-2 h-12 px-6 rounded-xl bg-ivory text-forest font-semibold hover:bg-ivory/90 shadow-md"
              >
                <RulerIcon className="w-5 h-5" />
                {t.freeMeasure}
              </a>
              <a
                href={waDefault}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-press inline-flex items-center gap-2 h-12 px-6 rounded-xl bg-[#25D366] text-white font-medium hover:brightness-95 shadow-md"
              >
                <WhatsAppIcon className="w-5 h-5" />
                {t.whatsappLabel}
              </a>
              <a
                href={phoneLink()}
                className="btn-press inline-flex items-center gap-2 h-12 px-6 rounded-xl bg-ivory/15 text-ivory font-medium hover:bg-ivory/25"
              >
                <PhoneIcon className="w-5 h-5" />
                {t.callNow}
              </a>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </>
  );
}
