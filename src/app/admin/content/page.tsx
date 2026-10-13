'use client';

import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { useToast, Skeleton } from '@/components/admin/Toast';
import { CloseIcon } from '@/components/Icons';

type Section = 'services' | 'faqs';

interface ContentItem {
  item_id: string;
  data: any;
  sort_order: number;
  published: boolean;
}

export default function AdminContent() {
  const { locale } = useApp();
  const { toast } = useToast();
  const isAr = locale === 'ar';

  const [section, setSection] = useState<Section>('services');
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<ContentItem | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    load();
  }, [section]);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/content?section=${section}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.items);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(item: ContentItem) {
    if (!confirm(isAr ? `حذف "${getTitle(item)}"؟` : `Delete "${getTitle(item)}"?`)) return;
    const res = await fetch(`/api/admin/content?section=${section}&item_id=${item.item_id}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      toast(isAr ? 'تم الحذف' : 'Deleted');
      load();
    } else {
      toast(isAr ? 'فشل الحذف' : 'Delete failed', 'error');
    }
  }

  async function handleTogglePublish(item: ContentItem) {
    const res = await fetch('/api/admin/content', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ section, item_id: item.item_id, published: !item.published }),
    });
    if (res.ok) {
      toast(item.published ? (isAr ? 'تم الإخفاء' : 'Hidden') : isAr ? 'تم النشر' : 'Published');
      load();
    } else {
      toast(isAr ? 'فشل' : 'Failed', 'error');
    }
  }

  async function handleMove(item: ContentItem, direction: -1 | 1) {
    const idx = items.findIndex((i) => i.item_id === item.item_id);
    const target = items[idx + direction];
    if (!target) return;
    // swap sort orders
    await Promise.all([
      fetch('/api/admin/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section, item_id: item.item_id, data: item.data, sort_order: target.sort_order }),
      }),
      fetch('/api/admin/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section, item_id: target.item_id, data: target.data, sort_order: item.sort_order }),
      }),
    ]);
    load();
  }

  function getTitle(item: ContentItem): string {
    if (section === 'services') return isAr ? item.data.title?.ar : item.data.title?.en;
    return isAr ? item.data.question?.ar : item.data.question?.en;
  }

  function getBody(item: ContentItem): string {
    if (section === 'services') return isAr ? item.data.description?.ar : item.data.description?.en;
    return isAr ? item.data.answer?.ar : item.data.answer?.en;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-charcoal dark:text-ivory">
            {isAr ? 'محتوى الموقع' : 'Site Content'}
          </h1>
          <p className="text-sm text-charcoal/60 dark:text-ivory/60 mt-1">
            {isAr
              ? 'تحكّم في الخدمات والأسئلة الشائعة اللي بتظهر للزوار.'
              : 'Manage the services and FAQs visitors see.'}
          </p>
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
          className="btn-press h-10 px-4 rounded-xl bg-forest text-ivory text-sm font-medium hover:bg-forest-light"
        >
          + {isAr ? 'إضافة' : 'Add'}
        </button>
      </div>

      {/* Section tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setSection('services')}
          className={`btn-press px-4 py-2 rounded-xl text-sm font-medium ${
            section === 'services' ? 'bg-forest text-ivory' : 'bg-ivory dark:bg-charcoal-light border border-charcoal/10 dark:border-charcoal-border text-charcoal/70 dark:text-ivory/70'
          }`}
        >
          🚚 {isAr ? 'الخدمات' : 'Services'} ({items.length})
        </button>
        <button
          onClick={() => setSection('faqs')}
          className={`btn-press px-4 py-2 rounded-xl text-sm font-medium ${
            section === 'faqs' ? 'bg-forest text-ivory' : 'bg-ivory dark:bg-charcoal-light border border-charcoal/10 dark:border-charcoal-border text-charcoal/70 dark:text-ivory/70'
          }`}
        >
          ❓ {isAr ? 'الأسئلة الشائعة' : 'FAQs'} ({items.length})
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="p-12 text-center text-charcoal/50 dark:text-ivory/50 rounded-2xl border-2 border-dashed border-charcoal/10 dark:border-charcoal-border">
          <p>{isAr ? 'مفيش عناصر — أضف واحد' : 'No items — add one'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item, idx) => (
            <div
              key={item.item_id}
              className={`p-4 rounded-xl bg-ivory dark:bg-charcoal-light border border-charcoal/10 dark:border-charcoal-border ${!item.published ? 'opacity-50' : ''}`}
            >
              <div className="flex items-start gap-3">
                {section === 'services' && (
                  <span className="text-2xl shrink-0 mt-0.5">{iconEmoji(item.data.icon)}</span>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-charcoal dark:text-ivory">{getTitle(item)}</span>
                    {!item.published && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-charcoal/10 text-charcoal/60 dark:bg-ivory/10 dark:text-ivory/60">
                        {isAr ? 'مخفي' : 'Hidden'}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-charcoal/60 dark:text-ivory/60 mt-1 line-clamp-2">
                    {getBody(item)}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleMove(item, -1)}
                    disabled={idx === 0}
                    title={isAr ? 'أعلى' : 'Move up'}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-sand-100 dark:hover:bg-charcoal-elevated disabled:opacity-30 text-sm"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => handleMove(item, 1)}
                    disabled={idx === items.length - 1}
                    title={isAr ? 'أسفل' : 'Move down'}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-sand-100 dark:hover:bg-charcoal-elevated disabled:opacity-30 text-sm"
                  >
                    ↓
                  </button>
                  <button
                    onClick={() => handleTogglePublish(item)}
                    title={item.published ? (isAr ? 'إخفاء' : 'Hide') : isAr ? 'نشر' : 'Publish'}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-sand-100 dark:hover:bg-charcoal-elevated text-sm"
                  >
                    {item.published ? '👁️' : '🚫'}
                  </button>
                  <button
                    onClick={() => {
                      setEditing(item);
                      setShowForm(true);
                    }}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-sand-100 dark:hover:bg-charcoal-elevated text-sm"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDelete(item)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-sm"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <ContentForm
          section={section}
          item={editing}
          nextOrder={items.length}
          onClose={() => setShowForm(false)}
          onSaved={load}
        />
      )}
    </div>
  );
}

function iconEmoji(icon?: string): string {
  const map: Record<string, string> = {
    truck: '🚚',
    ruler: '📏',
    wrench: '🔧',
    shield: '🛡️',
  };
  return map[icon || ''] || '⭐';
}

function ContentForm({
  section,
  item,
  nextOrder,
  onClose,
  onSaved,
}: {
  section: Section;
  item: ContentItem | null;
  nextOrder: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { locale } = useApp();
  const { toast } = useToast();
  const isAr = locale === 'ar';
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState(() => {
    const d = item?.data || {};
    if (section === 'services') {
      return {
        icon: d.icon || 'truck',
        title_ar: d.title?.ar || '',
        title_en: d.title?.en || '',
        desc_ar: d.description?.ar || '',
        desc_en: d.description?.en || '',
      };
    }
    return {
      q_ar: d.question?.ar || '',
      q_en: d.question?.en || '',
      a_ar: d.answer?.ar || '',
      a_en: d.answer?.en || '',
    };
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      let data: any;
      if (section === 'services') {
        data = {
          icon: form.icon,
          title: { ar: form.title_ar, en: form.title_en },
          description: { ar: form.desc_ar, en: form.desc_en },
        };
      } else {
        data = {
          question: { ar: form.q_ar, en: form.q_en },
          answer: { ar: form.a_ar, en: form.a_en },
        };
      }
      const item_id = item?.item_id || `${section.slice(0, -1)}-${Date.now()}`;
      const res = await fetch('/api/admin/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section, item_id, data, sort_order: item?.sort_order ?? nextOrder }),
      });
      if (res.ok) {
        toast(isAr ? 'تم الحفظ ✓' : 'Saved ✓');
        onSaved();
        onClose();
      } else {
        toast(isAr ? 'فشل الحفظ' : 'Save failed', 'error');
      }
    } finally {
      setSaving(false);
    }
  }

  const inputCls =
    'w-full px-3 py-2 rounded-lg bg-sand-100 dark:bg-charcoal-elevated border border-charcoal/10 dark:border-charcoal-border text-sm text-charcoal dark:text-ivory focus:outline-none focus:border-forest';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-ivory dark:bg-charcoal-light rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-charcoal dark:text-ivory">
            {section === 'services'
              ? item
                ? isAr ? 'تعديل خدمة' : 'Edit Service'
                : isAr ? 'إضافة خدمة' : 'Add Service'
              : item
              ? isAr ? 'تعديل سؤال' : 'Edit FAQ'
              : isAr ? 'إضافة سؤال' : 'Add FAQ'}
          </h2>
          <button onClick={onClose} aria-label="Close">
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {section === 'services' && (
            <label className="block">
              <span className="text-xs font-medium text-charcoal/70 dark:text-ivory/70 mb-1 block">
                {isAr ? 'الأيقونة' : 'Icon'}
              </span>
              <select
                value={form.icon}
                onChange={(e) => setForm({ ...form, icon: e.target.value })}
                className={inputCls}
              >
                <option value="truck">🚚 {isAr ? 'توريد وتوصيل' : 'Truck / Delivery'}</option>
                <option value="ruler">📏 {isAr ? 'قياس' : 'Ruler / Measurement'}</option>
                <option value="wrench">🔧 {isAr ? 'تركيب' : 'Wrench / Install'}</option>
                <option value="shield">🛡️ {isAr ? 'ضمان / استشارة' : 'Shield / Warranty'}</option>
              </select>
            </label>
          )}

          {section === 'services' ? (
            <>
              <label className="block">
                <span className="text-xs font-medium text-charcoal/70 dark:text-ivory/70 mb-1 block">
                  {isAr ? 'العنوان (عربي)' : 'Title (Arabic)'}
                </span>
                <input required value={form.title_ar} onChange={(e) => setForm({ ...form, title_ar: e.target.value })} className={inputCls} />
              </label>
              <label className="block">
                <span className="text-xs font-medium text-charcoal/70 dark:text-ivory/70 mb-1 block">Title (English)</span>
                <input required value={form.title_en} onChange={(e) => setForm({ ...form, title_en: e.target.value })} className={inputCls} dir="ltr" />
              </label>
              <label className="block">
                <span className="text-xs font-medium text-charcoal/70 dark:text-ivory/70 mb-1 block">
                  {isAr ? 'الوصف (عربي)' : 'Description (Arabic)'}
                </span>
                <textarea rows={3} required value={form.desc_ar} onChange={(e) => setForm({ ...form, desc_ar: e.target.value })} className={inputCls} />
              </label>
              <label className="block">
                <span className="text-xs font-medium text-charcoal/70 dark:text-ivory/70 mb-1 block">Description (English)</span>
                <textarea rows={3} required value={form.desc_en} onChange={(e) => setForm({ ...form, desc_en: e.target.value })} className={inputCls} dir="ltr" />
              </label>
            </>
          ) : (
            <>
              <label className="block">
                <span className="text-xs font-medium text-charcoal/70 dark:text-ivory/70 mb-1 block">
                  {isAr ? 'السؤال (عربي)' : 'Question (Arabic)'}
                </span>
                <input required value={form.q_ar} onChange={(e) => setForm({ ...form, q_ar: e.target.value })} className={inputCls} />
              </label>
              <label className="block">
                <span className="text-xs font-medium text-charcoal/70 dark:text-ivory/70 mb-1 block">Question (English)</span>
                <input required value={form.q_en} onChange={(e) => setForm({ ...form, q_en: e.target.value })} className={inputCls} dir="ltr" />
              </label>
              <label className="block">
                <span className="text-xs font-medium text-charcoal/70 dark:text-ivory/70 mb-1 block">
                  {isAr ? 'الإجابة (عربي)' : 'Answer (Arabic)'}
                </span>
                <textarea rows={4} required value={form.a_ar} onChange={(e) => setForm({ ...form, a_ar: e.target.value })} className={inputCls} />
              </label>
              <label className="block">
                <span className="text-xs font-medium text-charcoal/70 dark:text-ivory/70 mb-1 block">Answer (English)</span>
                <textarea rows={4} required value={form.a_en} onChange={(e) => setForm({ ...form, a_en: e.target.value })} className={inputCls} dir="ltr" />
              </label>
            </>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 h-10 rounded-xl bg-forest text-ivory text-sm font-medium hover:bg-forest-light disabled:opacity-50"
            >
              {saving ? '...' : isAr ? 'حفظ' : 'Save'}
            </button>
            <button type="button" onClick={onClose} className="h-10 px-4 rounded-xl border border-charcoal/15 dark:border-charcoal-border text-sm">
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
