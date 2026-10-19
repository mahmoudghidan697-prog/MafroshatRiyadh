'use client';

import { useApp } from '@/context/AppContext';
import { ContactEditBadge } from '@/components/ContactEditBadge';
import { useSiteData } from '@/hooks/useSiteData';
import { useContacts } from '@/hooks/useContacts';
import { loc } from '@/lib/i18n';
import { SectionHeader } from '@/components/SectionHeader';
import { ScrollReveal } from '@/components/ScrollReveal';
import {
  WhatsAppIcon,
  PhoneIcon,
  ArrowRightIcon,
  OfficeIcon,
  MosqueIcon,
  HospitalIcon,
  HotelIcon,
  SchoolIcon,
  OutdoorIcon,
  SparkleIcon,
} from '@/components/Icons';

// ─── Use-case definitions ───

interface UseCase {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  title: { ar: string; en: string };
  description: { ar: string; en: string };
  categories: string[];
}

const allUseCases: UseCase[] = [
  {
    id: 'offices',
    icon: OfficeIcon,
    title: { ar: 'المكاتب', en: 'Offices' },
    description: {
      ar: 'سجاد مكاتب وبلاط سجاد عالي التحمل للمساحات التجارية والممرات.',
      en: 'High-traffic office carpet and carpet tiles for commercial spaces and corridors.',
    },
    categories: ['office-commercial', 'carpet-tiles'],
  },
  {
    id: 'mosques',
    icon: MosqueIcon,
    title: { ar: 'المساجد', en: 'Mosques' },
    description: {
      ar: 'سجاد مساجد عالي الكثافة مقاوم للاستخدام اليومي المكثف وسهل التنظيف.',
      en: 'High-density mosque carpets built for intensive daily use and easy cleaning.',
    },
    categories: ['mosque-carpets'],
  },
  {
    id: 'hospitals',
    icon: HospitalIcon,
    title: { ar: 'المستشفيات', en: 'Hospitals' },
    description: {
      ar: 'أرضيات فينيل صحية وسهلة التنظيف للمنشآت الطبية والعيادات.',
      en: 'Hygienic, easy-clean vinyl flooring for healthcare facilities and clinics.',
    },
    categories: ['vinyl-flooring', 'carpet-tiles'],
  },
  {
    id: 'hotels',
    icon: HotelIcon,
    title: { ar: 'الفنادق', en: 'Hotels' },
    description: {
      ar: 'موكيت وسجاد ممرات فاخر للفنادق والضيافة بتصاميم أنيقة.',
      en: 'Luxurious moquette and hallway runners for hotels and hospitality.',
    },
    categories: ['office-commercial', 'moquette', 'runners-stairs'],
  },
  {
    id: 'schools',
    icon: SchoolIcon,
    title: { ar: 'المدارس', en: 'Schools' },
    description: {
      ar: 'أرضيات آمنة ومتينة للمدارس والجامعات بمواد صحية.',
      en: 'Safe, durable flooring for schools and universities with healthy materials.',
    },
    categories: ['carpet-tiles', 'vinyl-flooring', 'rubber-flooring'],
  },
  {
    id: 'outdoor-sports',
    icon: OutdoorIcon,
    title: { ar: 'المساحات الخارجية والرياضة', en: 'Outdoor & Sports' },
    description: {
      ar: 'عشب صناعي وأرضيات مطاطية للملاعب والمساحات الخارجية.',
      en: 'Artificial grass and rubber flooring for playgrounds and outdoor areas.',
    },
    categories: ['artificial-grass', 'rubber-flooring'],
  },
];

// ─── Why-choose-us data ───

const whyUs = [
  {
    icon: SparkleIcon,
    title: { ar: 'جودة مضمونة', en: 'Guaranteed quality' },
    description: {
      ar: 'منتجات أصلية من أفضل المصانع بمعايير جودة عالية.',
      en: 'Genuine products from top factories with high standards.',
    },
  },
  {
    icon: PhoneIcon,
    title: { ar: 'خدمة كاملة', en: 'Full service' },
    description: {
      ar: 'قياس، تركيب احترافي، وتوصيل لكل مناطق الرياض.',
      en: 'Measurement, professional installation, and delivery across Riyadh.',
    },
  },
  {
    icon: OfficeIcon,
    title: { ar: 'تنوع كبير', en: 'Huge variety' },
    description: {
      ar: 'أكثر من قسم وعشرات الموديلات تناسب كل ذوق ومكان.',
      en: 'Multiple categories and dozens of models for every taste and space.',
    },
  },
  {
    icon: SparkleIcon,
    title: { ar: 'خبرة وسعر', en: 'Experience & price' },
    description: {
      ar: 'سنوات من الخبرة في السوق مع أسعار منافسة وشفافة.',
      en: 'Years in the market with competitive, transparent pricing.',
    },
  },
];

export default function SolutionsContent() {
  const { locale, t } = useApp();
  const { waLink, phoneLink, number: contactNumber } = useContacts();
  const { refresh } = useSiteData();
  const { products, categories: liveCategories, loading } = useSiteData();

  // Only show use cases that have real products in at least one category
  const useCases = allUseCases.filter((uc) =>
    uc.categories.some((catId) => products.some((p) => p.category === catId)),
  );

  const waDefault = waLink('solutions_whatsapp', t.whatsappMessageDefault);

  // Helper: get category name by id
  const catName = (id: string) => {
    const cat = liveCategories.find((c) => c.id === id);
    return cat ? loc(locale, cat.name) : id;
  };

  return (
    <>
      {/* ═══════════════ PAGE HEADER ═══════════════ */}
      <section className="bg-ivory dark:bg-charcoal pt-8 pb-12 lg:pt-12 lg:pb-16 border-b border-charcoal/5 dark:border-charcoal-border/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            {/* Breadcrumb */}
            <nav aria-label="Breadcrumb" className="mb-6">
              <ol className="flex items-center gap-2 text-sm text-charcoal/50 dark:text-ivory/50">
                <li>
                  <a href="/" className="hover:text-forest dark:hover:text-forest-light transition-colors">
                    {t.home}
                  </a>
                </li>
                <li aria-hidden="true">/</li>
                <li className="text-charcoal dark:text-ivory font-medium" aria-current="page">
                  {locale === 'ar' ? 'الحلول التجارية' : 'Solutions'}
                </li>
              </ol>
            </nav>

            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-forest/10 dark:bg-forest-light/15 text-forest dark:text-forest-light text-xs font-semibold mb-5">
              <SparkleIcon className="w-3.5 h-3.5" />
              {locale === 'ar' ? 'حلول تجارية' : 'Commercial Solutions'}
            </span>
            <h1 className="font-arabic text-3xl sm:text-4xl lg:text-5xl font-bold text-charcoal dark:text-ivory tracking-tight mb-3">
              {locale === 'ar' ? 'الحلول التجارية والمشاريع' : 'Commercial & Project Solutions'}
            </h1>
            <p className="text-charcoal/70 dark:text-ivory/70 text-base lg:text-lg max-w-2xl">
              {locale === 'ar'
                ? 'نوفر حلول سجاد وأرضيات متكاملة للمنشآت التجارية والمشاريع في الرياض — من المكاتب والمساجد إلى المستشفيات والفنادق والمدارس.'
                : 'We supply complete carpet and flooring solutions for commercial projects across Riyadh — from offices and mosques to hospitals, hotels, and schools.'}
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* ═══════════════ SOLUTIONS GRID ═══════════════ */}
      <section className="py-14 lg:py-20 bg-ivory dark:bg-charcoal">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow={locale === 'ar' ? 'حسب الاستخدام' : 'By Use Case'}
            title={locale === 'ar' ? 'حلول لكل مساحة' : 'Solutions for Every Space'}
            subtitle={
              locale === 'ar'
                ? 'اختر نوع المشروع واستكشف المنتجات المناسبة لاحتياجك.'
                : 'Choose your project type and explore the right products for your needs.'
            }
          />

          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="rounded-2xl bg-sand-50 dark:bg-charcoal-light border border-charcoal/5 dark:border-charcoal-border p-6 animate-pulse"
                >
                  <div className="w-12 h-12 rounded-xl bg-charcoal/10 dark:bg-ivory/10 mb-4" />
                  <div className="h-5 w-3/4 rounded bg-charcoal/10 dark:bg-ivory/10 mb-3" />
                  <div className="h-4 w-full rounded bg-charcoal/10 dark:bg-ivory/10 mb-2" />
                  <div className="h-4 w-2/3 rounded bg-charcoal/10 dark:bg-ivory/10" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {useCases.map((uc, idx) => {
                const Icon = uc.icon;
                return (
                  <ScrollReveal key={uc.id} delay={idx * 80}>
                    <div className="group h-full rounded-2xl bg-sand-50 dark:bg-charcoal-light border border-charcoal/5 dark:border-charcoal-border p-6 lg:p-7 hover:border-forest/20 dark:hover:border-forest-light/20 hover:shadow-lg hover:shadow-forest/5 transition-all duration-300">
                      {/* Icon */}
                      <div className="w-12 h-12 rounded-xl bg-forest/10 dark:bg-forest-light/15 text-forest dark:text-forest-light flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                        <Icon className="w-6 h-6" />
                      </div>

                      {/* Title */}
                      <h3 className="text-lg font-bold text-charcoal dark:text-ivory mb-2">
                        {loc(locale, uc.title)}
                      </h3>

                      {/* Description */}
                      <p className="text-sm text-charcoal/60 dark:text-ivory/60 leading-relaxed mb-5">
                        {loc(locale, uc.description)}
                      </p>

                      {/* Category chips */}
                      <div className="flex flex-wrap gap-2 mb-5">
                        {uc.categories.map((catId) => (
                          <a
                            key={catId}
                            href={`/${catId}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-forest/5 dark:bg-forest-light/10 text-forest dark:text-forest-light border border-forest/10 dark:border-forest-light/15 hover:bg-forest/10 dark:hover:bg-forest-light/15 transition-colors"
                          >
                            {catName(catId)}
                          </a>
                        ))}
                      </div>

                      {/* CTA */}
                      <a
                        href={`/${uc.categories[0]}`}
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-forest dark:text-forest-light hover:gap-2.5 transition-all"
                      >
                        {t.viewProducts}
                        <ArrowRightIcon className="w-4 h-4 rtl:rotate-180" />
                      </a>
                    </div>
                  </ScrollReveal>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════ WHY CHOOSE US ═══════════════ */}
      <section className="py-14 lg:py-20 bg-sand-50 dark:bg-charcoal-light border-y border-charcoal/5 dark:border-charcoal-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow={locale === 'ar' ? 'ليه تختارنا' : 'Why Choose Us'}
            title={locale === 'ar' ? 'شريكك الموثوق في الأرضيات' : 'Your Trusted Flooring Partner'}
            subtitle={
              locale === 'ar'
                ? 'نلتزم بتقديم أفضل المنتجات والخدمات لضمان رضا عملائنا.'
                : 'We are committed to delivering the best products and services to ensure customer satisfaction.'
            }
          />

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {whyUs.map((item, idx) => {
              const Icon = item.icon;
              return (
                <ScrollReveal key={idx} delay={idx * 80}>
                  <div className="text-center p-6 rounded-2xl bg-ivory dark:bg-charcoal border border-charcoal/5 dark:border-charcoal-border hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 rounded-xl bg-forest/10 dark:bg-forest-light/15 text-forest dark:text-forest-light flex items-center justify-center mx-auto mb-4">
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-charcoal dark:text-ivory mb-2">
                      {loc(locale, item.title)}
                    </h3>
                    <p className="text-sm text-charcoal/60 dark:text-ivory/60 leading-relaxed">
                      {loc(locale, item.description)}
                    </p>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════ CONTACT CTA ═══════════════ */}
      <section className="py-14 lg:py-20 bg-ivory dark:bg-charcoal">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="relative overflow-hidden rounded-3xl bg-forest dark:bg-forest/90 p-8 lg:p-12 text-center">
              {/* Decorative pattern */}
              <div className="absolute inset-0 opacity-5" aria-hidden="true">
                <div className="absolute top-0 start-0 w-64 h-64 rounded-full bg-ivory -translate-x-1/2 -translate-y-1/2" />
                <div className="absolute bottom-0 end-0 w-96 h-96 rounded-full bg-ivory translate-x-1/3 translate-y-1/3" />
              </div>

              <div className="relative">
                <h2 className="font-arabic text-2xl sm:text-3xl lg:text-4xl font-bold text-ivory mb-3">
                  {locale === 'ar' ? 'جاهزون لتنفيذ مشروعك؟' : 'Ready to Start Your Project?'}
                </h2>
                <p className="text-ivory/80 text-base lg:text-lg max-w-2xl mx-auto mb-8">
                  {locale === 'ar'
                    ? 'تواصل معنا للحصول على عرض سعر مجاني واستشارة متخصصة لاختيار الأرضيات المناسبة لمشروعك.'
                    : 'Contact us for a free quote and expert consultation to choose the right flooring for your project.'}
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <div className="relative inline-flex">
                    <a
                      href={waDefault}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-contact-key="solutions_whatsapp"
                      className="inline-flex items-center gap-2 h-12 px-8 rounded-xl bg-[#25D366] text-white font-medium hover:bg-[#1da851] transition-colors shadow-lg shadow-[#25D366]/25"
                    >
                      <WhatsAppIcon className="w-5 h-5" />
                      {t.whatsappUs}
                    </a>
                    <span className="absolute -top-1 -end-1">
                      <ContactEditBadge contactKey="solutions_whatsapp" currentNumber={contactNumber('solutions_whatsapp')} onSaved={refresh} />
                    </span>
                  </div>
                  <div className="relative inline-flex">
                    <a
                      href={phoneLink('solutions_phone')}
                      data-contact-key="solutions_phone"
                      className="inline-flex items-center gap-2 h-12 px-8 rounded-xl bg-ivory/15 text-ivory font-medium hover:bg-ivory/25 transition-colors border border-ivory/20"
                    >
                      <PhoneIcon className="w-5 h-5" />
                      {t.callUs}
                    </a>
                    <span className="absolute -top-1 -end-1">
                      <ContactEditBadge contactKey="solutions_phone" currentNumber={contactNumber('solutions_phone')} onSaved={refresh} />
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </>
  );
}
