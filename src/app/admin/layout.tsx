'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { business } from '@/data/site';
import { useSiteData } from '@/hooks/useSiteData';
import { MenuIcon, CloseIcon, SunIcon, MoonIcon } from '@/components/Icons';
import { ToastProvider } from '@/components/admin/Toast';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { locale, setLocale, theme, toggleTheme } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isLoginPage = pathname === '/admin/login';

  if (isLoginPage) {
    return <ToastProvider>{children}</ToastProvider>;
  }

  const navItems = [
    { href: '/admin', label: 'لوحة التحكم', icon: '📊', labelEn: 'Dashboard' },
    { href: '/admin/products', label: 'المنتجات', icon: '📦', labelEn: 'Products' },
    { href: '/admin/categories', label: 'الأقسام', icon: '📂', labelEn: 'Categories' },
    { href: '/admin/analytics', label: 'تحليلات التواصل', icon: '📈', labelEn: 'Contact Analytics' },
    { href: '/admin/contacts', label: 'أيقونات التواصل', icon: '📞', labelEn: 'Contact Icons' },
    { href: '/admin/content', label: 'محتوى الموقع', icon: '📝', labelEn: 'Site Content' },
    { href: '/admin/media', label: 'معرض الصور', icon: '🖼️', labelEn: 'Media' },
    { href: '/admin/testimonials', label: 'آراء العملاء', icon: '⭐', labelEn: 'Reviews' },
    { href: '/admin/seo', label: 'محركات البحث (SEO)', icon: '🔍', labelEn: 'SEO' },
    { href: '/admin/settings', label: 'الإعدادات', icon: '⚙️', labelEn: 'Settings' },
  ];

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
    router.refresh();
  }

  return (
    <ToastProvider>
    <div className="min-h-screen bg-sand-50 dark:bg-charcoal flex">
      {/* Sidebar — desktop */}
      <aside className="hidden lg:flex w-64 flex-col bg-ivory dark:bg-charcoal-light border-e border-charcoal/10 dark:border-charcoal-border">
        <div className="p-6 border-b border-charcoal/10 dark:border-charcoal-border">
          <Link href="/admin" className="flex items-center gap-3">
            <AdminSidebarLogo />
            <div>
              <div className="font-bold text-charcoal dark:text-ivory text-sm">{business.name.ar}</div>
              <div className="text-xs text-charcoal/50 dark:text-ivory/50">
                {locale === 'ar' ? 'لوحة التحكم' : 'Dashboard'}
              </div>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`btn-press flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  active
                    ? 'bg-forest text-ivory shadow-sm'
                    : 'text-charcoal/70 dark:text-ivory/70 hover:bg-sand-100 dark:hover:bg-charcoal-elevated'
                }`}
              >
                <span className="text-base">{item.icon}</span>
                {locale === 'ar' ? item.label : item.labelEn}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-charcoal/10 dark:border-charcoal-border space-y-2">
          <Link
            href="/"
            className="btn-press flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-charcoal/70 dark:text-ivory/70 hover:bg-sand-100 dark:hover:bg-charcoal-elevated transition-colors"
          >
            <span>🏠</span>
            {locale === 'ar' ? 'عرض الموقع' : 'View Site'}
          </Link>
          <button
            onClick={handleLogout}
            className="btn-press w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <span>🚪</span>
            {locale === 'ar' ? 'تسجيل الخروج' : 'Logout'}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 bg-ivory dark:bg-charcoal-light border-b border-charcoal/10 dark:border-charcoal-border flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="btn-press lg:hidden w-9 h-9 flex items-center justify-center rounded-lg border border-charcoal/15 dark:border-charcoal-border"
            aria-label="Menu"
          >
            {sidebarOpen ? <CloseIcon className="w-4 h-4" /> : <MenuIcon className="w-4 h-4" />}
          </button>

          <div className="flex items-center gap-2 ms-auto">
            <button
              onClick={() => setLocale(locale === 'ar' ? 'en' : 'ar')}
              className="btn-press h-9 px-3 rounded-lg border border-charcoal/15 dark:border-charcoal-border text-sm font-medium hover:border-forest dark:hover:border-forest-light transition-colors"
            >
              {locale === 'ar' ? 'EN' : 'ع'}
            </button>
            <button
              onClick={toggleTheme}
              className="btn-press w-9 h-9 flex items-center justify-center rounded-lg border border-charcoal/15 dark:border-charcoal-border hover:border-forest dark:hover:border-forest-light transition-colors"
              aria-label="Theme"
            >
              {theme === 'light' ? <MoonIcon className="w-4 h-4" /> : <SunIcon className="w-4 h-4" />}
            </button>
          </div>
        </header>

        {/* Mobile sidebar */}
        {sidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/40 fade-in" onClick={() => setSidebarOpen(false)} />
            <aside className="absolute inset-y-0 start-0 w-64 bg-ivory dark:bg-charcoal-light flex flex-col scale-in origin-start">
              <div className="p-6 border-b border-charcoal/10 dark:border-charcoal-border flex items-center justify-between">
                <div className="font-bold text-charcoal dark:text-ivory">القائمة</div>
                <button onClick={() => setSidebarOpen(false)} aria-label="Close">
                  <CloseIcon className="w-5 h-5" />
                </button>
              </div>
              <nav className="flex-1 p-4 space-y-1">
                {navItems.map((item) => {
                  const active = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`btn-press flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium ${
                        active
                          ? 'bg-forest text-ivory'
                          : 'text-charcoal/70 dark:text-ivory/70 hover:bg-sand-100'
                      }`}
                    >
                      <span>{item.icon}</span>
                      {locale === 'ar' ? item.label : item.labelEn}
                    </Link>
                  );
                })}
              </nav>
              <div className="p-4 border-t border-charcoal/10 dark:border-charcoal-border">
                <button
                  onClick={handleLogout}
                  className="btn-press w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-600"
                >
                  🚪 {locale === 'ar' ? 'تسجيل الخروج' : 'Logout'}
                </button>
              </div>
            </aside>
          </div>
        )}

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto fade-in">{children}</main>
      </div>
    </div>
    </ToastProvider>
  );
}

/**
 * AdminSidebarLogo — the logo shown at the top of the admin sidebar.
 * Reads the uploaded logo from the DB (settings.logo) and falls back
 * to the "م" letter. Kept in sync with the public header/footer logo.
 */
function AdminSidebarLogo() {
  const { settings } = useSiteData();
  const logo = settings.logo || business.logo;
  return (
    <div className="w-10 h-10 rounded-xl bg-forest flex items-center justify-center text-ivory font-bold font-arabic overflow-hidden shrink-0">
      {logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logo} alt={business.name.ar} className="w-full h-full object-cover" />
      ) : (
        'م'
      )}
    </div>
  );
}
