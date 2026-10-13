'use client';

import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { StarIcon } from '@/components/Icons';

type Errors = Partial<Record<'name' | 'quote', string>>;

/**
 * ReviewForm — lets any visitor submit a review. The submission is
 * saved with status 'pending' and only becomes visible on the site
 * after an admin approves it from /admin/testimonials.
 */
export function ReviewForm() {
  const { locale, t } = useApp();
  const [name, setName] = useState('');
  const [quote, setQuote] = useState('');
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const isAr = locale === 'ar';

  const labels = {
    title: isAr ? 'اكتب رأيك' : 'Write your review',
    name: isAr ? 'اسمك' : 'Your name',
    namePh: isAr ? 'اكتب اسمك' : 'Enter your name',
    quote: isAr ? 'رأيك في التعامل معانا' : 'Your experience with us',
    quotePh: isAr
      ? 'اكتب تجربتك معنا بصدق...'
      : 'Share your honest experience with us...',
    rating: isAr ? 'التقييم' : 'Rating',
    submit: isAr ? 'إرسال المراجعة' : 'Submit review',
    sending: isAr ? 'جاري الإرسال...' : 'Submitting...',
    sent: isAr
      ? 'شكرًا لك! مراجعتك اتبعتت وهتظهر بعد مراجعة الإدارة.'
      : 'Thank you! Your review was submitted and will appear after admin approval.',
    error: isAr ? 'حصل خطأ، جرّب تاني.' : 'Something went wrong. Please try again.',
    required: isAr ? 'هذا الحقل مطلوب' : 'This field is required',
    tooShort: isAr ? 'المراجعة قصيرة جدًا (١٠ أحرف على الأقل)' : 'Review is too short (min 10 chars)',
    nameShort: isAr ? 'الاسم قصير جدًا' : 'Name is too short',
  };

  function validate(): Errors {
    const e: Errors = {};
    if (!name.trim()) e.name = labels.required;
    else if (name.trim().length < 2) e.name = labels.nameShort;
    if (!quote.trim()) e.quote = labels.required;
    else if (quote.trim().length < 10) e.quote = labels.tooShort;
    return e;
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    setStatus('sending');
    try {
      const res = await fetch('/api/testimonials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), role: '', quote: quote.trim(), rating }),
      });
      if (res.ok) {
        setStatus('sent');
        setName('');
        setQuote('');
        setRating(5);
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  }

  return (
    <div className="p-6 lg:p-8 rounded-3xl bg-ivory dark:bg-charcoal border border-charcoal/5 dark:border-charcoal-border">
      <h3 className="text-xl font-bold text-charcoal dark:text-ivory mb-1">{labels.title}</h3>
      <p className="text-sm text-charcoal/60 dark:text-ivory/60 mb-6">
        {isAr
          ? 'رأيك يهمنا — بيظهر بعد موافقة الإدارة'
          : 'Your opinion matters — it appears after admin approval'}
      </p>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {/* Rating stars */}
        <div>
          <span className="block text-sm font-medium text-charcoal dark:text-ivory mb-1.5">
            {labels.rating}
          </span>
          <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setRating(s)}
                onMouseEnter={() => setHover(s)}
                aria-label={`${s}`}
                className={`p-1 transition-transform hover:scale-110 ${
                  s <= (hover || rating) ? 'text-amber-400' : 'text-charcoal/20 dark:text-ivory/20'
                }`}
              >
                <StarIcon className="w-7 h-7" />
              </button>
            ))}
          </div>
        </div>

        <label className="block">
          <span className="block text-sm font-medium text-charcoal dark:text-ivory mb-1.5">
            {labels.name}
          </span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={labels.namePh}
            className={`w-full h-11 px-4 rounded-xl bg-sand-50 dark:bg-charcoal-light border ${
              errors.name
                ? 'border-red-400 dark:border-red-500'
                : 'border-charcoal/10 dark:border-charcoal-border'
            } text-charcoal dark:text-ivory placeholder:text-charcoal/40 dark:placeholder:text-ivory/40 focus:outline-none focus:border-forest dark:focus:border-forest-light transition-colors`}
          />
          {errors.name && (
            <span className="block text-xs text-red-600 dark:text-red-400 mt-1">
              {errors.name}
            </span>
          )}
        </label>

        <label className="block">
          <span className="block text-sm font-medium text-charcoal dark:text-ivory mb-1.5">
            {labels.quote}
          </span>
          <textarea
            rows={4}
            value={quote}
            onChange={(e) => setQuote(e.target.value)}
            placeholder={labels.quotePh}
            className={`w-full px-4 py-3 rounded-xl bg-sand-50 dark:bg-charcoal-light border resize-none ${
              errors.quote
                ? 'border-red-400 dark:border-red-500'
                : 'border-charcoal/10 dark:border-charcoal-border'
            } text-charcoal dark:text-ivory placeholder:text-charcoal/40 dark:placeholder:text-ivory/40 focus:outline-none focus:border-forest dark:focus:border-forest-light transition-colors`}
          />
          {errors.quote && (
            <span className="block text-xs text-red-600 dark:text-red-400 mt-1">
              {errors.quote}
            </span>
          )}
        </label>

        <button
          type="submit"
          disabled={status === 'sending'}
          className="btn-press w-full h-12 rounded-xl bg-forest text-ivory font-medium hover:bg-forest-light shadow-sm hover:shadow-md disabled:opacity-50 transition-all"
        >
          {status === 'sending' ? labels.sending : labels.submit}
        </button>

        {status === 'sent' && (
          <p className="flex items-start gap-2 text-sm text-forest dark:text-forest-light font-medium">
            <span>✓</span>
            <span>{labels.sent}</span>
          </p>
        )}
        {status === 'error' && (
          <p className="text-sm text-red-600 dark:text-red-400 font-medium">{labels.error}</p>
        )}
      </form>
    </div>
  );
}
