'use client';

import { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { business, categories } from '@/data/site';
import { loc } from '@/lib/i18n';
import { useSiteData } from '@/hooks/useSiteData';
import { useContacts } from '@/hooks/useContacts';
import { ContactEditBadge } from '@/components/ContactEditBadge';
import { FavoritesBadge } from './FavoritesBadge';
import {
  WhatsAppIcon,
  PhoneIcon,
  SunIcon,
  MoonIcon,
  GlobeIcon,
  SearchIcon,
  MenuIcon,
  CloseIcon,
  ChevronDownIcon,
  ArrowRightIcon,
  HeartIcon,
} from './Icons';

export function Header() {
  const { locale, setLocale, dir, theme, toggleTheme, t } = useApp();
  const { waLink, phoneLink, number: contactNumber } = useContacts();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const pathname = usePathname();
  const isHome = pathname === '/';

  // Live settings (logo) from the DB; falls back to the static value.
  const { settings, refresh } = useSiteData();
  const logo = settings.logo || business.logo;

  // Is the current visitor a logged-in admin? If so, the logo becomes a
  // shortcut to the admin dashboard (invisible to normal visitors).
  useEffect(() => {
    let cancelled = false;
    fetch('/api/admin/me')
      .then((res) => {
        if (!cancelled) setIsAdmin(res.ok);
      })
      .catch(() => {
        if (!cancelled) setIsAdmin(false);
      });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  // Over the dark hero (top of page) the header is transparent with
  // light text; once the user scrolls onto light page sections it gets
  // a glass surface and dark text so it always stays readable.
  // The transparent treatment only applies on the homepage, which is
  // the only page with a dark hero behind the header.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close search results when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchFocused(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Live search suggestions (categories)
  const [searchResults, setSearchResults] = useState<
    Array<{ slug: string; name: { ar: string; en: string }; sku: string }>
  >([]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const q = searchQuery.trim().toLowerCase();
    const results = categories
      .filter((c) => c.name.ar.includes(searchQuery) || c.name.en.toLowerCase().includes(q))
      .map((c) => ({ slug: c.id, name: c.name, sku: '' }))
      .slice(0, 5);
    setSearchResults(results);
  }, [searchQuery]);

  // Nav links — new structure with category dropdowns
  const navLinks = [
    { href: '/', label: t.navHome },
    { href: '/catalog', label: t.navCatalog },
    { href: '/about', label: t.navAbout },
    { href: '/contact', label: t.navContact },
  ];

  // Category dropdown groups
  const carpetCats = categories.filter(c => ['carpets-rugs', 'moquette', 'carpet-tiles', 'mosque-carpets', 'office-commercial', 'runners-stairs'].includes(c.id));
  const flooringCats = categories.filter(c => ['vinyl-flooring', 'parquet-spc', 'rubber-flooring', 'stable-rubber'].includes(c.id));

  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);

  function Dropdown({ id, label, items }: { id: string; label: string; items: typeof categories }) {
    const open = dropdownOpen === id;
    return (
      <div className="relative">
        <button
          onClick={() => setDropdownOpen(open ? null : id)}
          className={`hdr-nav-link ${navCls} flex items-center gap-1`}
          aria-expanded={open}
        >
          {label}
          <ChevronDownIcon className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
        {open && (
          <div className="absolute top-full mt-1 w-56 rounded-xl bg-ivory dark:bg-charcoal-light border border-charcoal/10 dark:border-charcoal-border shadow-float overflow-hidden z-50 scale-in origin-top">
            {items.map((c) => (
              <a
                key={c.id}
                href={`/${c.id}`}
                onClick={() => setDropdownOpen(null)}
                className="block px-4 py-2.5 text-sm hover:bg-sand-100 dark:hover:bg-charcoal-elevated transition-colors"
              >
                {loc(locale, c.name)}
              </a>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Text tone flips with the surface: over the transparent dark hero the
  // header always uses light text (regardless of theme) because the hero
  // image is dark; on every other page (and once scrolled) the header has
  // a SOLID glass surface with theme-aware text so it's always readable.
  // NOTE: these are FULL static class strings so Tailwind's JIT keeps them.
  const onHero = isHome && !scrolled;
  // Solid, opaque-enough surface (no transparency) so text never washes out.
  const headerCls = onHero
    ? 'bg-transparent border-transparent'
    : 'bg-ivory dark:bg-charcoal border-charcoal/10 dark:border-white/10 shadow-sm';
  const brandCls = onHero
    ? 'font-arabic font-bold text-base lg:text-lg text-white'
    : 'font-arabic font-bold text-base lg:text-lg text-forest dark:text-ivory';
  const brandSubCls = onHero
    ? 'hidden lg:block text-[11px] tracking-wide text-white/75'
    : 'hidden lg:block text-[11px] tracking-wide text-charcoal/60 dark:text-ivory/50';
  const navCls = onHero
    ? 'px-3 py-2 rounded-lg text-sm font-medium text-white/95 hover:bg-white/20 hover:text-white transition-colors'
    : 'px-3 py-2 rounded-lg text-sm font-medium text-charcoal hover:bg-forest/10 hover:text-forest dark:text-ivory dark:hover:bg-white/10 dark:hover:text-ivory transition-colors';
  const iconBorderCls = onHero
    ? 'border-white/45 hover:border-white hover:bg-white/10'
    : 'border-charcoal/15 dark:border-white/20 hover:border-forest dark:hover:border-forest-light';
  const iconCls = onHero ? 'text-white' : 'text-charcoal dark:text-ivory';
  const searchCls = onHero
    ? 'w-48 xl:w-64 h-9 pe-9 ps-3 rounded-full border bg-white/10 border-white/25 text-white placeholder:text-white/65 focus:outline-none focus:border-white focus:bg-white/15 transition-colors'
    : 'w-48 xl:w-64 h-9 pe-9 ps-3 rounded-full border bg-sand-100 dark:bg-charcoal-light border-charcoal/10 dark:border-charcoal-border text-charcoal dark:text-ivory placeholder:text-charcoal/50 dark:placeholder:text-ivory/50 focus:outline-none focus:border-forest dark:focus:border-forest-light transition-colors';
  // Icon sits on the LEFT (physical left) so it never collides with the
  // RTL text, which starts from the right.
  const searchIconCls = onHero
    ? 'absolute top-1/2 -translate-y-1/2 left-3 w-4 h-4 pointer-events-none text-white/80'
    : 'absolute top-1/2 -translate-y-1/2 left-3 w-4 h-4 pointer-events-none text-charcoal/50 dark:text-ivory/50';

  return (
    <header
      className={`site-header ${onHero ? 'on-hero' : 'on-solid'} ${headerCls} overflow-hidden`}
    >
      {/* ═══ Main header ═══ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="hdr-row items-center gap-2">
          {/* Logo — image if configured, else the "م" letter. Becomes an
              admin-dashboard shortcut for logged-in admins. */}
          <a
            href={isAdmin ? '/admin' : '/'}
            title={isAdmin ? (locale === 'ar' ? 'لوحة التحكم' : 'Admin dashboard') : undefined}
            className="flex items-center gap-2 sm:gap-3 shrink-0 group min-w-0"
          >
            <div className="w-8 h-8 lg:w-9 lg:h-9 rounded-lg bg-forest flex items-center justify-center text-ivory font-bold text-sm lg:text-base font-arabic shadow-md group-hover:shadow-lg transition-shadow overflow-hidden shrink-0">
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
            <div className="flex flex-col leading-tight min-w-0">
              <span className={`hdr-brand ${brandCls} truncate`}>{loc(locale, business.name)}</span>
              <span className={`hdr-brand-sub ${brandSubCls}`}>
                {loc(locale, business.tagline)}
              </span>
            </div>
          </a>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1" aria-label={t.navProducts}>
            <a href="/" className={`hdr-nav-link ${navCls}`}>{t.navHome}</a>
            <a href="/catalog" className={`hdr-nav-link ${navCls}`}>{t.navCatalog}</a>
            <Dropdown id="carpets" label={locale === 'ar' ? 'السجاد والموكيت' : 'Carpets & Moquette'} items={carpetCats} />
            <Dropdown id="flooring" label={locale === 'ar' ? 'الأرضيات' : 'Flooring'} items={flooringCats} />
            <a href="/solutions" className={`hdr-nav-link ${navCls}`}>{locale === 'ar' ? 'حلول الشركات' : 'Solutions'}</a>
            <a href="/about" className={`hdr-nav-link ${navCls}`}>{t.navAbout}</a>
            <a href="/contact" className={`hdr-nav-link ${navCls}`}>{t.navContact}</a>
          </nav>

          {/* Right cluster */}
          <div className="flex items-center gap-1.5 lg:gap-3">
            {/* Desktop search — with live category suggestions */}
            <div ref={searchRef} className="relative hidden sm:block">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (searchQuery.trim()) {
                    window.location.href = `/catalog?search=${encodeURIComponent(searchQuery)}`;
                  }
                }}
                className="relative"
              >
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  placeholder={t.searchPlaceholder}
                  aria-label={t.searchProducts}
                  className={`hdr-search ${searchCls}`}
                />
                <SearchIcon className={searchIconCls} />
              </form>
              {searchFocused && searchResults.length > 0 && (
                <div className="absolute top-full mt-2 w-64 xl:w-80 rounded-xl bg-ivory dark:bg-charcoal-light border border-charcoal/10 dark:border-charcoal-border shadow-float overflow-hidden z-50 scale-in origin-top">
                  {searchResults.map((r) => (
                    <a
                      key={r.slug}
                      href={`/${r.slug}`}
                      onClick={() => {
                        setSearchFocused(false);
                        setSearchQuery('');
                      }}
                      className="block px-4 py-2.5 text-sm hover:bg-sand-100 dark:hover:bg-charcoal-elevated transition-colors"
                    >
                      {loc(locale, r.name)}
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Favorites (wishlist) — hidden on smallest screens (in menu) */}
            <FavoritesBadge className={`border ${iconBorderCls} ${iconCls} hidden xs:flex`} />

            {/* Language switcher — hidden on smallest screens (in menu) */}
            <button
              onClick={() => setLocale(locale === 'ar' ? 'en' : 'ar')}
              aria-label={t.language}
              title={locale === 'ar' ? t.switchToEnglish : t.switchToArabic}
              className={`hdr-icon-btn hidden xs:flex items-center gap-1.5 h-9 px-2.5 rounded-full border text-sm font-medium transition-colors ${iconBorderCls} ${iconCls}`}
            >
              <GlobeIcon className="w-4 h-4" />
              <span>{locale === 'ar' ? 'EN' : 'ع'}</span>
            </button>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              aria-label={theme === 'light' ? t.darkMode : t.lightMode}
              title={theme === 'light' ? t.darkMode : t.lightMode}
              className={`hdr-icon-btn w-9 h-9 flex items-center justify-center rounded-full border transition-colors ${iconBorderCls} ${iconCls}`}
            >
              {theme === 'light' ? (
                <MoonIcon className="w-4 h-4" />
              ) : (
                <SunIcon className="w-4 h-4" />
              )}
            </button>

            {/* WhatsApp — always visible (primary contact) */}
            <div className="relative shrink-0 pe-1">
              <a
                href={waLink('header_whatsapp', t.whatsappMessageDefault)}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t.whatsapp}
                title={t.whatsappTooltip}
                data-contact-key="header_whatsapp"
                className="w-9 h-9 flex items-center justify-center rounded-full bg-[#25D366] text-white hover:brightness-95 transition-all shadow-md"
              >
                <WhatsAppIcon className="w-4 h-4" />
              </a>
              <span className="absolute -top-1 -end-1">
                <ContactEditBadge contactKey="header_whatsapp" currentNumber={contactNumber('header_whatsapp')} onSaved={refresh} />
              </span>
            </div>

            {/* Contact — desktop only */}
            <div className="relative hidden xl:block pe-2 ms-auto">
              <a
                href={phoneLink('header_phone')}
                aria-label={t.call}
                title={t.callTooltip}
                data-contact-key="header_phone"
                className="flex items-center gap-2 h-9 px-3.5 rounded-full bg-forest text-ivory text-sm font-medium hover:bg-forest-light transition-colors whitespace-nowrap"
              >
                <PhoneIcon className="w-4 h-4 shrink-0" />
                <span dir="ltr">{contactNumber('header_phone') || '—'}</span>
              </a>
              <span className="absolute -top-1 -end-1">
                <ContactEditBadge contactKey="header_phone" currentNumber={contactNumber('header_phone')} onSaved={refresh} />
              </span>
            </div>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={t.menu}
              aria-expanded={mobileOpen}
              className={`hdr-icon-btn lg:hidden w-9 h-9 flex items-center justify-center rounded-full border shrink-0 ${iconBorderCls} ${iconCls}`}
            >
              {mobileOpen ? <CloseIcon className="w-4 h-4" /> : <MenuIcon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* ═══ Mobile drawer ═══ */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-charcoal/10 dark:border-white/10 bg-ivory/95 dark:bg-charcoal/95 backdrop-blur-md fade-in">
          <nav className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-1" aria-label={t.navProducts}>
            {/* Mobile search */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (searchQuery.trim()) {
                  window.location.href = `/catalog?search=${encodeURIComponent(searchQuery)}`;
                }
                setMobileOpen(false);
              }}
              className="relative mb-3"
            >
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.searchPlaceholder}
                aria-label={t.searchProducts}
                className="w-full h-11 ps-3 pe-10 rounded-xl bg-sand-100 dark:bg-charcoal-light border border-charcoal/10 dark:border-charcoal-border text-sm"
              />
              <SearchIcon className="absolute top-1/2 -translate-y-1/2 left-3 w-4 h-4 text-charcoal/40 dark:text-ivory/40 pointer-events-none" />
            </form>

            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-sand-100 dark:hover:bg-charcoal-light flex items-center justify-between gap-2"
              >
                {link.label}
                <ArrowRightIcon className="w-3.5 h-3.5 flip-rtl text-charcoal/30 dark:text-ivory/30" />
              </a>
            ))}
            {/* Mobile category groups */}
            <div className="px-3 py-2 text-xs font-semibold text-charcoal/50 dark:text-ivory/50">
              {locale === 'ar' ? 'السجاد والموكيت' : 'Carpets & Moquette'}
            </div>
            {carpetCats.map((c) => (
              <a
                key={c.id}
                href={`/#category-${c.id}`}
                onClick={() => setMobileOpen(false)}
                className="ps-6 pe-3 py-2 rounded-lg text-sm hover:bg-sand-100 dark:hover:bg-charcoal-light"
              >
                {loc(locale, c.name)}
              </a>
            ))}
            <div className="px-3 py-2 text-xs font-semibold text-charcoal/50 dark:text-ivory/50">
              {locale === 'ar' ? 'الأرضيات' : 'Flooring'}
            </div>
            {flooringCats.map((c) => (
              <a
                key={c.id}
                href={`/#category-${c.id}`}
                onClick={() => setMobileOpen(false)}
                className="ps-6 pe-3 py-2 rounded-lg text-sm hover:bg-sand-100 dark:hover:bg-charcoal-light"
              >
                {loc(locale, c.name)}
              </a>
            ))}
            <a
              href="/solutions"
              onClick={() => setMobileOpen(false)}
              className="px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-sand-100 dark:hover:bg-charcoal-light flex items-center justify-between gap-2"
            >
              {locale === 'ar' ? 'حلول الشركات والمشروعات' : 'Commercial Solutions'}
              <ArrowRightIcon className="w-3.5 h-3.5 flip-rtl text-charcoal/30 dark:text-ivory/30" />
            </a>

            {/* Favorites link */}
            <a
              href="/favorites"
              onClick={() => setMobileOpen(false)}
              className="px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-sand-100 dark:hover:bg-charcoal-light flex items-center justify-between gap-2"
            >
              {locale === 'ar' ? 'المفضلة' : 'Favorites'}
              <HeartIcon className="w-3.5 h-3.5 text-charcoal/30 dark:text-ivory/30" />
            </a>

            {/* Language toggle row — appears here when hidden from the bar */}
            <button
              onClick={() => setLocale(locale === 'ar' ? 'en' : 'ar')}
              className="xs:hidden px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-sand-100 dark:hover:bg-charcoal-light flex items-center justify-between gap-2"
            >
              {locale === 'ar' ? 'English' : 'العربية'}
              <GlobeIcon className="w-3.5 h-3.5 text-charcoal/30 dark:text-ivory/30" />
            </button>

            {/* Mobile contact row */}
            <div className="mt-3 pt-3 border-t border-charcoal/10 dark:border-white/10 flex gap-2">
              <a
                href={waLink('header_whatsapp', t.whatsappMessageDefault)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 h-11 rounded-xl bg-[#25D366] text-white text-sm font-medium"
                data-contact-key="header_whatsapp"
              >
                <WhatsAppIcon className="w-4 h-4" />
                {t.whatsapp}
              </a>
              <a
                href={phoneLink('header_phone')}
                className="flex-1 flex items-center justify-center gap-2 h-11 rounded-xl bg-forest text-ivory text-sm font-medium"
                data-contact-key="header_phone"
              >
                <PhoneIcon className="w-4 h-4" />
                {t.call}
              </a>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
