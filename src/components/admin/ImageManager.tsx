'use client';

import { useState, useEffect, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { CloseIcon, SparkleIcon } from '@/components/Icons';

interface ImageManagerProps {
  currentImages: string[];
  onSave: (images: string[]) => void;
  onClose: () => void;
  /** 'product' or 'category' — changes which default library is shown */
  context?: 'product' | 'category';
}

export function ImageManager({ currentImages, onSave, onClose, context = 'product' }: ImageManagerProps) {
  const { locale } = useApp();
  const [selected, setSelected] = useState<string[]>(currentImages);
  const [defaults, setDefaults] = useState<{ products: string[]; categories: string[] }>({ products: [], categories: [] });
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [showLibrary, setShowLibrary] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/admin/upload');
        if (res.ok) {
          const data = await res.json();
          setDefaults({ products: data.products, categories: data.categories });
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function toggleImage(path: string) {
    setSelected((prev) =>
      prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path],
    );
  }

  function removeImage(path: string) {
    setSelected((prev) => prev.filter((p) => p !== path));
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError('');
    setUploading(true);

    try {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setUploadError(locale === 'ar' ? 'الملف مش صورة' : 'Not an image file');
        return;
      }

      // Validate size (8MB max)
      if (file.size > 8 * 1024 * 1024) {
        setUploadError(locale === 'ar' ? 'الصورة كبيرة جداً (الحد ٨ ميجا)' : 'File too large (max 8MB)');
        return;
      }

      // Read file as base64
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;

        // Generate a safe filename from the original
        const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
        const baseName = file.name
          .replace(/\.[^.]+$/, '')
          .replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, '-')
          .toLowerCase()
          .slice(0, 50);
        const filename = `${baseName || 'upload'}-${Date.now()}.${ext}`;

        const res = await fetch('/api/admin/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: base64, filename }),
        });

        if (res.ok) {
          const data = await res.json();
          setSelected((prev) => [...prev, data.path]);
          // Refresh the defaults list to include the new upload
          const listRes = await fetch('/api/admin/upload');
          if (listRes.ok) {
            const listData = await listRes.json();
            setDefaults({ products: listData.products, categories: listData.categories });
          }
        } else {
          const err = await res.json();
          setUploadError(err.error || (locale === 'ar' ? 'فشل الرفع' : 'Upload failed'));
        }
      };
      reader.readAsDataURL(file);
    } catch {
      setUploadError(locale === 'ar' ? 'خطأ في قراءة الملف' : 'Error reading file');
    } finally {
      setUploading(false);
      // Reset input so the same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  const library = context === 'category' ? defaults.categories : defaults.products;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative bg-ivory dark:bg-charcoal-light rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-charcoal dark:text-ivory">
            {locale === 'ar' ? 'إدارة الصور' : 'Manage Images'}
          </h2>
          <button onClick={onClose} aria-label="Close" className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-sand-100 dark:hover:bg-charcoal-elevated">
            <CloseIcon className="w-4 h-4" />
          </button>
        </div>

        {/* ─── Currently selected images ─── */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-charcoal dark:text-ivory mb-3">
            {locale === 'ar' ? 'الصور الحالية' : 'Current Images'}
            <span className="text-charcoal/40 dark:text-ivory/40 ms-1">({selected.length})</span>
          </h3>
          {selected.length === 0 ? (
            <div className="p-6 rounded-xl border-2 border-dashed border-charcoal/15 dark:border-charcoal-border text-center text-sm text-charcoal/50 dark:text-ivory/50">
              {locale === 'ar' ? 'مفيش صور — أضف من الزر تحت' : 'No images — add one below'}
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {selected.map((img, i) => (
                <div key={img + i} className="relative group rounded-xl overflow-hidden border border-charcoal/10 dark:border-charcoal-border aspect-[4/3]">
                  <img src={img} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={() => removeImage(img)}
                    className="absolute top-1 end-1 w-6 h-6 rounded-full bg-red-500 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label={locale === 'ar' ? 'حذف' : 'Remove'}
                  >
                    ✕
                  </button>
                  {i === 0 && (
                    <span className="absolute bottom-1 start-1 px-1.5 py-0.5 rounded bg-forest text-ivory text-[10px] font-medium">
                      {locale === 'ar' ? 'رئيسية' : 'Main'}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ─── Two options: Upload or Library ─── */}
        <div className="grid sm:grid-cols-2 gap-3 mb-6">
          {/* Option 1: Upload from device */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
              onChange={handleUpload}
              className="hidden"
              id="image-upload-input"
            />
            <label
              htmlFor="image-upload-input"
              className={`flex flex-col items-center justify-center gap-2 p-5 rounded-xl border-2 border-dashed border-forest/30 dark:border-forest-light/30 cursor-pointer hover:border-forest dark:hover:border-forest-light hover:bg-forest/5 transition-colors ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
            >
              <span className="text-2xl">📁</span>
              <span className="text-sm font-medium text-charcoal dark:text-ivory text-center">
                {uploading
                  ? locale === 'ar' ? 'جاري الرفع...' : 'Uploading...'
                  : locale === 'ar' ? 'ارفع صورة من جهازك' : 'Upload from your device'}
              </span>
              <span className="text-xs text-charcoal/40 dark:text-ivory/40">
                {locale === 'ar' ? 'JPG / PNG / WEBP — حد ٨ ميجا' : 'JPG / PNG / WEBP — max 8MB'}
              </span>
            </label>
            {uploadError && (
              <p className="mt-2 text-xs text-red-600 dark:text-red-400 text-center">{uploadError}</p>
            )}
          </div>

          {/* Option 2: Choose from defaults */}
          <button
            onClick={() => setShowLibrary(!showLibrary)}
            className="flex flex-col items-center justify-center gap-2 p-5 rounded-xl border-2 border-dashed border-sand-400 dark:border-charcoal-border cursor-pointer hover:border-forest/40 hover:bg-sand-50 dark:hover:bg-charcoal-elevated transition-colors"
          >
            <span className="text-2xl">🖼️</span>
            <span className="text-sm font-medium text-charcoal dark:text-ivory text-center">
              {locale === 'ar' ? 'اختار من الصور الافتراضية' : 'Choose from default images'}
            </span>
            <span className="text-xs text-charcoal/40 dark:text-ivory/40">
              {library.length} {locale === 'ar' ? 'صورة متاحة' : 'images available'}
            </span>
          </button>
        </div>

        {/* ─── Default library (expandable) ─── */}
        {showLibrary && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-charcoal dark:text-ivory mb-3">
              {locale === 'ar' ? 'الصور الافتراضية' : 'Default Image Library'}
            </h3>
            {loading ? (
              <div className="p-6 text-center text-charcoal/50 text-sm">...</div>
            ) : library.length === 0 ? (
              <div className="p-6 text-center text-charcoal/50 text-sm">
                {locale === 'ar' ? 'مفيش صور' : 'No images found'}
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-64 overflow-y-auto p-1">
                {library.map((img) => {
                  const isSelected = selected.includes(img);
                  return (
                    <button
                      key={img}
                      onClick={() => toggleImage(img)}
                      className={`relative rounded-xl overflow-hidden border-2 aspect-[4/3] transition-colors ${
                        isSelected
                          ? 'border-forest dark:border-forest-light ring-2 ring-forest/20'
                          : 'border-transparent hover:border-forest/40'
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                      {isSelected && (
                        <span className="absolute inset-0 bg-forest/20 flex items-center justify-center">
                          <span className="w-6 h-6 rounded-full bg-forest text-ivory flex items-center justify-center text-xs">✓</span>
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ─── Save / Cancel ─── */}
        <div className="flex gap-3 pt-4 border-t border-charcoal/10 dark:border-charcoal-border">
          <button
            onClick={() => {
              onSave(selected);
              onClose();
            }}
            className="flex-1 h-10 rounded-xl bg-forest text-ivory text-sm font-medium hover:bg-forest-light"
          >
            {locale === 'ar' ? `حفظ (${selected.length} صورة)` : `Save (${selected.length} images)`}
          </button>
          <button
            onClick={onClose}
            className="h-10 px-4 rounded-xl border border-charcoal/15 dark:border-charcoal-border text-sm"
          >
            {locale === 'ar' ? 'إلغاء' : 'Cancel'}
          </button>
        </div>
      </div>
    </div>
  );
}
