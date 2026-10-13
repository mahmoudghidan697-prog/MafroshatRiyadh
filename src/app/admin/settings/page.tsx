'use client';

import { useState, useEffect, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { contact } from '@/data/site';

export default function AdminSettings() {
  const { locale } = useApp();
  const [form, setForm] = useState({
    whatsapp: contact.whatsapp as string,
    phone: contact.phone as string,
    phoneDisplay: contact.phoneDisplay as string,
    email: contact.email as string,
    address_ar: contact.address.ar as string,
    address_en: contact.address.en as string,
    hours_ar: contact.hours.ar as string,
    hours_en: contact.hours.en as string,
  });
  // Logo (site icon) — stored in the settings table as key 'logo'
  const [logo, setLogo] = useState('');
  const [logoUploading, setLogoUploading] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [saving, setSaving] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');

  // Load existing settings (including current logo) on mount
  useEffect(() => {
    fetch('/api/admin/settings')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.settings) {
          const s = data.settings;
          if (s.logo) setLogo(s.logo);
          setForm((f) => ({
            ...f,
            whatsapp: s.whatsapp ?? f.whatsapp,
            phone: s.phone ?? f.phone,
            phoneDisplay: s.phoneDisplay ?? f.phoneDisplay,
            email: s.email ?? f.email,
            address_ar: s.address_ar ?? f.address_ar,
            address_en: s.address_en ?? f.address_en,
            hours_ar: s.hours_ar ?? f.hours_ar,
            hours_en: s.hours_en ?? f.hours_en,
          }));
        }
      })
      .catch(() => {});
  }, []);

  async function handleUploadLogo(file: File) {
    setLogoUploading(true);
    setMessage('');
    try {
      const reader = new FileReader();
      const dataUrl: string = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, data: dataUrl }),
      });
      const data = await res.json();
      if (res.ok && data.path) {
        // Save the new logo path into settings immediately
        await fetch('/api/admin/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ settings: { logo: data.path } }),
        });
        setLogo(data.path);
        setMessage(
          locale === 'ar'
            ? 'تم رفع الشعار ✓ (هيظهر في الموقع بعد إعادة التحميل)'
            : 'Logo uploaded ✓ (reload the site to see it)',
        );
      } else {
        setMessage(data.error || (locale === 'ar' ? 'فشل الرفع' : 'Upload failed'));
      }
    } catch {
      setMessage(locale === 'ar' ? 'خطأ في رفع الشعار' : 'Logo upload error');
    } finally {
      setLogoUploading(false);
    }
  }

  async function handleRemoveLogo() {
    await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings: { logo: '' } }),
    });
    setLogo('');
    setMessage(locale === 'ar' ? 'تم حذف الشعار' : 'Logo removed');
  }

  async function handleSaveSettings() {
    setSaving(true);
    setMessage('');
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: form }),
      });
      if (res.ok) {
        setMessage(locale === 'ar' ? 'تم الحفظ ✓ (الأرقام الجديدة هتظهر في الموقع بعد إعادة التشغيل)' : 'Saved ✓ (restart to apply on site)');
      } else {
        setMessage(locale === 'ar' ? 'فشل الحفظ' : 'Save failed');
      }
    } catch {
      setMessage(locale === 'ar' ? 'خطأ في الاتصال' : 'Connection error');
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword() {
    setPasswordMessage('');
    if (passwords.new !== passwords.confirm) {
      setPasswordMessage(locale === 'ar' ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match');
      return;
    }
    if (passwords.new.length < 6) {
      setPasswordMessage(locale === 'ar' ? 'كلمة المرور لازم تكون ٦ أحرف على الأقل' : 'Password must be at least 6 characters');
      return;
    }
    setSavingPassword(true);
    try {
      const res = await fetch('/api/admin/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: passwords.current, newPassword: passwords.new }),
      });
      if (res.ok) {
        setPasswordMessage(locale === 'ar' ? 'تم تغيير كلمة المرور ✓' : 'Password changed ✓');
        setPasswords({ current: '', new: '', confirm: '' });
      } else {
        const data = await res.json();
        setPasswordMessage(data.error || 'Failed');
      }
    } catch {
      setPasswordMessage(locale === 'ar' ? 'خطأ في الاتصال' : 'Connection error');
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-charcoal dark:text-ivory mb-6">
        {locale === 'ar' ? 'الإعدادات' : 'Settings'}
      </h1>

      {/* Logo / site icon */}
      <div className="bg-ivory dark:bg-charcoal-light rounded-2xl border border-charcoal/10 dark:border-charcoal-border p-6 mb-6">
        <h2 className="font-bold text-charcoal dark:text-ivory mb-1">
          {locale === 'ar' ? 'شعار الموقع (الأيقونة)' : 'Site Logo (Icon)'}
        </h2>
        <p className="text-xs text-charcoal/60 dark:text-ivory/60 mb-4">
          {locale === 'ar'
            ? 'الصورة اللي تظهر في الهيدر والفوتر. يُفضّل PNG مربّع بخلفية شفافة.'
            : 'The icon shown in the header and footer. Preferably a square PNG with a transparent background.'}
        </p>

        <div className="flex items-center gap-4">
          {/* Preview */}
          <div className="w-20 h-20 rounded-2xl bg-forest flex items-center justify-center text-ivory font-bold text-3xl font-arabic overflow-hidden shrink-0 border border-charcoal/10">
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo} alt="logo" className="w-full h-full object-cover" />
            ) : (
              'م'
            )}
          </div>

          <div className="flex flex-col gap-2">
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleUploadLogo(f);
                e.target.value = '';
              }}
            />
            <button
              onClick={() => logoInputRef.current?.click()}
              disabled={logoUploading}
              className="h-10 px-4 rounded-xl bg-forest text-ivory text-sm font-medium hover:bg-forest-light disabled:opacity-50"
            >
              {logoUploading
                ? locale === 'ar' ? 'جاري الرفع...' : 'Uploading...'
                : locale === 'ar' ? 'رفع صورة من الجهاز' : 'Upload from device'}
            </button>
            {logo && (
              <button
                onClick={handleRemoveLogo}
                className="h-9 px-4 rounded-xl border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                {locale === 'ar' ? 'حذف الشعار' : 'Remove logo'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Contact settings */}
      <div className="bg-ivory dark:bg-charcoal-light rounded-2xl border border-charcoal/10 dark:border-charcoal-border p-6 mb-6">
        <h2 className="font-bold text-charcoal dark:text-ivory mb-4">
          {locale === 'ar' ? 'معلومات التواصل' : 'Contact Information'}
        </h2>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="text-xs font-medium text-charcoal/70 dark:text-ivory/70 mb-1 block">
                WhatsApp ({locale === 'ar' ? 'رقم دولي بدون +' : 'international, no +'})
              </span>
              <input
                value={form.whatsapp}
                onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                dir="ltr"
                className="w-full h-10 px-3 rounded-lg bg-sand-100 dark:bg-charcoal-elevated border border-charcoal/10 dark:border-charcoal-border text-sm"
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-charcoal/70 dark:text-ivory/70 mb-1 block">
                {locale === 'ar' ? 'الهاتف' : 'Phone'}
              </span>
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                dir="ltr"
                className="w-full h-10 px-3 rounded-lg bg-sand-100 dark:bg-charcoal-elevated border border-charcoal/10 dark:border-charcoal-border text-sm"
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="text-xs font-medium text-charcoal/70 dark:text-ivory/70 mb-1 block">
                {locale === 'ar' ? 'الرقم الظاهر' : 'Display number'}
              </span>
              <input
                value={form.phoneDisplay}
                onChange={(e) => setForm({ ...form, phoneDisplay: e.target.value })}
                dir="ltr"
                className="w-full h-10 px-3 rounded-lg bg-sand-100 dark:bg-charcoal-elevated border border-charcoal/10 dark:border-charcoal-border text-sm"
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-charcoal/70 dark:text-ivory/70 mb-1 block">
                {locale === 'ar' ? 'البريد الإلكتروني' : 'Email'}
              </span>
              <input
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                dir="ltr"
                className="w-full h-10 px-3 rounded-lg bg-sand-100 dark:bg-charcoal-elevated border border-charcoal/10 dark:border-charcoal-border text-sm"
              />
            </label>
          </div>

          <label className="block">
            <span className="text-xs font-medium text-charcoal/70 dark:text-ivory/70 mb-1 block">
              {locale === 'ar' ? 'العنوان (عربي)' : 'Address (Arabic)'}
            </span>
            <input
              value={form.address_ar}
              onChange={(e) => setForm({ ...form, address_ar: e.target.value })}
              className="w-full h-10 px-3 rounded-lg bg-sand-100 dark:bg-charcoal-elevated border border-charcoal/10 dark:border-charcoal-border text-sm"
            />
          </label>

          <label className="block">
            <span className="text-xs font-medium text-charcoal/70 dark:text-ivory/70 mb-1 block">
              Address (English)
            </span>
            <input
              value={form.address_en}
              onChange={(e) => setForm({ ...form, address_en: e.target.value })}
              className="w-full h-10 px-3 rounded-lg bg-sand-100 dark:bg-charcoal-elevated border border-charcoal/10 dark:border-charcoal-border text-sm"
            />
          </label>

          <label className="block">
            <span className="text-xs font-medium text-charcoal/70 dark:text-ivory/70 mb-1 block">
              {locale === 'ar' ? 'ساعات العمل (عربي)' : 'Working hours (Arabic)'}
            </span>
            <input
              value={form.hours_ar}
              onChange={(e) => setForm({ ...form, hours_ar: e.target.value })}
              className="w-full h-10 px-3 rounded-lg bg-sand-100 dark:bg-charcoal-elevated border border-charcoal/10 dark:border-charcoal-border text-sm"
            />
          </label>

          <label className="block">
            <span className="text-xs font-medium text-charcoal/70 dark:text-ivory/70 mb-1 block">
              Working hours (English)
            </span>
            <input
              value={form.hours_en}
              onChange={(e) => setForm({ ...form, hours_en: e.target.value })}
              className="w-full h-10 px-3 rounded-lg bg-sand-100 dark:bg-charcoal-elevated border border-charcoal/10 dark:border-charcoal-border text-sm"
            />
          </label>
        </div>

        {message && (
          <div className="mt-4 p-3 rounded-xl bg-forest/10 text-forest text-sm">{message}</div>
        )}

        <button
          onClick={handleSaveSettings}
          disabled={saving}
          className="mt-4 h-10 px-6 rounded-xl bg-forest text-ivory text-sm font-medium hover:bg-forest-light disabled:opacity-50"
        >
          {saving ? '...' : locale === 'ar' ? 'حفظ الإعدادات' : 'Save Settings'}
        </button>
      </div>

      {/* Change password */}
      <div className="bg-ivory dark:bg-charcoal-light rounded-2xl border border-charcoal/10 dark:border-charcoal-border p-6">
        <h2 className="font-bold text-charcoal dark:text-ivory mb-4">
          {locale === 'ar' ? 'تغيير كلمة المرور' : 'Change Password'}
        </h2>

        <div className="space-y-4">
          <label className="block">
            <span className="text-xs font-medium text-charcoal/70 dark:text-ivory/70 mb-1 block">
              {locale === 'ar' ? 'كلمة المرور الحالية' : 'Current password'}
            </span>
            <input
              type="password"
              value={passwords.current}
              onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
              className="w-full h-10 px-3 rounded-lg bg-sand-100 dark:bg-charcoal-elevated border border-charcoal/10 dark:border-charcoal-border text-sm"
            />
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="text-xs font-medium text-charcoal/70 dark:text-ivory/70 mb-1 block">
                {locale === 'ar' ? 'كلمة المرور الجديدة' : 'New password'}
              </span>
              <input
                type="password"
                value={passwords.new}
                onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                className="w-full h-10 px-3 rounded-lg bg-sand-100 dark:bg-charcoal-elevated border border-charcoal/10 dark:border-charcoal-border text-sm"
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-charcoal/70 dark:text-ivory/70 mb-1 block">
                {locale === 'ar' ? 'تأكيد كلمة المرور' : 'Confirm password'}
              </span>
              <input
                type="password"
                value={passwords.confirm}
                onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                className="w-full h-10 px-3 rounded-lg bg-sand-100 dark:bg-charcoal-elevated border border-charcoal/10 dark:border-charcoal-border text-sm"
              />
            </label>
          </div>
        </div>

        {passwordMessage && (
          <div className="mt-4 p-3 rounded-xl bg-forest/10 text-forest text-sm">{passwordMessage}</div>
        )}

        <button
          onClick={handleChangePassword}
          disabled={savingPassword}
          className="mt-4 h-10 px-6 rounded-xl bg-forest text-ivory text-sm font-medium hover:bg-forest-light disabled:opacity-50"
        >
          {savingPassword ? '...' : locale === 'ar' ? 'تغيير كلمة المرور' : 'Change Password'}
        </button>
      </div>
    </div>
  );
}
