'use client';

import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { useToast } from '@/components/admin/Toast';
import { ImageManager } from '@/components/admin/ImageManager';

/**
 * AddProductImagesButton — an admin-only button that appears inside the
 * product detail page gallery. It opens the ImageManager (upload from
 * device OR pick from the default library) and saves the resulting
 * image list straight to the product via the admin API.
 *
 * Invisible to regular visitors.
 */
export function AddProductImagesButton({
  product,
  onSaved,
}: {
  product: {
    slug: string;
    sku?: string;
    name: { ar: string; en: string };
    category: string;
    price?: { amount: number };
    featured: boolean;
    images: string[];
  };
  onSaved?: () => void;
}) {
  const { locale } = useApp();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checked, setChecked] = useState(false);
  const [showManager, setShowManager] = useState(false);
  const [saving, setSaving] = useState(false);

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

  async function handleSave(images: string[]) {
    setSaving(true);
    try {
      const payload = {
        slug: product.slug,
        sku: product.sku,
        name: product.name,
        category: product.category,
        price: product.price,
        featured: product.featured,
        images,
        material: { ar: '', en: '' },
        color: { ar: '', en: '' },
        description: { ar: '', en: '' },
      };
      const res = await fetch(
        `/api/admin/products?slug=${encodeURIComponent(product.slug)}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      );
      if (res.ok) {
        toast(locale === 'ar' ? 'تم حفظ الصور' : 'Images saved');
        setShowManager(false);
        onSaved?.();
        // Reload so the new gallery shows immediately
        window.location.reload();
      } else {
        toast(locale === 'ar' ? 'فشل الحفظ' : 'Save failed', 'error');
      }
    } catch {
      toast(locale === 'ar' ? 'خطأ في الاتصال' : 'Connection error', 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setShowManager(true)}
        disabled={saving}
        className="btn-press inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-forest text-ivory text-sm font-medium hover:bg-forest-light shadow-sm hover:shadow-md transition-all disabled:opacity-50"
      >
        <span className="text-base leading-none">🖼️</span>
        {saving
          ? locale === 'ar' ? 'جاري الحفظ...' : 'Saving...'
          : locale === 'ar' ? 'إضافة صور' : 'Add Images'}
      </button>

      {showManager && (
        <ImageManager
          currentImages={product.images}
          context="product"
          onSave={handleSave}
          onClose={() => setShowManager(false)}
        />
      )}
    </>
  );
}
