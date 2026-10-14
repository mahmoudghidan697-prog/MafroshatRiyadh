'use client';

import { useState, useEffect, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { useToast } from '@/components/admin/Toast';
import { PhoneIcon } from '@/components/Icons';

/**
 * ContactEditBadge — a small pencil that appears next to a WhatsApp/phone
 * icon when an ADMIN hovers it, letting them change that specific icon's
 * number inline (without going to the dashboard). Positioned as a sibling
 * of the contact anchor; never shown to public visitors.
 *
 * The contact icon must carry a `data-contact-key` attribute; this badge
 * reads it from its own `contactKey` prop and PUTs the new number to
 * /api/admin/contacts, then calls `onSaved` so the parent refreshes.
 */
export function ContactEditBadge({
  contactKey,
  currentNumber,
  onSaved,
}: {
  contactKey: string;
  currentNumber: string;
  onSaved?: () => void;
}) {
  const { locale } = useApp();
  const { toast } = useToast();
  const isAr = locale === 'ar';
  const [isAdmin, setIsAdmin] = useState(false);
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(currentNumber);
  const [saving, setSaving] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Only show for logged-in admins
  useEffect(() => {
    let cancelled = false;
    fetch('/api/admin/me')
      .then((res) => { if (!cancelled) setIsAdmin(res.ok); })
      .catch(() => { if (!cancelled) setIsAdmin(false); });
    return () => { cancelled = true; };
  }, []);

  // Keep the input in sync when the number changes elsewhere
  useEffect(() => { setValue(currentNumber); }, [currentNumber]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  // Focus input when opened
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  if (!isAdmin) return null;

  async function save() {
    const digits = value.replace(/[^\d]/g, '');
    if (digits.length < 6) {
      toast(isAr ? 'رقم غير صحيح' : 'Invalid number', 'error');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/admin/contacts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: contactKey, number: digits }),
      });
      if (res.ok) {
        toast(isAr ? 'تم حفظ الرقم' : 'Number saved');
        setOpen(false);
        onSaved?.();
      } else {
        const err = await res.json().catch(() => ({}));
        toast(err.error || (isAr ? 'فشل الحفظ' : 'Save failed'), 'error');
      }
    } catch {
      toast(isAr ? 'خطأ في الاتصال' : 'Connection error', 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div ref={wrapRef} className="relative inline-flex" onClick={(e) => e.stopPropagation()}>
      {/* Pencil toggle — small, appears over the icon's corner */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={isAr ? 'تعديل الرقم' : 'Edit number'}
        title={isAr ? 'تعديل رقم الأيقونة دي' : 'Edit this icon\'s number'}
        className="w-5 h-5 rounded-full bg-charcoal/80 dark:bg-ivory/85 text-ivory dark:text-charcoal flex items-center justify-center shadow-md hover:scale-110 transition-transform"
      >
        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
        </svg>
      </button>

      {/* Inline edit popup */}
      {open && (
        <div className="absolute top-full mt-2 end-0 z-50 w-60 p-3 rounded-xl bg-ivory dark:bg-charcoal-light border border-charcoal/10 dark:border-charcoal-border shadow-float scale-in origin-top">
          <label className="block text-xs font-medium text-charcoal/60 dark:text-ivory/60 mb-1.5">
            {isAr ? 'رقم الأيقونة دي' : 'This icon\'s number'}
          </label>
          <input
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); save(); } }}
            dir="ltr"
            placeholder="9665xxxxxxx"
            className="w-full h-9 px-3 mb-2 rounded-lg bg-sand-100 dark:bg-charcoal border border-charcoal/10 dark:border-charcoal-border text-sm"
          />
          <div className="flex gap-2">
            <button
              onClick={save}
              disabled={saving}
              className="flex-1 h-9 rounded-lg bg-forest text-ivory text-sm font-medium hover:bg-forest-light disabled:opacity-50"
            >
              {saving ? '...' : isAr ? 'حفظ' : 'Save'}
            </button>
            <button
              onClick={() => setOpen(false)}
              className="h-9 px-3 rounded-lg border border-charcoal/15 dark:border-charcoal-border text-sm"
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
          </div>
          <p className="mt-2 text-[11px] text-charcoal/40 dark:text-ivory/40 leading-snug">
            {isAr
              ? 'الأرقام المستقلة: تغيير الرقم ده مايأثرش على أي أيقونة تانية.'
              : 'Independent: changing this number affects only this icon.'}
          </p>
        </div>
      )}
    </div>
  );
}
