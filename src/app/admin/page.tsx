'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { ScrollReveal } from '@/components/ScrollReveal';
import { Skeleton } from '@/components/admin/Toast';

interface Stats {
  products: number;
  categories: number;
  featured: number;
  pendingReviews: number;
  approvedReviews: number;
  images: number;
}

const EMPTY: Stats = {
  products: 0,
  categories: 0,
  featured: 0,
  pendingReviews: 0,
  approvedReviews: 0,
  images: 0,
};

export default function AdminDashboard() {
  const { locale } = useApp();
  const isAr = locale === 'ar';
  const [stats, setStats] = useState<Stats>(EMPTY);
  const [recentProducts, setRecentProducts] = useState<any[]>([]);
  const [pendingReviews, setPendingReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [prodRes, revRes, mediaRes] = await Promise.all([
          fetch('/api/admin/products'),
          fetch('/api/admin/testimonials'),
          fetch('/api/admin/media'),
        ]);
        const prodData = prodRes.ok ? await prodRes.json() : { products: [], categories: [] };
        const reviews = revRes.ok ? (await revRes.json()).testimonials : [];
        const images = mediaRes.ok ? (await mediaRes.json()).images : [];

        setStats({
          products: prodData.products.length,
          categories: prodData.categories.length,
          featured: prodData.products.filter((p: any) => p.featured).length,
          pendingReviews: reviews.filter((r: any) => r.status === 'pending').length,
          approvedReviews: reviews.filter((r: any) => r.status === 'approved').length,
          images: images.length,
        });
        setRecentProducts(prodData.products.slice(0, 5));
        setPendingReviews(reviews.filter((r: any) => r.status === 'pending').slice(0, 3));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const cards = [
    { label: 'إجمالي المنتجات', labelEn: 'Total Products', value: stats.products, icon: '📦', href: '/admin/products' },
    { label: 'الأقسام', labelEn: 'Categories', value: stats.categories, icon: '📂', href: '/admin/categories' },
    { label: 'صور المكتبة', labelEn: 'Media Library', value: stats.images, icon: '🖼️', href: '/admin/media' },
    { label: 'مراجعات معلّقة', labelEn: 'Pending Reviews', value: stats.pendingReviews, icon: '⏳', href: '/admin/testimonials', badge: stats.pendingReviews > 0 },
  ];

  const quickActions = [
    { href: '/admin/products', label: 'إضافة منتج', labelEn: 'Add product', icon: '➕' },
    { href: '/admin/media', label: 'رفع صور', labelEn: 'Upload images', icon: '🖼️' },
    { href: '/admin/seo', label: 'إعدادات SEO', labelEn: 'SEO settings', icon: '🔍' },
    { href: '/admin/settings', label: 'بيانات التواصل', labelEn: 'Contact info', icon: '📞' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-charcoal dark:text-ivory">
          {isAr ? 'لوحة التحكم' : 'Dashboard'}
        </h1>
        <Link href="/" className="text-sm text-forest dark:text-forest-light hover:underline">
          {isAr ? '← عرض الموقع' : '← View site'}
        </Link>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((card, i) => (
          <ScrollReveal key={card.labelEn} delay={i * 70} y={16}>
            <Link
              href={card.href}
              className="card-lift relative block bg-ivory dark:bg-charcoal-light rounded-2xl border border-charcoal/10 dark:border-charcoal-border p-5 hover:shadow-card hover:border-forest/25"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl">{card.icon}</span>
                {loading ? (
                  <Skeleton className="h-7 w-10" />
                ) : (
                  <span className="text-2xl font-bold text-forest dark:text-forest-light">
                    {card.value}
                  </span>
                )}
              </div>
              <div className="text-sm text-charcoal/60 dark:text-ivory/60">
                {isAr ? card.label : card.labelEn}
              </div>
              {(card as any).badge && !loading && (
                <span className="absolute top-3 end-3 w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
              )}
            </Link>
          </ScrollReveal>
        ))}
      </div>

      {/* Quick actions */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-charcoal/70 dark:text-ivory/70 mb-3 uppercase tracking-wide">
          {isAr ? 'إجراءات سريعة' : 'Quick Actions'}
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {quickActions.map((a, i) => (
            <ScrollReveal key={a.labelEn} delay={i * 50} y={12}>
              <Link
                href={a.href}
                className="btn-press flex items-center gap-2.5 px-4 py-3 rounded-xl bg-sand-100 dark:bg-charcoal-elevated border border-charcoal/10 dark:border-charcoal-border text-sm font-medium text-charcoal dark:text-ivory hover:border-forest/40 transition-colors"
              >
                <span>{a.icon}</span>
                {isAr ? a.label : a.labelEn}
              </Link>
            </ScrollReveal>
          ))}
        </div>
      </div>

      {/* Recent products + Pending reviews */}
      <div className="grid lg:grid-cols-2 gap-6">
      <ScrollReveal delay={100}>
        <div className="bg-ivory dark:bg-charcoal-light rounded-2xl border border-charcoal/10 dark:border-charcoal-border overflow-hidden h-full">
          <div className="p-5 border-b border-charcoal/10 dark:border-charcoal-border flex items-center justify-between">
            <h2 className="font-bold text-charcoal dark:text-ivory">
              {isAr ? 'أحدث المنتجات' : 'Recent Products'}
            </h2>
            <Link href="/admin/products" className="text-sm text-forest dark:text-forest-light hover:underline">
              {isAr ? 'عرض الكل' : 'View all'}
            </Link>
          </div>

          {loading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="w-12 h-12 rounded-lg shrink-0" />
                  <Skeleton className="h-4 flex-1" />
                </div>
              ))}
            </div>
          ) : recentProducts.length === 0 ? (
            <div className="p-8 text-center text-charcoal/50 dark:text-ivory/50">
              {isAr ? 'مفيش منتجات' : 'No products yet'}
            </div>
          ) : (
            <div className="divide-y divide-charcoal/5 dark:divide-charcoal-border">
              {recentProducts.map((p) => (
                <Link
                  key={p.slug}
                  href={`/admin/products?edit=${encodeURIComponent(p.slug)}`}
                  className="p-4 flex items-center gap-4 hover:bg-sand-50 dark:hover:bg-charcoal-elevated transition-colors"
                >
                  <img
                    src={p.images?.[0] || '/images/categories/default.jpg'}
                    alt=""
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-charcoal dark:text-ivory truncate">
                      {isAr ? p.name?.ar : p.name?.en}
                    </div>
                    <div className="text-xs text-charcoal/50 dark:text-ivory/50">{p.sku || p.slug}</div>
                  </div>
                  {p.featured && (
                    <span className="text-xs px-2 py-1 rounded-full bg-forest/10 text-forest font-medium shrink-0">
                      {isAr ? 'مميز' : 'Featured'}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      </ScrollReveal>

      {/* Pending reviews */}
      <ScrollReveal delay={150}>
        <div className="bg-ivory dark:bg-charcoal-light rounded-2xl border border-charcoal/10 dark:border-charcoal-border overflow-hidden h-full">
          <div className="p-5 border-b border-charcoal/10 dark:border-charcoal-border flex items-center justify-between">
            <h2 className="font-bold text-charcoal dark:text-ivory">
              {isAr ? 'مراجعات في انتظار الموافقة' : 'Reviews Awaiting Approval'}
            </h2>
            <Link href="/admin/testimonials" className="text-sm text-forest dark:text-forest-light hover:underline">
              {isAr ? 'عرض الكل' : 'View all'}
            </Link>
          </div>
          {loading ? (
            <div className="p-4 space-y-3">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          ) : pendingReviews.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-3xl mb-2">✅</div>
              <p className="text-charcoal/50 dark:text-ivory/50 text-sm">
                {isAr ? 'مفيش مراجعات معلّقة' : 'No pending reviews'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-charcoal/5 dark:divide-charcoal-border">
              {pendingReviews.map((r) => (
                <Link
                  key={r.id}
                  href="/admin/testimonials"
                  className="p-4 block hover:bg-sand-50 dark:hover:bg-charcoal-elevated transition-colors"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-charcoal dark:text-ivory text-sm">{r.name}</span>
                    <span className="text-amber-500 text-xs">{'★'.repeat(r.rating)}</span>
                  </div>
                  <p className="text-xs text-charcoal/60 dark:text-ivory/60 line-clamp-2">
                    “{r.quote}”
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </ScrollReveal>
      </div>
    </div>
  );
}
