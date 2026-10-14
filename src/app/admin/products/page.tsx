'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { ImageManager } from '@/components/admin/ImageManager';
import { useToast, Skeleton } from '@/components/admin/Toast';

interface Product {
  slug: string;
  sku?: string;
  name: { ar: string; en: string };
  category: string;
  price?: { amount: number };
  featured: boolean;
  images: string[];
  published?: boolean;
  seoTitle?: string;
  seoDescription?: string;
  material?: { ar: string; en: string };
  color?: { ar: string; en: string };
  description?: { ar: string; en: string };
  dimensions?: { ar: string; en: string };
  unit?: { ar: string; en: string };
  specs?: any[];
  variations?: any[];
  useCases?: string[];
  createdAt?: string;
}

export default function AdminProducts() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-sand-50 dark:bg-charcoal" />}>
      <AdminProductsContent />
    </Suspense>
  );
}

function AdminProductsContent() {
  const { locale } = useApp();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [imageEditing, setImageEditing] = useState<Product | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const res = await fetch('/api/admin/products');
    if (res.ok) {
      const data = await res.json();
      setProducts(data.products);
      setCategories(data.categories);

      // If URL has ?edit=slug, open that product's edit form automatically
      const editSlug = searchParams.get('edit');
      if (editSlug) {
        const target = data.products.find((p: Product) => p.slug === editSlug);
        if (target) {
          setEditing(target);
          setShowForm(true);
        }
      }
    }
    setLoading(false);
  }

  async function handleDelete(slug: string) {
    if (!confirm(locale === 'ar' ? 'متأكد من حذف المنتج؟' : 'Delete this product?')) return;
    const res = await fetch(`/api/admin/products?slug=${encodeURIComponent(slug)}`, { method: 'DELETE' });
    if (res.ok) toast(locale === 'ar' ? 'تم حذف المنتج' : 'Product deleted');
    else toast(locale === 'ar' ? 'فشل الحذف' : 'Delete failed', 'error');
    loadData();
  }

  async function handleSaveImages(product: Product, images: string[]) {
    // Dedicated endpoint updates ONLY the images column — it can never
    // wipe material, color, description, or the published flag.
    const res = await fetch(`/api/admin/products/images?slug=${encodeURIComponent(product.slug)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ images }),
    });
    if (res.ok) toast(locale === 'ar' ? 'تم حفظ الصور' : 'Images saved');
    else toast(locale === 'ar' ? 'فشل الحفظ' : 'Save failed', 'error');
    loadData();
  }

  const filtered = products.filter(
    (p) =>
      p.name.ar.includes(search) ||
      p.name.en.toLowerCase().includes(search.toLowerCase()) ||
      (p.sku && p.sku.includes(search)),
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-charcoal dark:text-ivory">
          {locale === 'ar' ? 'المنتجات' : 'Products'}
        </h1>
        <button
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
          className="btn-press h-10 px-4 rounded-xl bg-forest text-ivory text-sm font-medium hover:bg-forest-light shadow-sm hover:shadow-md"
        >
          + {locale === 'ar' ? 'إضافة منتج' : 'Add Product'}
        </button>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={locale === 'ar' ? 'بحث بالاسم أو SKU...' : 'Search by name or SKU...'}
          className="w-full max-w-md h-10 px-3 rounded-xl bg-ivory dark:bg-charcoal-light border border-charcoal/10 dark:border-charcoal-border text-sm"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="bg-ivory dark:bg-charcoal-light rounded-2xl border border-charcoal/10 dark:border-charcoal-border p-4 space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="w-10 h-10 rounded-lg shrink-0" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-ivory dark:bg-charcoal-light rounded-2xl border border-charcoal/10 dark:border-charcoal-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-charcoal/10 dark:border-charcoal-border text-charcoal/60 dark:text-ivory/60">
                  <th className="text-start p-3 font-medium">{locale === 'ar' ? 'الصورة' : 'Image'}</th>
                  <th className="text-start p-3 font-medium">{locale === 'ar' ? 'الاسم' : 'Name'}</th>
                  <th className="text-start p-3 font-medium">{locale === 'ar' ? 'القسم' : 'Category'}</th>
                  <th className="text-start p-3 font-medium">SKU</th>
                  <th className="text-start p-3 font-medium">{locale === 'ar' ? 'السعر' : 'Price'}</th>
                  <th className="text-start p-3 font-medium">{locale === 'ar' ? 'مميز' : 'Featured'}</th>
                  <th className="text-end p-3 font-medium">{locale === 'ar' ? 'إجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.slug} className="border-b border-charcoal/5 dark:border-charcoal-border/50">
                    <td className="p-3">
                      <img src={p.images?.[0]} alt="" className="w-10 h-10 rounded-lg object-cover" />
                    </td>
                    <td className="p-3 font-medium text-charcoal dark:text-ivory">{p.name.ar}</td>
                    <td className="p-3 text-charcoal/60 dark:text-ivory/60">
                      {categories.find((c) => c.id === p.category)?.name?.ar || p.category}
                    </td>
                    <td className="p-3 text-charcoal/60 dark:text-ivory/60 font-mono text-xs">{p.sku || '—'}</td>
                    <td className="p-3 text-charcoal dark:text-ivory">
                      {p.price ? `${p.price.amount} SAR` : '—'}
                    </td>
                    <td className="p-3">
                      {p.featured && <span className="text-xs px-2 py-0.5 rounded-full bg-forest/10 text-forest">✓</span>}
                    </td>
                    <td className="p-3 text-end">
                      <button
                        onClick={() => setImageEditing(p)}
                        className="text-forest dark:text-forest-light hover:underline me-3"
                        title={locale === 'ar' ? 'تعديل الصور' : 'Manage images'}
                      >
                        🖼️ {locale === 'ar' ? 'الصور' : 'Images'}
                      </button>
                      <button
                        onClick={() => {
                          setEditing(p);
                          setShowForm(true);
                        }}
                        className="text-forest dark:text-forest-light hover:underline me-3"
                      >
                        {locale === 'ar' ? 'تعديل' : 'Edit'}
                      </button>
                      <button
                        onClick={() => handleDelete(p.slug)}
                        className="text-red-600 dark:text-red-400 hover:underline"
                      >
                        {locale === 'ar' ? 'حذف' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="p-8 text-center text-charcoal/50">
              {locale === 'ar' ? 'مفيش منتجات' : 'No products found'}
            </div>
          )}
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <ProductForm
          product={editing}
          categories={categories}
          onClose={() => setShowForm(false)}
          onSaved={loadData}
        />
      )}

      {/* Image manager modal */}
      {imageEditing && (
        <ImageManager
          currentImages={imageEditing.images || []}
          context="product"
          onSave={(images) => handleSaveImages(imageEditing, images)}
          onClose={() => setImageEditing(null)}
        />
      )}
    </div>
  );
}

function ProductForm({
  product,
  categories,
  onClose,
  onSaved,
}: {
  product: Product | null;
  categories: any[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const { locale } = useApp();
  const { toast } = useToast();
  const [form, setForm] = useState({
    slug: product?.slug || '',
    sku: product?.sku || '',
    name_ar: product?.name?.ar || '',
    name_en: product?.name?.en || '',
    category: product?.category || categories[0]?.id || '',
    price: product?.price?.amount?.toString() || '',
    featured: product?.featured || false,
    images: product?.images || ([] as string[]),
    seoTitle: product?.seoTitle || '',
    seoDescription: product?.seoDescription || '',
  });
  const [showImageManager, setShowImageManager] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);

    const payload: any = {
      slug: form.slug,
      sku: form.sku || undefined,
      name: { ar: form.name_ar, en: form.name_en },
      category: form.category,
      price: form.price ? parseInt(form.price) : null,
      featured: form.featured,
      images: form.images,
      seoTitle: form.seoTitle || undefined,
      seoDescription: form.seoDescription || undefined,
      // Preserve existing bilingual fields — this form doesn't edit them,
      // so sending empty values here would wipe them from the DB.
      ...(product
        ? {
            material: product.material,
            color: product.color,
            description: product.description,
            dimensions: product.dimensions,
            unit: product.unit,
            specs: product.specs,
            variations: product.variations,
            useCases: product.useCases,
            published: product.published,
          }
        : {
            material: { ar: '', en: '' },
            color: { ar: '', en: '' },
            description: { ar: '', en: '' },
          }),
    };

    try {
      const url = product
        ? `/api/admin/products?slug=${encodeURIComponent(product.slug)}`
        : '/api/admin/products';
      const res = await fetch(url, {
        method: product ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        onSaved();
        toast(product ? (locale === 'ar' ? 'تم حفظ التعديلات' : 'Changes saved') : (locale === 'ar' ? 'تم إضافة المنتج' : 'Product added'));
        onClose();
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
        <h2 className="text-lg font-bold text-charcoal dark:text-ivory mb-4">
          {product
            ? locale === 'ar' ? 'تعديل منتج' : 'Edit Product'
            : locale === 'ar' ? 'إضافة منتج' : 'Add Product'}
        </h2>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-700 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="text-xs font-medium text-charcoal/70 dark:text-ivory/70 mb-1 block">Slug *</span>
              <input
                required
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                disabled={!!product}
                className="w-full h-10 px-3 rounded-lg bg-sand-100 dark:bg-charcoal-elevated border border-charcoal/10 dark:border-charcoal-border text-sm disabled:opacity-50"
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-charcoal/70 dark:text-ivory/70 mb-1 block">SKU</span>
              <input
                value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
                className="w-full h-10 px-3 rounded-lg bg-sand-100 dark:bg-charcoal-elevated border border-charcoal/10 dark:border-charcoal-border text-sm"
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="text-xs font-medium text-charcoal/70 dark:text-ivory/70 mb-1 block">الاسم (عربي) *</span>
              <input
                required
                value={form.name_ar}
                onChange={(e) => setForm({ ...form, name_ar: e.target.value })}
                className="w-full h-10 px-3 rounded-lg bg-sand-100 dark:bg-charcoal-elevated border border-charcoal/10 dark:border-charcoal-border text-sm"
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-charcoal/70 dark:text-ivory/70 mb-1 block">Name (EN) *</span>
              <input
                required
                value={form.name_en}
                onChange={(e) => setForm({ ...form, name_en: e.target.value })}
                className="w-full h-10 px-3 rounded-lg bg-sand-100 dark:bg-charcoal-elevated border border-charcoal/10 dark:border-charcoal-border text-sm"
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="text-xs font-medium text-charcoal/70 dark:text-ivory/70 mb-1 block">
                {locale === 'ar' ? 'القسم' : 'Category'}
              </span>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full h-10 px-3 rounded-lg bg-sand-100 dark:bg-charcoal-elevated border border-charcoal/10 dark:border-charcoal-border text-sm"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name.ar}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-medium text-charcoal/70 dark:text-ivory/70 mb-1 block">
                {locale === 'ar' ? 'السعر (SAR)' : 'Price (SAR)'}
              </span>
              <input
                type="number"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                placeholder={locale === 'ar' ? 'اتركه فاضي لو السعر عند الطلب' : 'Leave empty for "on request"'}
                className="w-full h-10 px-3 rounded-lg bg-sand-100 dark:bg-charcoal-elevated border border-charcoal/10 dark:border-charcoal-border text-sm"
              />
            </label>
          </div>

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

          {/* SEO fields — optional, auto-generated from name if empty */}
          <div className="pt-2 border-t border-charcoal/10 dark:border-charcoal-border">
            <p className="text-xs font-semibold text-charcoal/70 dark:text-ivory/70 mb-2 flex items-center gap-1.5">
              🔍 {locale === 'ar' ? 'محركات البحث (اختياري)' : 'Search engines (optional)'}
            </p>
            <div className="space-y-3">
              <label className="block">
                <span className="text-xs text-charcoal/60 dark:text-ivory/60 mb-1 block">
                  {locale === 'ar' ? 'عنوان الصفحة (يظهر في جوجل)' : 'Page title (shown in Google)'}
                </span>
                <input
                  value={form.seoTitle}
                  onChange={(e) => setForm({ ...form, seoTitle: e.target.value })}
                  placeholder={locale === 'ar' ? 'اتركه فاضي = الاسم تلقائياً' : 'Empty = auto from name'}
                  className="w-full h-10 px-3 rounded-lg bg-sand-100 dark:bg-charcoal-elevated border border-charcoal/10 dark:border-charcoal-border text-sm"
                />
              </label>
              <label className="block">
                <span className="text-xs text-charcoal/60 dark:text-ivory/60 mb-1 block">
                  {locale === 'ar' ? 'وصف مختصر (يظهر تحت العنوان في جوجل)' : 'Short description (shown under the title)'}
                </span>
                <textarea
                  rows={2}
                  value={form.seoDescription}
                  onChange={(e) => setForm({ ...form, seoDescription: e.target.value })}
                  placeholder={locale === 'ar' ? '١٢٠-١٦٠ حرف' : '120-160 chars'}
                  className="w-full px-3 py-2 rounded-lg bg-sand-100 dark:bg-charcoal-elevated border border-charcoal/10 dark:border-charcoal-border text-sm resize-none"
                />
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="btn-press flex-1 h-10 rounded-xl bg-forest text-ivory text-sm font-medium hover:bg-forest-light disabled:opacity-50 shadow-sm hover:shadow-md"
            >
              {saving ? '...' : locale === 'ar' ? 'حفظ' : 'Save'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="h-10 px-4 rounded-xl border border-charcoal/15 dark:border-charcoal-border text-sm"
            >
              {locale === 'ar' ? 'إلغاء' : 'Cancel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
