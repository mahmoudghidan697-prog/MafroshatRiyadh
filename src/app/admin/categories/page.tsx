'use client';

import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { ImageManager } from '@/components/admin/ImageManager';

interface Category {
  id: string;
  name: { ar: string; en: string };
  image: string;
  primaryProductId?: string;
}

interface Product {
  slug: string;
  name: { ar: string; en: string };
}

export default function AdminCategories() {
  const { locale } = useApp();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    setLoading(true);
    const res = await fetch('/api/admin/products');
    if (res.ok) {
      const data = await res.json();
      setCategories(data.categories || []);
      setProducts(data.products || []);
    }
    setLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm(locale === 'ar' ? 'متأكد؟ المنتجات في القسم ده هتفضل موجودة' : 'Delete? Products in this category remain')) return;
    await fetch(`/api/admin/categories?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    loadCategories();
  }

  async function handleSaveCategoryImage(category: Category, image: string) {
    const payload = {
      id: category.id,
      name: category.name,
      image,
      primaryProductId: category.primaryProductId,
    };
    await fetch('/api/admin/categories', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    loadCategories();
  }

  // Get products for a specific category
  const getCategoryProducts = (categoryId: string) => {
    // We need to fetch products with their category info
    // The products from /api/admin/products should have category field
    return products.filter((p: any) => p.category === categoryId);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-charcoal dark:text-ivory">
          {locale === 'ar' ? 'الأقسام' : 'Categories'}
        </h1>
        <button
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
          className="h-10 px-4 rounded-xl bg-forest text-ivory text-sm font-medium hover:bg-forest-light"
        >
          + {locale === 'ar' ? 'إضافة قسم' : 'Add Category'}
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-charcoal/50">...</div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((c) => (
            <div
              key={c.id}
              className="bg-ivory dark:bg-charcoal-light rounded-2xl border border-charcoal/10 dark:border-charcoal-border overflow-hidden"
            >
              <img src={c.image} alt={c.name.ar} className="w-full aspect-[4/3] object-cover" />
              <div className="p-4">
                <div className="font-medium text-charcoal dark:text-ivory">{c.name.ar}</div>
                <div className="text-xs text-charcoal/50 dark:text-ivory/50 mb-1">{c.name.en}</div>
                <div className="text-xs text-forest dark:text-forest-light mb-3">
                  {c.primaryProductId
                    ? (locale === 'ar' ? 'منتج مرتبط: ' : 'Product: ') + c.primaryProductId
                    : (locale === 'ar' ? 'لا يوجد منتج رئيسي' : 'No primary product')}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditing(c);
                      setShowForm(true);
                    }}
                    className="text-sm text-forest dark:text-forest-light hover:underline"
                  >
                    {locale === 'ar' ? 'تعديل' : 'Edit'}
                  </button>
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="text-sm text-red-600 dark:text-red-400 hover:underline"
                  >
                    {locale === 'ar' ? 'حذف' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <CategoryForm
          category={editing}
          products={products}
          onClose={() => setShowForm(false)}
          onSaved={loadCategories}
        />
      )}
    </div>
  );
}

function CategoryForm({
  category,
  products,
  onClose,
  onSaved,
}: {
  category: Category | null;
  products: Product[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const { locale } = useApp();
  const [form, setForm] = useState({
    id: category?.id || '',
    name_ar: category?.name?.ar || '',
    name_en: category?.name?.en || '',
    image: category?.image || '/images/categories/default.jpg',
    primaryProductId: category?.primaryProductId || '',
  });
  const [imageSelection, setImageSelection] = useState<string[]>(
    category?.image ? [category.image] : [],
  );
  const [showImageManager, setShowImageManager] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Get products for this category (or all products if new category)
  const categoryProducts = category
    ? products.filter((p: any) => p.category === category.id)
    : [];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);

    const payload = {
      id: form.id,
      name: { ar: form.name_ar, en: form.name_en },
      image: imageSelection[0] || form.image,
      primaryProductId: form.primaryProductId || undefined,
    };

    try {
      const res = await fetch('/api/admin/categories', {
        method: category ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        onSaved();
        onClose();
      } else {
        const data = await res.json();
        setError(data.error || 'Save failed');
      }
    } catch {
      setError('Connection error');
    } finally {
      setSaving(false);
    }
  }

  if (showImageManager) {
    return (
      <ImageManager
        currentImages={imageSelection}
        context="category"
        onSave={(images) => {
          setImageSelection(images);
          if (images[0]) setForm({ ...form, image: images[0] });
          setShowImageManager(false);
        }}
        onClose={() => setShowImageManager(false)}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-ivory dark:bg-charcoal-light rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-bold text-charcoal dark:text-ivory mb-4">
          {category
            ? locale === 'ar' ? 'تعديل قسم' : 'Edit Category'
            : locale === 'ar' ? 'إضافة قسم' : 'Add Category'}
        </h2>
        {error && <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-700 text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="text-xs font-medium text-charcoal/70 dark:text-ivory/70 mb-1 block">
              ID (English, no spaces) *
            </span>
            <input
              required
              value={form.id}
              onChange={(e) => setForm({ ...form, id: e.target.value })}
              disabled={!!category}
              className="w-full h-10 px-3 rounded-lg bg-sand-100 dark:bg-charcoal-elevated border border-charcoal/10 dark:border-charcoal-border text-sm disabled:opacity-50"
            />
          </label>

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

          {/* Primary Product Selector */}
          <label className="block">
            <span className="text-xs font-medium text-charcoal/70 dark:text-ivory/70 mb-1 block">
              {locale === 'ar' ? 'المنتج الرئيسي' : 'Primary Product'}
            </span>
            <select
              value={form.primaryProductId}
              onChange={(e) => setForm({ ...form, primaryProductId: e.target.value })}
              className="w-full h-10 px-3 rounded-lg bg-sand-100 dark:bg-charcoal-elevated border border-charcoal/10 dark:border-charcoal-border text-sm"
            >
              <option value="">
                {locale === 'ar' ? '— بدون —' : '— None —'}
              </option>
              {categoryProducts.map((p) => (
                <option key={p.slug} value={p.slug}>
                  {locale === 'ar' ? p.name.ar : p.name.en}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-xs font-medium text-charcoal/70 dark:text-ivory/70 mb-1 block">
              {locale === 'ar' ? 'الصورة' : 'Image'}
            </span>
            <button
              type="button"
              onClick={() => setShowImageManager(true)}
              className="w-full h-10 px-3 rounded-lg bg-sand-100 dark:bg-charcoal-elevated border border-charcoal/10 dark:border-charcoal-border text-sm text-start hover:border-forest dark:hover:border-forest-light transition-colors flex items-center justify-between"
            >
              <span className="text-charcoal/60 dark:text-ivory/60 truncate">
                {imageSelection.length > 0
                  ? imageSelection[0].split('/').pop()
                  : locale === 'ar' ? 'اختار صورة...' : 'Choose image...'}
              </span>
              <span className="text-forest dark:text-forest-light shrink-0 ms-2">
                {locale === 'ar' ? 'تعديل' : 'Manage'}
              </span>
            </button>
          </label>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 h-10 rounded-xl bg-forest text-ivory text-sm font-medium hover:bg-forest-light disabled:opacity-50"
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
