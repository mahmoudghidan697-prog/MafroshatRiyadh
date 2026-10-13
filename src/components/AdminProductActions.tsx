'use client';

import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { useToast } from '@/components/admin/Toast';
import type { Product } from '@/data/site';

/**
 * AdminProductActions — small edit/delete buttons that overlay the
 * top corner of a product card, visible ONLY to logged-in admins.
 */
export function AdminProductActions({ product }: { product: Product }) {
  const { locale } = useApp();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checked, setChecked] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(locale === 'ar' ? `حذف "${product.name.ar}"؟` : `Delete "${product.name.en}"?`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/products?slug=${encodeURIComponent(product.slug)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        toast(locale === 'ar' ? 'تم حذف المنتج' : 'Product deleted');
        window.location.reload();
      } else {
        toast(locale === 'ar' ? 'فشل الحذف' : 'Delete failed', 'error');
      }
    } catch {
      toast(locale === 'ar' ? 'خطأ في الاتصال' : 'Connection error', 'error');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="absolute top-3 inset-inline-end-3 z-20 flex gap-1.5">
      {/* Edit */}
      <a
        href={`/admin/products?edit=${encodeURIComponent(product.slug)}`}
        onClick={(e) => e.stopPropagation()}
        aria-label={locale === 'ar' ? 'تعديل' : 'Edit'}
        title={locale === 'ar' ? 'تعديل المنتج' : 'Edit product'}
        className="btn-press w-8 h-8 rounded-lg bg-forest text-ivory flex items-center justify-center shadow-md hover:bg-forest-light text-xs"
      >
        ✏️
      </a>
      {/* Delete */}
      <button
        onClick={handleDelete}
        disabled={deleting}
        aria-label={locale === 'ar' ? 'حذف' : 'Delete'}
        title={locale === 'ar' ? 'حذف المنتج' : 'Delete product'}
        className="btn-press w-8 h-8 rounded-lg bg-red-600 text-white flex items-center justify-center shadow-md hover:bg-red-700 text-xs disabled:opacity-50"
      >
        {deleting ? '...' : '🗑️'}
      </button>
    </div>
  );
}
