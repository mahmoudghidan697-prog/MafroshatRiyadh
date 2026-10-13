'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { useToast } from '@/components/admin/Toast';
import { MenuIcon, CloseIcon, WhatsAppIcon, PhoneIcon } from '@/components/Icons';

/**
 * AdminBar — a slim floating toolbar that ONLY appears for logged-in
 * admins while browsing the PUBLIC website. It gives quick access to
 * add/edit/delete products, the dashboard, and logout — without
 * leaving the page they're viewing.
 *
 * Invisible to regular visitors (never rendered when not authenticated).
 */
export function AdminBar() {
  const { locale } = useApp();
  const { toast } = useToast();
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [checked, setChecked] = useState(false);

  // Never show on the admin pages themselves or the login page
  const isAdminRoute = pathname?.startsWith('/admin');

  useEffect(() => {
    if (isAdminRoute) return;
    let cancelled = false;
    fetch('/api/admin/me')
      .then((res) => {
        if (cancelled) return;
        setIsAdmin(res.ok);
      })
      .catch(() => {
        if (!cancelled) setIsAdmin(false);
      })
      .finally(() => {
        if (!cancelled) setChecked(true);
      });
    return () => {
      cancelled = true;
    };
  }, [pathname, isAdminRoute]);

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    setIsAdmin(false);
    setMenuOpen(false);
    toast(locale === 'ar' ? 'تم تسجيل الخروج' : 'Logged out');
    // Reload so the admin bar disappears everywhere
    window.location.reload();
  }

  // Render nothing until we've checked auth, and only if admin
  if (!checked || !isAdmin || isAdminRoute) return null;

  const isProductPage = pathname?.startsWith('/products/');
  const currentSlug = isProductPage ? pathname?.replace('/products/', '') : null;

  const menuItems = [
    {
      icon: '📊',
      label: locale === 'ar' ? 'لوحة التحكم' : 'Dashboard',
      href: '/admin',
    },
    {
      icon: '➕',
      label: locale === 'ar' ? 'إضافة منتج' : 'Add Product',
      href: '/admin/products',
    },
    {
      icon: '📂',
      label: locale === 'ar' ? 'إدارة الأقسام' : 'Manage Categories',
      href: '/admin/categories',
    },
    {
      icon: '⚙️',
      label: locale === 'ar' ? 'الإعدادات' : 'Settings',
      href: '/admin/settings',
    },
  ];

  return (
    <>
      {/* Floating admin toggle button */}
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label={locale === 'ar' ? 'أدوات الأدمن' : 'Admin tools'}
        aria-expanded={menuOpen}
        className="btn-press fixed bottom-6 inset-inline-start-6 z-40 w-12 h-12 rounded-full bg-charcoal text-ivory shadow-float flex items-center justify-center hover:scale-105 transition-transform"
        title={locale === 'ar' ? 'أدوات الأدمن' : 'Admin tools'}
      >
        {menuOpen ? <CloseIcon className="w-5 h-5" /> : <MenuIcon className="w-5 h-5" />}
      </button>

      {/* Admin control panel */}
      {menuOpen && (
        <div className="fixed bottom-20 inset-inline-start-6 z-40 w-64 bg-ivory dark:bg-charcoal-light rounded-2xl shadow-float border border-charcoal/10 dark:border-charcoal-border overflow-hidden scale-in origin-bottom-start">
          {/* Header */}
          <div className="p-4 bg-forest text-ivory">
            <div className="text-xs font-semibold uppercase tracking-wider opacity-80 mb-1">
              {locale === 'ar' ? 'وضع الأدمن' : 'Admin Mode'}
            </div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-ivory/20 flex items-center justify-center text-xs font-bold">
                م
              </div>
              <span className="font-bold text-sm">مفروشات السريع</span>
            </div>
          </div>

          {/* Menu */}
          <nav className="p-2 space-y-0.5">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="btn-press flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-charcoal dark:text-ivory hover:bg-sand-100 dark:hover:bg-charcoal-elevated transition-colors"
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
              </Link>
            ))}

            {/* Edit current product (only on a product page) */}
            {isProductPage && currentSlug && (
              <Link
                href={`/admin/products?edit=${encodeURIComponent(currentSlug)}`}
                onClick={() => setMenuOpen(false)}
                className="btn-press flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-forest dark:text-forest-light hover:bg-forest/10 dark:hover:bg-forest-light/10 transition-colors"
              >
                <span className="text-base">✏️</span>
                {locale === 'ar' ? 'تعديل المنتج الحالي' : 'Edit This Product'}
              </Link>
            )}
          </nav>

          {/* Footer */}
          <div className="p-2 border-t border-charcoal/10 dark:border-charcoal-border">
            <button
              onClick={handleLogout}
              className="btn-press w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <span className="text-base">🚪</span>
              {locale === 'ar' ? 'تسجيل الخروج' : 'Logout'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
