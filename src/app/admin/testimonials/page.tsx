'use client';

import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';

interface Testimonial {
  id: number;
  name: string;
  role: string;
  quote: string;
  rating: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

type Filter = 'all' | 'pending' | 'approved' | 'rejected';

export default function AdminTestimonials() {
  const { locale } = useApp();
  const [items, setItems] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('all');

  const isAr = locale === 'ar';

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const res = await fetch('/api/admin/testimonials');
    if (res.ok) {
      const data = await res.json();
      setItems(data.testimonials);
    }
    setLoading(false);
  }

  async function setStatus(id: number, status: Testimonial['status']) {
    await fetch('/api/admin/testimonials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    });
    load();
  }

  async function handleDelete(id: number) {
    if (!confirm(isAr ? 'متأكد إنك عايز تحذف المراجعة دي؟' : 'Delete this review?')) return;
    await fetch(`/api/admin/testimonials?id=${id}`, { method: 'DELETE' });
    load();
  }

  const counts = {
    all: items.length,
    pending: items.filter((i) => i.status === 'pending').length,
    approved: items.filter((i) => i.status === 'approved').length,
    rejected: items.filter((i) => i.status === 'rejected').length,
  };

  const filtered = filter === 'all' ? items : items.filter((i) => i.status === filter);

  const statusBadge = (s: Testimonial['status']) => {
    const map = {
      pending: { cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', label: isAr ? 'معلّقة' : 'Pending' },
      approved: { cls: 'bg-forest/10 text-forest dark:bg-forest-light/15 dark:text-forest-light', label: isAr ? 'منشورة' : 'Published' },
      rejected: { cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', label: isAr ? 'مرفوضة' : 'Rejected' },
    };
    const m = map[s];
    return (
      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${m.cls}`}>
        {m.label}
      </span>
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-charcoal dark:text-ivory">
          {isAr ? 'آراء العملاء' : 'Customer Reviews'}
        </h1>
      </div>

      <p className="text-sm text-charcoal/60 dark:text-ivory/60 mb-5">
        {isAr
          ? 'المراجعات بتظهر على الموقع بس بعد موافقتك. راجع المراجعات المعلّقة ثم اقبلها أو ارفضها.'
          : 'Reviews only appear on the site after you approve them. Review pending submissions, then approve or reject.'}
      </p>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {(['all', 'pending', 'approved', 'rejected'] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`btn-press px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-forest text-ivory shadow-sm'
                : 'bg-ivory dark:bg-charcoal-light text-charcoal/70 dark:text-ivory/70 border border-charcoal/10 dark:border-charcoal-border hover:border-forest/30'
            }`}
          >
            {f === 'all'
              ? `${isAr ? 'الكل' : 'All'} (${counts.all})`
              : f === 'pending'
              ? `${isAr ? 'معلّقة' : 'Pending'} (${counts.pending})`
              : f === 'approved'
              ? `${isAr ? 'منشورة' : 'Published'} (${counts.approved})`
              : `${isAr ? 'مرفوضة' : 'Rejected'} (${counts.rejected})`}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-charcoal/60 dark:text-ivory/60">{isAr ? 'جاري التحميل...' : 'Loading...'}</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 rounded-2xl bg-ivory dark:bg-charcoal-light border border-charcoal/5 dark:border-charcoal-border">
          <div className="text-4xl mb-3">⭐</div>
          <p className="text-charcoal/60 dark:text-ivory/60">
            {isAr ? 'مفيش مراجعات هنا حالياً' : 'No reviews here yet'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="p-5 rounded-2xl bg-ivory dark:bg-charcoal-light border border-charcoal/5 dark:border-charcoal-border"
            >
              <div className="flex items-start justify-between gap-4 mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-forest/10 dark:bg-forest-light/15 text-forest dark:text-forest-light flex items-center justify-center font-bold font-arabic">
                    {item.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold text-charcoal dark:text-ivory">{item.name}</div>
                    <div className="text-xs text-charcoal/50 dark:text-ivory/50">
                      {item.role || (isAr ? 'عميل' : 'Customer')} ·{' '}
                      {new Date(item.createdAt).toLocaleDateString(isAr ? 'ar-EG' : 'en-US')}
                    </div>
                  </div>
                </div>
                {statusBadge(item.status)}
              </div>

              <div className="flex gap-0.5 text-amber-500 mb-2">
                {Array.from({ length: item.rating }).map((_, i) => (
                  <span key={i}>★</span>
                ))}
              </div>

              <p className="text-sm text-charcoal/80 dark:text-ivory/80 leading-relaxed mb-4">
                “{item.quote}”
              </p>

              <div className="flex flex-wrap gap-2">
                {item.status !== 'approved' && (
                  <button
                    onClick={() => setStatus(item.id, 'approved')}
                    className="btn-press inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-forest text-ivory text-sm font-medium hover:bg-forest-light transition-colors"
                  >
                    ✓ {isAr ? 'موافقة ونشر' : 'Approve & publish'}
                  </button>
                )}
                {item.status !== 'rejected' && (
                  <button
                    onClick={() => setStatus(item.id, 'rejected')}
                    className="btn-press inline-flex items-center gap-1.5 h-9 px-4 rounded-lg border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    ✕ {isAr ? 'رفض' : 'Reject'}
                  </button>
                )}
                <button
                  onClick={() => handleDelete(item.id)}
                  className="btn-press inline-flex items-center gap-1.5 h-9 px-4 rounded-lg border border-charcoal/15 dark:border-charcoal-border text-charcoal/60 dark:text-ivory/60 text-sm font-medium hover:bg-sand-100 dark:hover:bg-charcoal-elevated transition-colors"
                >
                  🗑 {isAr ? 'حذف' : 'Delete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
