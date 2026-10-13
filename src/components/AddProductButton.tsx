'use client';

import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { useToast } from '@/components/admin/Toast';
import { ImageManager } from '@/components/admin/ImageManager';
import { CloseIcon } from '@/components/Icons';

/**
 * AddProductButton — a button that appears on the catalog page for
 * logged-in admins only. Opens a quick-add form pre-set to the
 * current category being viewed.
 */
export function AddProductButton({
  categoryId,
  categoryName,
}: {
  categoryId: string;
  categoryName: { ar: string; en: string };
}) {
  const { locale } = useApp();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checked, setChecked] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/admin/me')
      .then((res) => {
        if (!cancelled) setIsAdmin(res.ok);
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
  }, []);

  if (!checked || !isAdmin) return null;

  return (
    <>
      <button
        onClick={() => setShowForm(true)}
        className="btn-press inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-forest text-ivory text-sm font-medium hover:bg-forest-light shadow-sm hover:shadow-md transition-all shrink-0"
      >
        <span className="text-base leading-none">＋</span>
        {locale === 'ar' ? 'إضافة منتج' : 'Add Product'}
      </button>

      {showForm && (
        <QuickAddProduct
          categoryId={categoryId}
          categoryName={categoryName}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            toast(locale === 'ar' ? 'تم إضافة المنتج' : 'Product added');
            setShowForm(false);
          }}
        />
      )}
    </>
  );
}

function QuickAddProduct({
  categoryId,
  categoryName,
  onClose,
  onSaved,
}: {
  categoryId: string;
  categoryName: { ar: string; en: string };
  onClose: () => void;
  onSaved: () => void;
}) {
  const { locale } = useApp();
  const { toast } = useToast();
  const [form, setForm] = useState({
    slug: '',
    sku: '',
    name_ar: '',
    name_en: '',
    price: '',
    featured: false,
    images: [] as string[],
  });
  const [showImageManager, setShowImageManager] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Auto-generate slug from the English name
  function autoSlug(enName: string) {
    return enName
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);

    const payload: any = {
      slug: form.slug || autoSlug(form.name_en) || `product-${Date.now()}`,
      sku: form.sku || undefined,
      name: { ar: form.name_ar, en: form.name_en },
      category: categoryId,
      price: form.price ? parseInt(form.price) : null,
      featured: form.featured,
      images: form.images,
      material: { ar: '', en: '' },
      color: { ar: '', en: '' },
      description: { ar: '', en: '' },
    };

    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        onSaved();
        // Reload so the new product shows up
        window.location.reload();
      } else {
        const data = await res.json();
        setError(data.error || 'Save failed');
        toast(locale === 'ar' ? 'فشل الحفظ' : 'Save failed', 'error');
      }
    } catch {
      setError('Connection error');
      toast(locale === 'ar' ? 'خطأ في الاتصال' : 'Connection error', 'error');
    } finally {
      setSaving(false);
    }
  }

  if (showImageManager) {
    return (
      <ImageManager
        currentImages={form.images}
        context="product"
        onSave={(images) => {
          setForm({ ...form, images });
          setShowImageManager(false);
        }}
        onClose={() => setShowImageManager(false)}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 fade-in" onClick={onClose} />
      <div className="relative bg-ivory dark:bg-charcoal-light rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 scale-in shadow-float">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-charcoal dark:text-ivory">
              {locale === 'ar' ? 'إضافة منتج جديد' : 'Add New Product'}
            </h2>
            <p className="text-xs text-charcoal/50 dark:text-ivory/50 mt-1">
              {locale === 'ar' ? 'القسم: ' : 'Category: '}
              {locale === 'ar' ? categoryName.ar : categoryName.en}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="btn-press w-8 h-8 flex items-center justify-center rounded-lg hover:bg-sand-100 dark:hover:bg-charcoal-elevated"
          >
            <CloseIcon className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Names */}
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="text-xs font-medium text-charcoal/70 dark:text-ivory/70 mb-1 block">
                {locale === 'ar' ? 'الاسم (عربي)' : 'Name (Arabic)'} *
              </span>
              <input
                required
                value={form.name_ar}
                onChange={(e) => setForm({ ...form, name_ar: e.target.value })}
                className="w-full h-10 px-3 rounded-lg bg-sand-100 dark:bg-charcoal-elevated border border-charcoal/10 dark:border-charcoal-border text-sm focus:outline-none focus:border-forest"
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-charcoal/70 dark:text-ivory/70 mb-1 block">
                {locale === 'ar' ? 'الاسم (إنجليزي)' : 'Name (English)'} *
              </span>
              <input
                required
                value={form.name_en}
                onChange={(e) => setForm({ ...form, name_en: e.target.value })}
                className="w-full h-10 px-3 rounded-lg bg-sand-100 dark:bg-charcoal-elevated border border-charcoal/10 dark:border-charcoal-border text-sm focus:outline-none focus:border-forest"
              />
            </label>
          </div>

          {/* Slug + SKU */}
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="text-xs font-medium text-charcoal/70 dark:text-ivory/70 mb-1 block">
                Slug ({locale === 'ar' ? 'يتبني تلقائياً لو سيبته فاضي' : 'auto-built if empty'})
              </span>
              <input
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                placeholder={form.name_en ? autoSlug(form.name_en) : 'my-product'}
                dir="ltr"
                className="w-full h-10 px-3 rounded-lg bg-sand-100 dark:bg-charcoal-elevated border border-charcoal/10 dark:border-charcoal-border text-sm focus:outline-none focus:border-forest"
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-charcoal/70 dark:text-ivory/70 mb-1 block">
                SKU
              </span>
              <input
                value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
                placeholder="CR-1005"
                dir="ltr"
                className="w-full h-10 px-3 rounded-lg bg-sand-100 dark:bg-charcoal-elevated border border-charcoal/10 dark:border-charcoal-border text-sm focus:outline-none focus:border-forest"
              />
            </label>
          </div>

          {/* Price */}
          <label className="block">
            <span className="text-xs font-medium text-charcoal/70 dark:text-ivory/70 mb-1 block">
              {locale === 'ar' ? 'السعر (SAR)' : 'Price (SAR)'}
            </span>
            <input
              type="number"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              placeholder={locale === 'ar' ? 'اتركه فاضي لو السعر عند الطلب' : 'Leave empty for "on request"'}
              className="w-full h-10 px-3 rounded-lg bg-sand-100 dark:bg-charcoal-elevated border border-charcoal/10 dark:border-charcoal-border text-sm focus:outline-none focus:border-forest"
            />
          </label>

          {/* Images */}
          <label className="block">
            <span className="text-xs font-medium text-charcoal/70 dark:text-ivory/70 mb-1 block">
              {locale === 'ar' ? 'الصور' : 'Images'}
              <span className="text-charcoal/40 dark:text-ivory/40 ms-1">({form.images.length})</span>
            </span>
            <button
              type="button"
              onClick={() => setShowImageManager(true)}
              className="w-full h-10 px-3 rounded-lg bg-sand-100 dark:bg-charcoal-elevated border border-charcoal/10 dark:border-charcoal-border text-sm text-start hover:border-forest dark:hover:border-forest-light transition-colors flex items-center justify-between"
            >
              <span className="text-charcoal/60 dark:text-ivory/60 truncate">
                {form.images.length === 0
                  ? locale === 'ar' ? 'اختار صور...' : 'Choose images...'
                  : form.images.map((img) => img.split('/').pop()).join(', ')}
              </span>
              <span className="text-forest dark:text-forest-light shrink-0 ms-2">
                {locale === 'ar' ? 'تعديل' : 'Manage'}
              </span>
            </button>
          </label>

          {/* Featured */}
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(e) => setForm({ ...form, featured: e.target.checked })}
              className="w-4 h-4 rounded"
            />
            <span className="text-sm text-charcoal dark:text-ivory">
              {locale === 'ar' ? 'منتج مميز' : 'Featured product'}
            </span>
          </label>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="btn-press flex-1 h-11 rounded-xl bg-forest text-ivory text-sm font-medium hover:bg-forest-light disabled:opacity-50 shadow-sm hover:shadow-md"
            >
              {saving ? '...' : locale === 'ar' ? 'حفظ المنتج' : 'Save Product'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="btn-press h-11 px-5 rounded-xl border border-charcoal/15 dark:border-charcoal-border text-sm"
            >
              {locale === 'ar' ? 'إلغاء' : 'Cancel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
