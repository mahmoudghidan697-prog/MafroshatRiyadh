'use client';

import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { useToast } from '@/components/admin/Toast';
import { Skeleton } from '@/components/admin/Toast';

interface SeoSettings {
  site_url: string;
  seo_title: string;
  seo_description: string;
  seo_keywords: string;
  og_image: string;
  google_analytics: string;
  google_search_console: string;
  robots_txt: string;
  twitter_handle: string;
  business_schema_enabled: string;
}

const EMPTY: SeoSettings = {
  site_url: '',
  seo_title: '',
  seo_description: '',
  seo_keywords: '',
  og_image: '',
  google_analytics: '',
  google_search_console: '',
  robots_txt: '',
  twitter_handle: '',
  business_schema_enabled: '1',
};

export default function AdminSeo() {
  const { locale } = useApp();
  const { toast } = useToast();
  const isAr = locale === 'ar';

  const [form, setForm] = useState<SeoSettings>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/admin/settings');
        if (res.ok) {
          const data = await res.json();
          const s = data.settings;
          setForm({
            site_url: s.site_url ?? '',
            seo_title: s.seo_title ?? '',
            seo_description: s.seo_description ?? '',
            seo_keywords: s.seo_keywords ?? '',
            og_image: s.og_image ?? '',
            google_analytics: s.google_analytics ?? '',
            google_search_console: s.google_search_console ?? '',
            robots_txt: s.robots_txt ?? '',
            twitter_handle: s.twitter_handle ?? '',
            business_schema_enabled: s.business_schema_enabled ?? '1',
          });
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: form }),
      });
      if (res.ok) {
        toast(isAr ? 'تم حفظ إعدادات SEO ✓' : 'SEO settings saved ✓');
      } else {
        toast(isAr ? 'فشل الحفظ' : 'Save failed', 'error');
      }
    } catch {
      toast(isAr ? 'خطأ في الاتصال' : 'Connection error', 'error');
    } finally {
      setSaving(false);
    }
  }

  function set(key: keyof SeoSettings, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  const inputCls =
    'w-full px-3 py-2 rounded-lg bg-sand-100 dark:bg-charcoal-elevated border border-charcoal/10 dark:border-charcoal-border text-sm text-charcoal dark:text-ivory focus:outline-none focus:border-forest dark:focus:border-forest-light';

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-charcoal dark:text-ivory">
          {isAr ? 'محركات البحث (SEO)' : 'Search Engine Optimization'}
        </h1>
        <p className="text-sm text-charcoal/60 dark:text-ivory/60 mt-1">
          {isAr
            ? 'تحكّم في كيف يظهر موقعك في جوجل والشبكات الاجتماعية.'
            : 'Control how your site appears in Google and social media.'}
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6 max-w-3xl">
        {/* ─── Site URL (critical for indexing) ─── */}
        <Section title={isAr ? 'عنوان الموقع (مهم جداً)' : 'Site URL (critical)'} hint={isAr ? 'الدومين النهائي للموقع — بيحدد الروابط القانونية و sitemap. لازم يكون https ودومينك الحقيقي.' : 'The final domain — drives canonical links & sitemap. Must be https and your real domain.'}>
          <Field label={isAr ? 'رابط الموقع' : 'Site URL'}>
            <input value={form.site_url} onChange={(e) => set('site_url', e.target.value)} className={inputCls} placeholder="https://mafroshat-alsaree.com" dir="ltr" />
          </Field>
        </Section>

        {/* ─── Search appearance ─── */}
        <Section title={isAr ? 'الظهور في البحث' : 'Search Appearance'}>
          <Field label={isAr ? 'عنوان الصفحة (Title)' : 'Page Title'} hint={isAr ? '٥٠-٦٠ حرف — اللي بيظهر في نتيجة جوجل' : '50-60 chars — shown in Google results'}>
            <input value={form.seo_title} onChange={(e) => set('seo_title', e.target.value)} className={inputCls} placeholder="مفروشات السريع — سجاد وموكيت وأرضيات في الرياض" />
          </Field>
          <Field label={isAr ? 'الوصف (Description)' : 'Description'} hint={isAr ? '١٥٠-١٦٠ حرف — النص اللي تحت العنوان في جوجل' : '150-160 chars — text under the title'}>
            <textarea rows={3} value={form.seo_description} onChange={(e) => set('seo_description', e.target.value)} className={inputCls} />
          </Field>
          <Field label={isAr ? 'الكلمات المفتاحية' : 'Keywords'} hint={isAr ? 'مفصولة بفاصلة' : 'Comma separated'}>
            <input value={form.seo_keywords} onChange={(e) => set('seo_keywords', e.target.value)} className={inputCls} placeholder="سجاد, موكيت, أرضيات, مفروشات الرياض" />
          </Field>
        </Section>

        {/* ─── Social sharing ─── */}
        <Section title={isAr ? 'المشاركة على السوشيال' : 'Social Sharing'}>
          <Field label={isAr ? 'صورة المشاركة (OG Image)' : 'Share Image (OG Image)'} hint={isAr ? 'مسار صورة — مثلاً من معرض الصور. مقاس 1200×630 أحسن' : 'Image path — e.g. from Media. 1200×630 ideal'}>
            <input value={form.og_image} onChange={(e) => set('og_image', e.target.value)} className={inputCls} placeholder="/images/products/share.jpg" dir="ltr" />
          </Field>
          <Field label={isAr ? 'حساب تويتر (X)' : 'Twitter/X Handle'}>
            <input value={form.twitter_handle} onChange={(e) => set('twitter_handle', e.target.value)} className={inputCls} placeholder="@mafroshat" dir="ltr" />
          </Field>
        </Section>

        {/* ─── Analytics & indexing ─── */}
        <Section title={isAr ? 'التحليلات والفهرسة' : 'Analytics & Indexing'}>
          <Field label="Google Analytics ID" hint={isAr ? 'مثلاً G-XXXXXXXXXX — يترك فارغ لو مش مستخدم' : 'e.g. G-XXXXXXXXXX — leave empty if unused'}>
            <input value={form.google_analytics} onChange={(e) => set('google_analytics', e.target.value)} className={inputCls} placeholder="G-XXXXXXXXXX" dir="ltr" />
          </Field>
          <Field label="Google Search Console Verification" hint={isAr ? 'كود التحقق من search console' : 'The verification code from Search Console'}>
            <input value={form.google_search_console} onChange={(e) => set('google_search_console', e.target.value)} className={inputCls} placeholder="google-site-verification=..." dir="ltr" />
          </Field>
          <Field label={isAr ? 'Schema النشاط التجاري (JSON-LD)' : 'Business Schema (JSON-LD)'} hint={isAr ? 'يخلي جوجل يفهم إنك نشاط تجاري محلي (مهم لظهورك في الخرائط)' : 'Lets Google understand you are a local business (important for Maps)'}>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.business_schema_enabled === '1'}
                onChange={(e) => set('business_schema_enabled', e.target.checked ? '1' : '0')}
                className="w-5 h-5 rounded accent-forest"
              />
              <span className="text-sm text-charcoal dark:text-ivory">
                {isAr ? 'تفعيل Schema النشاط التجاري' : 'Enable LocalBusiness schema'}
              </span>
            </label>
          </Field>
        </Section>

        {/* ─── Robots.txt ─── */}
        <Section title="robots.txt" hint={isAr ? 'يترك فارغ = الافتراضي (السماح لكل محركات البحث)' : 'Empty = default (allow all crawlers)'}>
          <Field label="robots.txt">
            <textarea rows={5} value={form.robots_txt} onChange={(e) => set('robots_txt', e.target.value)} className={`${inputCls} font-mono text-xs`} dir="ltr" placeholder={'User-agent: *\nAllow: /\nDisallow: /admin'} />
          </Field>
        </Section>

        <button
          type="submit"
          disabled={saving}
          className="btn-press h-11 px-6 rounded-xl bg-forest text-ivory font-medium hover:bg-forest-light disabled:opacity-50"
        >
          {saving ? (isAr ? 'جاري الحفظ...' : 'Saving...') : isAr ? 'حفظ الإعدادات' : 'Save Settings'}
        </button>
      </form>
    </div>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="bg-ivory dark:bg-charcoal-light rounded-2xl border border-charcoal/10 dark:border-charcoal-border p-5">
      <h2 className="font-bold text-charcoal dark:text-ivory mb-1">{title}</h2>
      {hint && <p className="text-xs text-charcoal/50 dark:text-ivory/50 mb-4">{hint}</p>}
      <div className="space-y-4 mt-4">{children}</div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-charcoal dark:text-ivory mb-1">{label}</span>
      {children}
      {hint && <span className="block text-xs text-charcoal/40 dark:text-ivory/40 mt-1">{hint}</span>}
    </label>
  );
}
