'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { useToast } from '@/components/admin/Toast';

interface Contact {
  key: string;
  name: { ar: string; en: string };
  type: 'whatsapp' | 'phone';
  number: string;
  location: { ar: string; en: string };
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function AdminContacts() {
  const { locale } = useApp();
  const { toast } = useToast();
  const router = useRouter();
  const isAr = locale === 'ar';
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [editNumber, setEditNumber] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const res = await fetch('/api/admin/contacts');
    if (res.ok) {
      const data = await res.json();
      setContacts(data.contacts);
    }
    setLoading(false);
  }

  async function save(key: string) {
    setSaving(true);
    const res = await fetch('/api/admin/contacts', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, number: editNumber }),
    });
    if (res.ok) {
      toast(isAr ? 'تم حفظ الرقم' : 'Number saved');
      setEditing(null);
      load();
    } else {
      const err = await res.json();
      toast(err.error || (isAr ? 'فشل الحفظ' : 'Save failed'), 'error');
    }
    setSaving(false);
  }

  async function toggleActive(c: Contact) {
    const res = await fetch('/api/admin/contacts', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: c.key, active: !c.active }),
    });
    if (res.ok) {
      toast(c.active ? (isAr ? 'تم التعطيل' : 'Disabled') : (isAr ? 'تم التفعيل' : 'Enabled'));
      load();
    } else {
      toast(isAr ? 'فشل' : 'Failed', 'error');
    }
  }

  const typeBadge = (type: string) =>
    type === 'whatsapp'
      ? { cls: 'bg-[#25D366]/10 text-[#25D366] dark:bg-[#25D366]/15', label: 'واتساب', labelEn: 'WhatsApp' }
      : { cls: 'bg-forest/10 text-forest dark:bg-forest-light/15 dark:text-forest-light', label: 'هاتف', labelEn: 'Phone' };

  // Map each contact key to the public page where it appears
  const keyToPage: Record<string, string> = {
    header_whatsapp: '/',
    header_phone: '/',
    footer_whatsapp: '/',
    footer_phone: '/',
    floating_whatsapp: '/',
    floating_phone: '/',
    home_whatsapp: '/',
    home_phone: '/',
    product_whatsapp: '/catalog',
    product_phone: '/catalog',
    product_detail_whatsapp: '/catalog',
    product_detail_phone: '/catalog',
    contact_page_whatsapp: '/contact',
    contact_page_phone: '/contact',
    solutions_whatsapp: '/solutions',
    solutions_phone: '/solutions',
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-charcoal dark:text-ivory">
          {isAr ? 'إدارة أيقونات التواصل' : 'Contact Icons'}
        </h1>
        <p className="text-sm text-charcoal/60 dark:text-ivory/60 mt-1">
          {isAr
            ? 'تحكّم في كل أيقونة واتساب وهاتف على حدة. تغيير رقم أيقونة لا يؤثر على غيرها. التغيير يظهر على الموقع فوراً.'
            : 'Control every WhatsApp and phone icon independently. Changing one icon\'s number never affects others. Changes appear on the site instantly.'}
        </p>
      </div>

      {loading ? (
        <p className="text-charcoal/60 dark:text-ivory/60">{isAr ? 'جاري التحميل...' : 'Loading...'}</p>
      ) : contacts.length === 0 ? (
        <div className="text-center py-16 rounded-2xl bg-ivory dark:bg-charcoal-light border border-charcoal/5 dark:border-charcoal-border text-charcoal/50 dark:text-ivory/50">
          {isAr ? 'مفيش أيقونات' : 'No contacts found'}
        </div>
      ) : (
        <div className="space-y-3">
          {contacts.map((c) => {
            const b = typeBadge(c.type);
            const isEditing = editing === c.key;
            return (
              <div
                key={c.key}
                className={`p-4 rounded-2xl bg-ivory dark:bg-charcoal-light border transition-colors ${
                  c.active
                    ? 'border-charcoal/5 dark:border-charcoal-border'
                    : 'border-charcoal/5 dark:border-charcoal-border opacity-60'
                }`}
              >
                <div className="flex flex-wrap items-center gap-3">
                  {/* Name + location */}
                  <div className="flex-1 min-w-[180px]">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-semibold text-charcoal dark:text-ivory">
                        {isAr ? c.name.ar : c.name.en}
                      </span>
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${b.cls}`}>
                        {isAr ? b.label : b.labelEn}
                      </span>
                      {!c.active && (
                        <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-charcoal/10 text-charcoal/50 dark:bg-white/10 dark:text-ivory/50">
                          {isAr ? 'معطّلة' : 'Disabled'}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-charcoal/45 dark:text-ivory/45">
                      📍 {isAr ? c.location.ar : c.location.en}
                    </div>
                  </div>

                  {/* Number (view or edit) */}
                  <div className="flex items-center gap-2">
                    {isEditing ? (
                      <>
                        <input
                          value={editNumber}
                          onChange={(e) => setEditNumber(e.target.value)}
                          dir="ltr"
                          placeholder="9665xxxxxxx"
                          className="h-9 w-44 px-3 rounded-lg bg-sand-100 dark:bg-charcoal border border-charcoal/10 dark:border-charcoal-border text-sm"
                          autoFocus
                        />
                        <button
                          onClick={() => save(c.key)}
                          disabled={saving}
                          className="btn-press h-9 px-3 rounded-lg bg-forest text-ivory text-sm font-medium hover:bg-forest-light disabled:opacity-50"
                        >
                          {isAr ? 'حفظ' : 'Save'}
                        </button>
                        <button
                          onClick={() => setEditing(null)}
                          className="h-9 px-3 rounded-lg border border-charcoal/15 dark:border-charcoal-border text-sm"
                        >
                          {isAr ? 'إلغاء' : 'Cancel'}
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="font-mono text-sm text-charcoal dark:text-ivory" dir="ltr">
                          {c.number}
                        </span>
                        <button
                          onClick={() => {
                            setEditing(c.key);
                            setEditNumber(c.number);
                          }}
                          className="btn-press h-9 px-3 rounded-lg border border-charcoal/15 dark:border-charcoal-border text-sm font-medium text-forest dark:text-forest-light hover:border-forest dark:hover:border-forest-light"
                        >
                          {isAr ? 'تعديل' : 'Edit'}
                        </button>
                        <button
                          onClick={() => {
                            const page = keyToPage[c.key] || '/';
                            window.open(`https://mafroshat-riyadh.vercel.app${page}`, '_blank');
                          }}
                          className="btn-press h-9 px-3 rounded-lg border border-charcoal/15 dark:border-charcoal-border text-sm font-medium text-charcoal dark:text-ivory hover:border-forest dark:hover:border-forest-light"
                        >
                          {isAr ? 'عرض في الموقع' : 'View on site'}
                        </button>
                        <button
                          onClick={() => router.push(`/admin/contact-analytics/${encodeURIComponent(c.key)}`)}
                          className="btn-press h-9 px-3 rounded-lg border border-charcoal/15 dark:border-charcoal-border text-sm font-medium text-forest dark:text-forest-light hover:border-forest dark:hover:border-forest-light"
                        >
                          {isAr ? '📊 تحليلات' : '📊 Analytics'}
                        </button>
                        <button
                          onClick={() => toggleActive(c)}
                          className={`btn-press h-9 px-3 rounded-lg border text-sm font-medium ${
                            c.active
                              ? 'border-amber-300 dark:border-amber-800 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20'
                              : 'border-forest/30 text-forest dark:text-forest-light hover:bg-forest/5'
                          }`}
                        >
                          {c.active ? (isAr ? 'تعطيل' : 'Disable') : (isAr ? 'تفعيل' : 'Enable')}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
