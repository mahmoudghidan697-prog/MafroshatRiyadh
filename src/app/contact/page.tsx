'use client';

import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { contact } from '@/data/site';
import { loc } from '@/lib/i18n';
import { useContacts } from '@/hooks/useContacts';
import { SectionHeader } from '@/components/SectionHeader';
import { ScrollReveal } from '@/components/ScrollReveal';
import {
  WhatsAppIcon,
  PhoneIcon,
  MailIcon,
  MapPinIcon,
  ClockIcon,
  SparkleIcon,
} from '@/components/Icons';

type Errors = Partial<Record<'name' | 'phone' | 'email' | 'message', string>>;

export default function ContactPage() {
  const { locale, t } = useApp();
  const { waLink, phoneLink, number: contactNumber } = useContacts();
  const [form, setForm] = useState({ name: '', phone: '', email: '', message: '' });
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  function validate(): Errors {
    const e: Errors = {};
    if (!form.name.trim()) e.name = t.requiredField;
    if (!form.phone.trim()) e.phone = t.requiredField;
    else if (!/^[0-9+\s-]{8,}$/.test(form.phone.trim())) e.phone = t.invalidPhone;
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
      e.email = t.invalidEmail;
    if (!form.message.trim()) e.message = t.requiredField;
    else if (form.message.trim().length < 10) e.message = t.messageTooShort;
    return e;
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    setStatus('sending');

    // Build a prefilled WhatsApp message and open it — the customer
    // then sends it from their own WhatsApp, so nothing is lost and no
    // backend is required.
    const msg =
      locale === 'ar'
        ? `مرحباً، أنا ${form.name.trim()}.\n${form.message.trim()}\n\nرقمي: ${form.phone.trim()}${
            form.email.trim() ? `\nالبريد: ${form.email.trim()}` : ''
          }`
        : `Hello, I'm ${form.name.trim()}.\n${form.message.trim()}\n\nMy phone: ${form.phone.trim()}${
            form.email.trim() ? `\nEmail: ${form.email.trim()}` : ''
          }`;
    const link = waLink('contact_page_whatsapp', msg);

    // Small delay so the button state is visible before the redirect
    await new Promise((r) => setTimeout(r, 400));
    window.open(link, '_blank', 'noopener,noreferrer');

    setStatus('sent');
    setForm({ name: '', phone: '', email: '', message: '' });
  }

  const waMessage = t.whatsappMessageDefault;

  return (
    <>
      {/* ═══════════════ PAGE HEADER ═══════════════ */}
      <section className="bg-ivory dark:bg-charcoal pt-10 pb-12 lg:pt-14 lg:pb-16 border-b border-charcoal/5 dark:border-charcoal-border/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-forest/10 dark:bg-forest-light/15 text-forest dark:text-forest-light text-xs font-semibold mb-5">
              <SparkleIcon className="w-3.5 h-3.5" />
              {t.contactTitle}
            </span>
            <h1 className="font-arabic text-3xl sm:text-4xl lg:text-5xl font-bold text-charcoal dark:text-ivory tracking-tight mb-3">
              {t.contactTitle}
            </h1>
            <p className="text-charcoal/70 dark:text-ivory/70 text-base lg:text-lg max-w-2xl">
              {t.contactSubtitle}
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* ═══════════════ CONTACT GRID ═══════════════ */}
      <section className="py-14 lg:py-20 bg-ivory dark:bg-charcoal">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-5 gap-10 lg:gap-14">
            {/* ── Contact info ── */}
            <div className="lg:col-span-2">
              <ScrollReveal>
                <h2 className="text-2xl font-bold text-charcoal dark:text-ivory mb-6">
                  {t.orReachUsDirectly}
                </h2>

                <div className="space-y-4 mb-8">
                  <a
                    href={waLink('contact_page_whatsapp', waMessage)}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-contact-key="contact_page_whatsapp"
                    className="flex items-center gap-4 p-4 rounded-2xl bg-[#25D366]/10 border border-[#25D366]/20 hover:bg-[#25D366]/15 transition-colors group"
                  >
                    <span className="w-12 h-12 rounded-xl bg-[#25D366] text-white flex items-center justify-center shrink-0">
                      <WhatsAppIcon className="w-6 h-6" />
                    </span>
                    <span>
                      <span className="block font-semibold text-charcoal dark:text-ivory">
                        {t.whatsappUs}
                      </span>
                      <span className="block text-sm text-charcoal/60 dark:text-ivory/60">
                        {t.responseTime}
                      </span>
                    </span>
                  </a>

                  <a
                    href={phoneLink('contact_page_phone')}
                    data-contact-key="contact_page_phone"
                    className="flex items-center gap-4 p-4 rounded-2xl bg-forest/10 border border-forest/20 hover:bg-forest/15 transition-colors"
                  >
                    <span className="w-12 h-12 rounded-xl bg-forest text-ivory flex items-center justify-center shrink-0">
                      <PhoneIcon className="w-5 h-5" />
                    </span>
                    <span>
                      <span className="block font-semibold text-charcoal dark:text-ivory">
                        {t.callUs}
                      </span>
                      <span className="block text-sm text-charcoal/60 dark:text-ivory/60" dir="ltr">
                        {contactNumber('contact_page_phone') || contact.phoneDisplay}
                      </span>
                    </span>
                  </a>

                  <a
                    href={`mailto:${contact.email}`}
                    className="flex items-center gap-4 p-4 rounded-2xl bg-sand-100 dark:bg-charcoal-light border border-charcoal/5 dark:border-charcoal-border hover:bg-sand-200 dark:hover:bg-charcoal-elevated transition-colors"
                  >
                    <span className="w-12 h-12 rounded-xl bg-charcoal/10 dark:bg-ivory/10 text-charcoal dark:text-ivory flex items-center justify-center shrink-0">
                      <MailIcon className="w-5 h-5" />
                    </span>
                    <span>
                      <span className="block font-semibold text-charcoal dark:text-ivory">
                        {t.emailUs}
                      </span>
                      <span className="block text-sm text-charcoal/60 dark:text-ivory/60" dir="ltr">
                        {contact.email}
                      </span>
                    </span>
                  </a>
                </div>

                {/* Address & hours */}
                <div className="space-y-4">
                  <div className="flex items-start gap-3.5">
                    <MapPinIcon className="w-5 h-5 text-forest dark:text-forest-light mt-0.5 shrink-0" />
                    <div>
                      <div className="font-semibold text-charcoal dark:text-ivory text-sm">
                        {t.addressLabel}
                      </div>
                      <div className="text-sm text-charcoal/70 dark:text-ivory/70">
                        {loc(locale, contact.address)}
                      </div>
                      <a
                        href={contact.mapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-forest dark:text-forest-light font-medium mt-1 hover:underline"
                      >
                        {t.visitShowroom} →
                      </a>
                    </div>
                  </div>
                  <div className="flex items-start gap-3.5">
                    <ClockIcon className="w-5 h-5 text-forest dark:text-forest-light mt-0.5 shrink-0" />
                    <div>
                      <div className="font-semibold text-charcoal dark:text-ivory text-sm">
                        {t.hoursLabel}
                      </div>
                      <div className="text-sm text-charcoal/70 dark:text-ivory/70">
                        {t.businessHoursFull}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3.5">
                    <SparkleIcon className="w-5 h-5 text-forest dark:text-forest-light mt-0.5 shrink-0" />
                    <div className="text-sm text-charcoal/70 dark:text-ivory/70">
                      {t.serviceAreas}
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            </div>

            {/* ── Contact form ── */}
            <div className="lg:col-span-3">
              <ScrollReveal>
                <div className="bg-sand-50 dark:bg-charcoal-light border border-charcoal/5 dark:border-charcoal-border rounded-3xl p-6 lg:p-8">
                  <h2 className="text-xl font-bold text-charcoal dark:text-ivory mb-1">
                    {t.sendMessage}
                  </h2>
                  <p className="text-sm text-charcoal/60 dark:text-ivory/60 mb-6">
                    {t.contactSubtitle}
                  </p>

                  <form onSubmit={handleSubmit} noValidate className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <Field
                        label={t.formName}
                        error={errors.name}
                        input={
                          <input
                            type="text"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            placeholder={t.formNamePlaceholder}
                            className={inputCls(!!errors.name)}
                          />
                        }
                      />
                      <Field
                        label={t.formPhone}
                        error={errors.phone}
                        input={
                          <input
                            type="tel"
                            dir="ltr"
                            value={form.phone}
                            onChange={(e) => setForm({ ...form, phone: e.target.value })}
                            placeholder={t.formPhonePlaceholder}
                            className={inputCls(!!errors.phone)}
                          />
                        }
                      />
                    </div>

                    <Field
                      label={locale === 'ar' ? `${t.formEmail} (اختياري)` : `${t.formEmail} (optional)`}
                      error={errors.email}
                      input={
                        <input
                          type="email"
                          dir="ltr"
                          value={form.email}
                          onChange={(e) => setForm({ ...form, email: e.target.value })}
                          placeholder={t.formEmailPlaceholder}
                          className={inputCls(!!errors.email)}
                        />
                      }
                    />

                    <Field
                      label={t.formMessage}
                      error={errors.message}
                      input={
                        <textarea
                          rows={5}
                          value={form.message}
                          onChange={(e) => setForm({ ...form, message: e.target.value })}
                          placeholder={t.formMessagePlaceholder}
                          className={inputCls(!!errors.message) + ' resize-none'}
                        />
                      }
                    />

                    <button
                      type="submit"
                      disabled={status === 'sending'}
                      className="btn-press w-full h-12 rounded-xl bg-forest text-ivory font-medium hover:bg-forest-light shadow-sm hover:shadow-md disabled:opacity-50 transition-all"
                    >
                      {status === 'sending' ? t.sending : t.sendMessage}
                    </button>

                    {status === 'sent' && (
                      <p className="flex items-center gap-2 text-sm text-forest dark:text-forest-light font-medium">
                        ✓ {t.messageSent}
                      </p>
                    )}
                    {status === 'error' && (
                      <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                        {t.messageError}
                      </p>
                    )}
                  </form>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ MAP ═══════════════ */}
      <section className="pb-14 lg:pb-20 bg-ivory dark:bg-charcoal">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <h2 className="text-xl font-bold text-charcoal dark:text-ivory mb-4 flex items-center gap-2">
              <MapPinIcon className="w-5 h-5 text-forest dark:text-forest-light" />
              {t.findUs}
            </h2>
            <div className="rounded-2xl overflow-hidden border border-charcoal/10 dark:border-charcoal-border aspect-[16/9] lg:aspect-[21/9]">
              <iframe
                title={t.findUs}
                src="https://maps.google.com/maps?q=Al%20Manfuhah%20Riyadh&output=embed"
                width="100%"
                height="100%"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                style={{ border: 0 }}
              />
            </div>
          </ScrollReveal>
        </div>
      </section>
    </>
  );
}

function inputCls(hasError: boolean) {
  return `w-full h-11 px-4 rounded-xl bg-ivory dark:bg-charcoal border ${
    hasError ? 'border-red-400 dark:border-red-500' : 'border-charcoal/10 dark:border-charcoal-border'
  } text-charcoal dark:text-ivory placeholder:text-charcoal/40 dark:placeholder:text-ivory/40 focus:outline-none focus:border-forest dark:focus:border-forest-light transition-colors`;
}

function Field({
  label,
  error,
  input,
}: {
  label: string;
  error?: string;
  input: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-charcoal dark:text-ivory mb-1.5">
        {label}
      </span>
      {input}
      {error && <span className="block text-xs text-red-600 dark:text-red-400 mt-1">{error}</span>}
    </label>
  );
}
