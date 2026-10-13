'use client';

import { useApp } from '@/context/AppContext';
import { business, contact, whatsappLink, phoneLink } from '@/data/site';
import { loc } from '@/lib/i18n';
import { ScrollReveal } from '@/components/ScrollReveal';
import { SectionHeader } from '@/components/SectionHeader';
import {
  WhatsAppIcon,
  PhoneIcon,
  ShieldIcon,
  TruckIcon,
  RulerIcon,
  SparkleIcon,
} from '@/components/Icons';

export default function AboutPage() {
  const { locale, t } = useApp();

  const pillars = [
    {
      icon: <ShieldIcon className="w-6 h-6" />,
      title: t.whyQuality,
      desc: t.whyQualityDesc,
    },
    {
      icon: <TruckIcon className="w-6 h-6" />,
      title: t.whyService,
      desc: t.whyServiceDesc,
    },
    {
      icon: <RulerIcon className="w-6 h-6" />,
      title: t.whyVariety,
      desc: t.whyVarietyDesc,
    },
    {
      icon: <SparkleIcon className="w-6 h-6" />,
      title: t.whyExperience,
      desc: t.whyExperienceDesc,
    },
  ];

  return (
    <>
      {/* ═══════════════ PAGE HEADER ═══════════════ */}
      <section className="bg-ivory dark:bg-charcoal pt-10 pb-12 lg:pt-14 lg:pb-16 border-b border-charcoal/5 dark:border-charcoal-border/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <h1 className="font-arabic text-3xl sm:text-4xl lg:text-5xl font-bold text-charcoal dark:text-ivory tracking-tight mb-3">
              {t.aboutUsTitle}
            </h1>
            <p className="text-charcoal/70 dark:text-ivory/70 text-base lg:text-lg max-w-2xl">
              {t.aboutUsIntro}
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* ═══════════════ STORY ═══════════════ */}
      <section className="py-14 lg:py-20 bg-ivory dark:bg-charcoal">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <ScrollReveal>
              <img
                src="/images/categories/mosque-carpets.jpg"
                alt={t.aboutUsTitle}
                loading="lazy"
                className="w-full aspect-[4/3] object-cover rounded-3xl shadow-card"
              />
            </ScrollReveal>
            <ScrollReveal delay={100}>
              <div className="space-y-4 text-charcoal/80 dark:text-ivory/80 leading-relaxed">
                <p>{t.aboutUsP1}</p>
                <p>{t.aboutUsP2}</p>
                <p>{t.aboutUsP3}</p>
              </div>
              <div className="flex flex-wrap gap-3 mt-8">
                <a
                  href={whatsappLink(t.whatsappMessageDefault, locale)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-press inline-flex items-center gap-2 h-12 px-6 rounded-xl bg-[#25D366] text-white font-medium hover:brightness-95"
                >
                  <WhatsAppIcon className="w-5 h-5" />
                  {t.whatsappUs}
                </a>
                <a
                  href={phoneLink()}
                  className="btn-press inline-flex items-center gap-2 h-12 px-6 rounded-xl bg-forest text-ivory font-medium hover:bg-forest-light"
                >
                  <PhoneIcon className="w-5 h-5" />
                  {t.callUs}
                </a>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ═══════════════ WHY US ═══════════════ */}
      <section className="py-14 lg:py-20 bg-sand-50 dark:bg-charcoal-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader title={t.whyUs} />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6 mt-10">
            {pillars.map((p, i) => (
              <ScrollReveal key={p.title} delay={i * 80} className="h-full">
                <div className="h-full p-6 rounded-2xl bg-ivory dark:bg-charcoal border border-charcoal/5 dark:border-charcoal-border hover:shadow-card hover:border-forest/20 transition-all">
                  <div className="w-12 h-12 rounded-xl bg-forest/10 dark:bg-forest-light/15 text-forest dark:text-forest-light flex items-center justify-center mb-4">
                    {p.icon}
                  </div>
                  <h3 className="font-semibold text-charcoal dark:text-ivory mb-2">{p.title}</h3>
                  <p className="text-sm text-charcoal/70 dark:text-ivory/70 leading-relaxed">
                    {p.desc}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
