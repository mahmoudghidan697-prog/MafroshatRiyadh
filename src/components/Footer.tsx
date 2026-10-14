'use client';

import { useApp } from '@/context/AppContext';
import { business, contact, categories } from '@/data/site';
import { loc } from '@/lib/i18n';
import { useSiteData } from '@/hooks/useSiteData';
import { useContacts } from '@/hooks/useContacts';
import { ContactEditBadge } from '@/components/ContactEditBadge';
import { WhatsAppIcon, PhoneIcon, MailIcon, MapPinIcon, ClockIcon } from './Icons';

export function Footer() {
  const { locale, t } = useApp();
  const { waLink, phoneLink, number: contactNumber } = useContacts();
  const { settings, refresh } = useSiteData();
  const logo = settings.logo || business.logo;

  const quickLinks = [
    { href: '/', label: t.navHome },
    { href: '/catalog', label: t.navCatalog },
    { href: '/about', label: t.navAbout },
    { href: '/contact', label: t.navContact },
    { href: '/#categories', label: t.navCategories },
    { href: '/#services', label: t.navServices },
    { href: '/#faq', label: t.navFaq },
  ];

  return (
    <footer className="bg-forest text-ivory/90 dark:bg-forest-deep">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-ivory/15 flex items-center justify-center text-ivory font-bold font-arabic overflow-hidden">
                {logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logo}
                    alt={loc(locale, business.name)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  'م'
                )}
              </div>
              <span className="font-arabic font-bold text-lg">{loc(locale, business.name)}</span>
            </div>
            <p className="text-sm text-ivory/70 leading-relaxed">
              {loc(locale, business.description)}
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="font-semibold text-ivory mb-4">{t.quickLinks}</h3>
            <ul className="space-y-2.5">
              {quickLinks.map((l) => (
                <li key={l.href}>
                  <a
                    href={l.href}
                    className="text-sm text-ivory/70 hover:text-ivory transition-colors"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="font-semibold text-ivory mb-4">{t.productCategories}</h3>
            <ul className="space-y-2.5">
              {categories.slice(0, 6).map((c) => (
                <li key={c.id}>
                  <a
                    href={`/catalog?category=${c.id}`}
                    className="text-sm text-ivory/70 hover:text-ivory transition-colors"
                  >
                    {loc(locale, c.name)}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-ivory mb-4">{t.navContact}</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <div className="relative flex items-center">
                  <a
                    href={phoneLink('footer_phone')}
                    className="flex items-center gap-2.5 text-ivory/70 hover:text-ivory transition-colors"
                    data-contact-key="footer_phone"
                  >
                    <PhoneIcon className="w-4 h-4 shrink-0" />
                    <span dir="ltr">{contactNumber('footer_phone') || '—'}</span>
                  </a>
                  <span className="absolute -top-1 -end-1">
                    <ContactEditBadge contactKey="footer_phone" currentNumber={contactNumber('footer_phone')} onSaved={refresh} />
                  </span>
                </div>
              </li>
              <li>
                <div className="relative flex items-center">
                  <a
                    href={waLink('footer_whatsapp', locale === 'ar' ? t.whatsappMessageDefault : t.whatsappMessageDefault)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 text-ivory/70 hover:text-ivory transition-colors"
                    data-contact-key="footer_whatsapp"
                  >
                    <WhatsAppIcon className="w-4 h-4 shrink-0" />
                    {t.whatsappLabel}
                  </a>
                  <span className="absolute -top-1 -end-1">
                    <ContactEditBadge contactKey="footer_whatsapp" currentNumber={contactNumber('footer_whatsapp')} onSaved={refresh} />
                  </span>
                </div>
              </li>
              <li>
                <a
                  href={`mailto:${contact.email}`}
                  className="flex items-center gap-2.5 text-ivory/70 hover:text-ivory transition-colors"
                >
                  <MailIcon className="w-4 h-4 shrink-0" />
                  <span dir="ltr">{contact.email}</span>
                </a>
              </li>
              <li className="flex items-start gap-2.5 text-ivory/70">
                <MapPinIcon className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{loc(locale, contact.address)}</span>
              </li>
              <li className="flex items-start gap-2.5 text-ivory/70">
                <ClockIcon className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{loc(locale, contact.hours)}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-ivory/15 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-ivory/60">
          <span>
            © {new Date().getFullYear()} {loc(locale, business.name)} — {t.allRights}
          </span>
          <span>{t.madeWithCare}</span>
        </div>
      </div>
    </footer>
  );
}
