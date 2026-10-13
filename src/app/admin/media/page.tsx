'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '@/context/AppContext';
import { useToast } from '@/components/admin/Toast';
import { ImageIcon } from '@/components/Icons';

interface GalleryImage {
  path: string;
  folder: 'products' | 'categories';
  name: string;
}

const MAX_SIZE = 8 * 1024 * 1024; // 8 MB

/**
 * AdminMedia — a central media library: every uploaded image in one
 * place. Upload new images, copy their public path, or delete them.
 * Images live in public/images/{products,categories}/ and are served
 * statically, so a copied path like `/images/products/x.jpg` can be
 * pasted anywhere (product images, category image, logo).
 */
export default function AdminMedia() {
  const { locale } = useApp();
  const { toast } = useToast();
  const isAr = locale === 'ar';

  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [filter, setFilter] = useState<'all' | 'products' | 'categories'>('all');
  const [preview, setPreview] = useState<GalleryImage | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/media');
      if (res.ok) {
        const data = await res.json();
        setImages(data.images);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function uploadFile(file: File) {
    setUploadError('');
    if (!file.type.startsWith('image/')) {
      setUploadError(isAr ? 'الملف مش صورة' : 'Not an image file');
      return;
    }
    if (file.size > MAX_SIZE) {
      setUploadError(isAr ? 'الصورة كبيرة جداً (الحد ٨ ميجا)' : 'File too large (max 8MB)');
      return;
    }

    setUploading(true);
    try {
      const reader = new FileReader();
      const dataUrl = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const res = await fetch('/api/admin/media/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: dataUrl, filename: file.name }),
      });
      const data = await res.json();
      if (res.ok && data.path) {
        toast(isAr ? 'تم رفع الصورة ✓' : 'Image uploaded ✓');
        await load();
      } else {
        setUploadError(data.error || (isAr ? 'فشل الرفع' : 'Upload failed'));
      }
    } catch {
      setUploadError(isAr ? 'خطأ في قراءة الملف' : 'Error reading file');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleDelete(img: GalleryImage) {
    if (!confirm(isAr ? `حذف الصورة "${img.name}"؟` : `Delete "${img.name}"?`)) return;
    setDeleting(img.path);
    try {
      const res = await fetch(`/api/admin/media?path=${encodeURIComponent(img.path)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        toast(isAr ? 'تم حذف الصورة' : 'Image deleted');
        await load();
      } else {
        toast(isAr ? 'فشل الحذف' : 'Delete failed', 'error');
      }
    } catch {
      toast(isAr ? 'خطأ في الاتصال' : 'Connection error', 'error');
    } finally {
      setDeleting(null);
    }
  }

  async function copyPath(img: GalleryImage) {
    try {
      await navigator.clipboard.writeText(img.path);
      toast(isAr ? 'تم نسخ المسار ✓' : 'Path copied ✓');
    } catch {
      // clipboard blocked — show it so the user can copy manually
      toast(img.path);
    }
  }

  const filtered = filter === 'all' ? images : images.filter((i) => i.folder === filter);
  const totalSize = images.length;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-charcoal dark:text-ivory">
            {isAr ? 'معرض الصور' : 'Media Library'}
          </h1>
          <p className="text-sm text-charcoal/60 dark:text-ivory/60 mt-1">
            {isAr
              ? `${totalSize} صورة — ارفع، انسخ المسار، أو احذف`
              : `${totalSize} images — upload, copy the path, or delete`}
          </p>
        </div>
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
            multiple
            onChange={(e) => {
              const files = Array.from(e.target.files || []);
              files.forEach((f) => uploadFile(f));
            }}
            className="hidden"
            id="media-upload-input"
          />
          <label
            htmlFor="media-upload-input"
            className={`btn-press inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-forest text-ivory text-sm font-medium cursor-pointer hover:bg-forest-light transition-colors ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
          >
            <ImageIcon className="w-4 h-4" />
            {uploading ? (isAr ? 'جاري الرفع...' : 'Uploading...') : isAr ? 'رفع صور' : 'Upload images'}
          </label>
        </div>
      </div>

      {uploadError && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm">
          {uploadError}
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {(['all', 'products', 'categories'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`btn-press px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-forest text-ivory'
                : 'bg-ivory dark:bg-charcoal-light text-charcoal/70 dark:text-ivory/70 border border-charcoal/10 dark:border-charcoal-border'
            }`}
          >
            {f === 'all'
              ? `${isAr ? 'الكل' : 'All'} (${images.length})`
              : f === 'products'
              ? `${isAr ? 'منتجات' : 'Products'} (${images.filter((i) => i.folder === 'products').length})`
              : `${isAr ? 'أقسام' : 'Categories'} (${images.filter((i) => i.folder === 'categories').length})`}
          </button>
        ))}
      </div>

      {/* Drag & drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const files = Array.from(e.dataTransfer.files || []);
          files.forEach((f) => uploadFile(f));
        }}
        className={`mb-6 p-6 rounded-2xl border-2 border-dashed text-center transition-colors ${
          dragOver
            ? 'border-forest bg-forest/5'
            : 'border-charcoal/15 dark:border-charcoal-border'
        }`}
      >
        <ImageIcon className="w-8 h-8 mx-auto mb-2 text-charcoal/30 dark:text-ivory/30" />
        <p className="text-sm text-charcoal/60 dark:text-ivory/60">
          {isAr ? 'اسحب الصور هنا أو استخدم زر "رفع صور"' : 'Drag images here or use "Upload images"'}
        </p>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="aspect-square rounded-xl bg-sand-100 dark:bg-charcoal-light animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center text-charcoal/50 dark:text-ivory/50">
          <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>{isAr ? 'مفيش صور هنا' : 'No images here'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((img) => (
            <div
              key={img.path}
              className="group relative rounded-xl overflow-hidden border border-charcoal/10 dark:border-charcoal-border bg-ivory dark:bg-charcoal-light"
            >
              <button
                onClick={() => setPreview(img)}
                className="block w-full aspect-square"
                aria-label={img.name}
              >
                <img src={img.path} alt={img.name} className="w-full h-full object-cover" loading="lazy" />
              </button>

              {/* hover actions */}
              <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex gap-1.5">
                <button
                  onClick={() => copyPath(img)}
                  title={isAr ? 'نسخ المسار' : 'Copy path'}
                  className="flex-1 h-8 rounded-lg bg-ivory/90 text-charcoal text-xs font-medium hover:bg-ivory"
                >
                  {isAr ? 'نسخ' : 'Copy'}
                </button>
                <button
                  onClick={() => handleDelete(img)}
                  disabled={deleting === img.path}
                  title={isAr ? 'حذف' : 'Delete'}
                  className="w-8 h-8 rounded-lg bg-red-600 text-white text-xs flex items-center justify-center hover:bg-red-700 disabled:opacity-50"
                >
                  {deleting === img.path ? '…' : '🗑'}
                </button>
              </div>

              {/* name bar */}
              <div className="p-2">
                <p className="text-xs text-charcoal/60 dark:text-ivory/60 truncate" title={img.name}>
                  {img.name}
                </p>
                <p className="text-[10px] text-charcoal/40 dark:text-ivory/40 truncate" dir="ltr">
                  {img.path}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview lightbox */}
      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setPreview(null)} />
          <div className="relative max-w-3xl w-full">
            <img src={preview.path} alt={preview.name} className="w-full rounded-xl" />
            <div className="mt-3 flex justify-between items-center text-sm">
              <span className="text-ivory truncate" dir="ltr">
                {preview.path}
              </span>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => copyPath(preview)}
                  className="h-9 px-4 rounded-lg bg-ivory text-charcoal text-sm font-medium hover:bg-ivory/90"
                >
                  {isAr ? 'نسخ المسار' : 'Copy path'}
                </button>
                <button
                  onClick={() => setPreview(null)}
                  className="h-9 px-4 rounded-lg bg-charcoal text-ivory text-sm"
                >
                  {isAr ? 'إغلاق' : 'Close'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
