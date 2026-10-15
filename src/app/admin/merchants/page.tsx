'use client';

import { useState, useEffect, useCallback } from 'react';
import { useApp } from '@/context/AppContext';
import { useToast } from '@/components/admin/Toast';
import { WhatsAppIcon, PhoneIcon } from '@/components/Icons';

// ─── Types ───
interface Merchant {
  id: number;
  name: string;
  phone: string | null;
  whatsapp: string | null;
  notes: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}
interface AgreementBilling {
  agreedClicks: number;
  totalClicks: number;
  additionalClicks: number;
  agreedAmount: number;
  additionalAmount: number | null;
  totalAmount: number | null;
  pendingReview: boolean;
}
interface Agreement {
  id: number;
  merchantId: number;
  name: string | null;
  startDate: string;
  endDate: string | null;
  agreedClicks: number;
  ratePerClick: number;
  additionalRate: number | null;
  status: string;
  notes: string | null;
  billing: AgreementBilling;
}
interface ProductOption { slug: string; nameAr: string; nameEn: string; merchantId: number | null }
interface Notification { id: number; type: string; merchantId: number | null; agreementId: number | null; title: string; message: string | null; read: number; createdAt: string }

function fmtNum(n: number | null, isAr: boolean): string {
  if (n == null) return '—';
  return isAr ? n.toLocaleString('ar-EG') : n.toLocaleString('en-US');
}

/** Progress bar for an agreement's agreed-click limit. */
function LimitBar({ agreed, total, isAr }: { agreed: number; total: number; isAr: boolean }) {
  const pct = agreed > 0 ? Math.min(100, Math.round((total / agreed) * 100)) : 0;
  const reached = total >= agreed;
  return (
    <div>
      <div className="flex items-center justify-between text-[11px] mb-1">
        <span className="text-charcoal/60 dark:text-ivory/60">
          {isAr ? `الضغطات: ${fmtNum(total, isAr)} / ${fmtNum(agreed, isAr)}` : `Clicks: ${total} / ${agreed}`}
        </span>
        <span className={`font-bold ${reached ? 'text-red-500' : 'text-forest dark:text-forest-light'}`}>{pct}%</span>
      </div>
      <div className="h-2 rounded-full bg-sand-100 dark:bg-charcoal overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${reached ? 'bg-red-500' : pct > 75 ? 'bg-amber-500' : 'bg-forest dark:bg-forest-light'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function statusBadge(status: string, isAr: boolean) {
  const map: Record<string, { cls: string; label: string; labelEn: string }> = {
    active: { cls: 'bg-[#25D366]/10 text-[#25D366]', label: 'نشطة', labelEn: 'Active' },
    closed: { cls: 'bg-charcoal/10 text-charcoal/60 dark:bg-ivory/10 dark:text-ivory/60', label: 'مغلقة', labelEn: 'Closed' },
    archived: { cls: 'bg-charcoal/10 text-charcoal/50', label: 'مؤرشف', labelEn: 'Archived' },
    draft: { cls: 'bg-amber-500/10 text-amber-600', label: 'مسودة', labelEn: 'Draft' },
    issued: { cls: 'bg-forest/10 text-forest dark:text-forest-light', label: 'صادرة', labelEn: 'Issued' },
    partially_paid: { cls: 'bg-amber-500/10 text-amber-600', label: 'مدفوعة جزئياً', labelEn: 'Partially paid' },
    paid: { cls: 'bg-[#25D366]/10 text-[#25D366]', label: 'مدفوعة', labelEn: 'Paid' },
  };
  const s = map[status] ?? map.active;
  return <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${s.cls}`}>{isAr ? s.label : s.labelEn}</span>;
}

// ─── Agreement form (create + extend) ───
function AgreementForm({ merchant, onDone }: { merchant: Merchant; onDone: () => void }) {
  const { locale } = useApp();
  const isAr = locale === 'ar';
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState('');
  const [agreedClicks, setAgreedClicks] = useState('');
  const [ratePerClick, setRatePerClick] = useState('');
  const [additionalRate, setAdditionalRate] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  async function save() {
    const clicks = Number(agreedClicks);
    const rate = Number(ratePerClick);
    if (!clicks || clicks < 1 || !rate || rate < 1) {
      toast(isAr ? 'أدخل عدد ضغطات وسعر صحيح' : 'Enter valid clicks and rate', 'error');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/admin/agreements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantId: merchant.id,
          name: name || undefined,
          startDate,
          endDate: endDate || null,
          agreedClicks: clicks,
          ratePerClick: rate,
          additionalRate: additionalRate ? Number(additionalRate) : null,
          notes: notes || undefined,
        }),
      });
      if (res.ok) {
        toast(isAr ? 'تم إنشاء الاتفاقية' : 'Agreement created');
        onDone();
      } else {
        const err = await res.json().catch(() => ({}));
        toast(err.error || (isAr ? 'فشل الإنشاء' : 'Create failed'), 'error');
      }
    } catch {
      toast(isAr ? 'خطأ في الاتصال' : 'Connection error', 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-4 rounded-xl bg-sand-50 dark:bg-charcoal border border-charcoal/10 dark:border-charcoal-border space-y-3">
      <div className="text-sm font-semibold text-charcoal dark:text-ivory">
        {isAr ? 'اتفاقية جديدة' : 'New agreement'}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-charcoal/60 dark:text-ivory/60 mb-1">{isAr ? 'اسم الاتفاقية (اختياري)' : 'Name (optional)'}</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="w-full h-9 px-3 rounded-lg bg-ivory dark:bg-charcoal-light border border-charcoal/10 dark:border-charcoal-border text-sm" />
        </div>
        <div>
          <label className="block text-xs text-charcoal/60 dark:text-ivory/60 mb-1">{isAr ? 'تاريخ البداية' : 'Start date'}</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full h-9 px-3 rounded-lg bg-ivory dark:bg-charcoal-light border border-charcoal/10 dark:border-charcoal-border text-sm" />
        </div>
        <div>
          <label className="block text-xs text-charcoal/60 dark:text-ivory/60 mb-1">{isAr ? 'تاريخ النهاية (اختياري)' : 'End date (optional)'}</label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full h-9 px-3 rounded-lg bg-ivory dark:bg-charcoal-light border border-charcoal/10 dark:border-charcoal-border text-sm" />
        </div>
        <div>
          <label className="block text-xs text-charcoal/60 dark:text-ivory/60 mb-1">{isAr ? 'عدد الضغطات المتفق عليها' : 'Agreed clicks'}</label>
          <input type="number" min="1" value={agreedClicks} onChange={(e) => setAgreedClicks(e.target.value)} placeholder="10" className="w-full h-9 px-3 rounded-lg bg-ivory dark:bg-charcoal-light border border-charcoal/10 dark:border-charcoal-border text-sm" />
        </div>
        <div>
          <label className="block text-xs text-charcoal/60 dark:text-ivory/60 mb-1">{isAr ? 'سعر الضغطة (ر.س)' : 'Rate per click (SAR)'}</label>
          <input type="number" min="1" value={ratePerClick} onChange={(e) => setRatePerClick(e.target.value)} placeholder="5" className="w-full h-9 px-3 rounded-lg bg-ivory dark:bg-charcoal-light border border-charcoal/10 dark:border-charcoal-border text-sm" />
        </div>
        <div>
          <label className="block text-xs text-charcoal/60 dark:text-ivory/60 mb-1">
            {isAr ? 'سعر الضغطة الإضافية (اختياري)' : 'Additional-click rate (optional)'}
          </label>
          <input type="number" min="0" value={additionalRate} onChange={(e) => setAdditionalRate(e.target.value)} placeholder={isAr ? 'اتركه فاضي للمراجعة' : 'Leave empty to review'} className="w-full h-9 px-3 rounded-lg bg-ivory dark:bg-charcoal-light border border-charcoal/10 dark:border-charcoal-border text-sm" />
        </div>
      </div>
      <div>
        <label className="block text-xs text-charcoal/60 dark:text-ivory/60 mb-1">{isAr ? 'ملاحظات' : 'Notes'}</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="w-full px-3 py-2 rounded-lg bg-ivory dark:bg-charcoal-light border border-charcoal/10 dark:border-charcoal-border text-sm" />
      </div>
      <div className="flex gap-2">
        <button onClick={save} disabled={saving} className="h-9 px-4 rounded-lg bg-forest text-ivory text-sm font-medium hover:bg-forest-light disabled:opacity-50">
          {saving ? '...' : isAr ? 'حفظ الاتفاقية' : 'Save agreement'}
        </button>
        <button onClick={onDone} className="h-9 px-4 rounded-lg border border-charcoal/15 dark:border-charcoal-border text-sm">
          {isAr ? 'إلغاء' : 'Cancel'}
        </button>
      </div>
      {agreedClicks && ratePerClick && (
        <div className="text-xs text-charcoal/50 dark:text-ivory/50">
          {isAr ? `القيمة المتفق عليها: ` : 'Agreed value: '}
          <b className="text-charcoal dark:text-ivory">{fmtNum(Number(agreedClicks) * Number(ratePerClick), isAr)} {isAr ? 'ر.س' : 'SAR'}</b>
        </div>
      )}
    </div>
  );
}

// ─── Agreement card (with progress + actions) ───
function AgreementCard({ agreement, isAr, onChanged }: { agreement: Agreement; isAr: boolean; onChanged: () => void }) {
  const { toast } = useToast();
  const [extending, setExtending] = useState(false);
  const [extra, setExtra] = useState('');
  const [newRate, setNewRate] = useState('');
  const [invoicing, setInvoicing] = useState(false);

  const b = agreement.billing;
  const pct = agreement.agreedClicks > 0 ? Math.min(100, Math.round((b.totalClicks / agreement.agreedClicks) * 100)) : 0;
  const reached = b.totalClicks >= agreement.agreedClicks;

  async function act(action: string, body: any) {
    const res = await fetch('/api/admin/agreements', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: agreement.id, action, ...body }),
    });
    if (res.ok) { toast(isAr ? 'تم' : 'Done'); onChanged(); }
    else { const e = await res.json().catch(() => ({})); toast(e.error || (isAr ? 'فشل' : 'Failed'), 'error'); }
  }

  async function createInvoice() {
    if (b.additionalClicks > 0 && agreement.additionalRate == null) {
      toast(isAr ? 'فيه ضغطات إضافية بدون سعر — راجعها الأول' : 'Additional clicks need a rate first', 'error');
      return;
    }
    setInvoicing(true);
    try {
      const res = await fetch('/api/admin/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantId: agreement.merchantId,
          agreementId: agreement.id,
          periodFrom: agreement.startDate,
          periodTo: agreement.endDate,
          agreedClicks: b.agreedClicks,
          agreedRate: agreement.ratePerClick,
          additionalClicks: b.additionalClicks,
          additionalRate: agreement.additionalRate ?? 0,
        }),
      });
      if (res.ok) toast(isAr ? 'تم إنشاء الفاتورة' : 'Invoice created');
      else { const e = await res.json().catch(() => ({})); toast(e.error || (isAr ? 'فشل إنشاء الفاتورة' : 'Invoice failed'), 'error'); }
    } finally {
      setInvoicing(false);
    }
  }

  return (
    <div className="p-4 rounded-xl bg-ivory dark:bg-charcoal border border-charcoal/10 dark:border-charcoal-border space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-charcoal dark:text-ivory">{agreement.name || (isAr ? 'اتفاقية' : 'Agreement')}</span>
            {statusBadge(agreement.status, isAr)}
            {reached && agreement.status === 'active' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-500">
                ⚠️ {isAr ? 'وصلت للحد' : 'Limit reached'}
              </span>
            )}
          </div>
          <div className="text-xs text-charcoal/50 dark:text-ivory/50 mt-1">
            {isAr ? `تبدأ: ${agreement.startDate}` : `Starts: ${agreement.startDate}`}
            {agreement.endDate ? ` · ${isAr ? 'تنتهي' : 'Ends'}: ${agreement.endDate}` : ''}
            {` · ${isAr ? 'سعر الضغطة' : 'Rate'}: ${fmtNum(agreement.ratePerClick, isAr)} ${isAr ? 'ر.س' : 'SAR'}`}
          </div>
        </div>
      </div>

      <LimitBar agreed={agreement.agreedClicks} total={b.totalClicks} isAr={isAr} />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
        <div className="p-2 rounded-lg bg-sand-50 dark:bg-charcoal-light">
          <div className="text-[10px] text-charcoal/50 dark:text-ivory/50">{isAr ? 'ضغطات متفق عليها' : 'Agreed'}</div>
          <div className="font-bold text-charcoal dark:text-ivory">{fmtNum(b.agreedClicks, isAr)}</div>
        </div>
        <div className="p-2 rounded-lg bg-sand-50 dark:bg-charcoal-light">
          <div className="text-[10px] text-charcoal/50 dark:text-ivory/50">{isAr ? 'إضافية' : 'Additional'}</div>
          <div className={`font-bold ${b.additionalClicks > 0 ? 'text-amber-600' : 'text-charcoal dark:text-ivory'}`}>{fmtNum(b.additionalClicks, isAr)}</div>
        </div>
        <div className="p-2 rounded-lg bg-sand-50 dark:bg-charcoal-light">
          <div className="text-[10px] text-charcoal/50 dark:text-ivory/50">{isAr ? 'المبلغ المتفق' : 'Agreed amount'}</div>
          <div className="font-bold text-charcoal dark:text-ivory">{fmtNum(b.agreedAmount, isAr)}</div>
        </div>
        <div className="p-2 rounded-lg bg-sand-50 dark:bg-charcoal-light">
          <div className="text-[10px] text-charcoal/50 dark:text-ivory/50">{isAr ? 'الإجمالي' : 'Total'}</div>
          <div className="font-bold text-charcoal dark:text-ivory">
            {b.pendingReview ? (isAr ? 'للمراجعة' : 'Review') : fmtNum(b.totalAmount, isAr)}
          </div>
        </div>
      </div>

      {b.pendingReview && (
        <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300">
          {isAr
            ? `فيه ${fmtNum(b.additionalClicks, isAr)} ضغطة إضافية بدون سعر متفق عليه — اضف سعر الضغطة الإضافية أو راجعها يدوياً قبل الفاتورة.`
            : `${b.additionalClicks} additional clicks have no agreed rate — set a rate or review them before invoicing.`}
        </div>
      )}

      {agreement.status === 'active' && (
        <div className="flex flex-wrap gap-2 pt-1">
          <button onClick={() => setExtending(!extending)} className="h-8 px-3 rounded-lg border border-charcoal/15 dark:border-charcoal-border text-xs font-medium hover:border-forest/40">
            {isAr ? 'تمديد الاتفاقية' : 'Extend'}
          </button>
          <button onClick={createInvoice} disabled={invoicing} className="h-8 px-3 rounded-lg bg-forest text-ivory text-xs font-medium hover:bg-forest-light disabled:opacity-50">
            {invoicing ? '...' : isAr ? 'إنشاء فاتورة' : 'Create invoice'}
          </button>
          <button onClick={() => act('close', {})} className="h-8 px-3 rounded-lg border border-red-500/30 text-red-500 text-xs font-medium hover:bg-red-500/10">
            {isAr ? 'إغلاق الاتفاقية' : 'Close'}
          </button>
        </div>
      )}

      {extending && (
        <div className="p-3 rounded-lg bg-sand-50 dark:bg-charcoal border border-charcoal/10 dark:border-charcoal-border space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-charcoal/60 dark:text-ivory/60 mb-1">{isAr ? 'ضغطات إضافية' : 'Extra clicks'}</label>
              <input type="number" min="1" value={extra} onChange={(e) => setExtra(e.target.value)} className="w-full h-9 px-3 rounded-lg bg-ivory dark:bg-charcoal-light border border-charcoal/10 dark:border-charcoal-border text-sm" />
            </div>
            <div>
              <label className="block text-xs text-charcoal/60 dark:text-ivory/60 mb-1">{isAr ? 'سعر جديد (اختياري)' : 'New rate (optional)'}</label>
              <input type="number" min="0" value={newRate} onChange={(e) => setNewRate(e.target.value)} className="w-full h-9 px-3 rounded-lg bg-ivory dark:bg-charcoal-light border border-charcoal/10 dark:border-charcoal-border text-sm" />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { act('extend', { extraClicks: Number(extra), newRate: newRate ? Number(newRate) : null }); setExtending(false); }}
              disabled={!extra || Number(extra) < 1}
              className="h-9 px-4 rounded-lg bg-forest text-ivory text-sm font-medium disabled:opacity-50"
            >
              {isAr ? 'تمديد' : 'Extend'}
            </button>
            <button onClick={() => setExtending(false)} className="h-9 px-3 rounded-lg border border-charcoal/15 dark:border-charcoal-border text-sm">
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
          </div>
        </div>
      )}

      {agreement.notes && (
        <details className="text-xs">
          <summary className="cursor-pointer text-charcoal/50 dark:text-ivory/50">{isAr ? 'سجل التغييرات' : 'History'}</summary>
          <pre className="mt-1 whitespace-pre-wrap text-charcoal/60 dark:text-ivory/60 font-sans">{agreement.notes}</pre>
        </details>
      )}
    </div>
  );
}

// ─── Main page ───
export default function AdminMerchants() {
  const { locale } = useApp();
  const isAr = locale === 'ar';
  const { toast } = useToast();
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [agreements, setAgreements] = useState<Record<number, Agreement[]>>({});
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newWhatsapp, setNewWhatsapp] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const loadMerchants = useCallback(async () => {
    const res = await fetch('/api/admin/merchants');
    if (res.ok) setMerchants((await res.json()).merchants);
  }, []);

  const loadAgreements = useCallback(async (merchantId: number) => {
    const res = await fetch(`/api/admin/agreements?merchantId=${merchantId}`);
    if (res.ok) {
      const data = await res.json();
      setAgreements((prev) => ({ ...prev, [merchantId]: data.agreements }));
    }
  }, []);

  useEffect(() => {
    (async () => {
      // Products list for assignment (slug + current merchant)
      try {
        const res = await fetch('/api/admin/products');
        if (res.ok) {
          const data = await res.json();
          setProducts((data.products || []).map((p: any) => ({ slug: p.slug, nameAr: p.name?.ar || p.slug, nameEn: p.name?.en || p.slug, merchantId: p.merchantId ?? null })));
        }
      } catch { /* ignore */ }
      await Promise.all([loadMerchants(), loadNotifications()]);
      setLoading(false);
    })();
  }, [loadMerchants, loadNotifications]);

  async function loadNotifications() {
    try {
      const res = await fetch('/api/admin/notifications');
      if (res.ok) setNotifications((await res.json()).notifications ?? []);
    } catch { /* ignore */ }
  }

  async function markRead(id: number) {
    await fetch('/api/admin/notifications', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: 1 } : n)));
  }

  async function markAllRead() {
    await fetch('/api/admin/notifications', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ all: true }),
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: 1 })));
  }

  async function addMerchant() {
    if (!newName.trim()) { toast(isAr ? 'اسم التاجر مطلوب' : 'Name is required', 'error'); return; }
    const res = await fetch('/api/admin/merchants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim(), phone: newPhone || undefined, whatsapp: newWhatsapp || undefined, notes: newNotes || undefined }),
    });
    if (res.ok) {
      toast(isAr ? 'تم إضافة التاجر' : 'Merchant added');
      setShowAdd(false);
      setNewName(''); setNewPhone(''); setNewWhatsapp(''); setNewNotes('');
      loadMerchants();
    } else {
      const e = await res.json().catch(() => ({}));
      toast(e.error || (isAr ? 'فشل الإضافة' : 'Add failed'), 'error');
    }
  }

  async function archiveMerchant(id: number) {
    if (!confirm(isAr ? 'أرشفة التاجر؟ منتجاته هتتحرر من الإسناد.' : 'Archive merchant? Its products will be unassigned.')) return;
    const res = await fetch('/api/admin/merchants', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action: 'archive' }),
    });
    if (res.ok) { toast(isAr ? 'تم الأرشفة' : 'Archived'); loadMerchants(); }
  }

  async function toggleAssign(merchantId: number, slug: string, currentlyAssigned: boolean) {
    const res = await fetch('/api/admin/merchants/assign', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, merchantId: currentlyAssigned ? null : merchantId }),
    });
    if (res.ok) {
      toast(isAr ? 'تم تحديث الإسناد' : 'Assignment updated');
      setProducts((prev) => prev.map((p) => (p.slug === slug ? { ...p, merchantId: currentlyAssigned ? null : merchantId } : p)));
    }
  }

  function toggleExpand(m: Merchant) {
    if (expanded === m.id) { setExpanded(null); return; }
    setExpanded(m.id);
    loadAgreements(m.id);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-charcoal dark:text-ivory">{isAr ? 'التُجّار والاتفاقيات' : 'Merchants & Agreements'}</h1>
          <p className="text-sm text-charcoal/60 dark:text-ivory/60 mt-1 max-w-2xl">
            {isAr
              ? 'أسند المنتجات للتُجّار، أدر اتفاقيات الضغطات، وتابع الحد المتفق عليه والمبالغ المالية.'
              : 'Assign products to merchants, manage click agreements, and track limits and billing.'}
          </p>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} className="h-10 px-4 rounded-xl bg-forest text-ivory text-sm font-medium hover:bg-forest-light">
          {showAdd ? (isAr ? 'إلغاء' : 'Cancel') : isAr ? '+ تاجر جديد' : '+ New merchant'}
        </button>
      </div>

      {showAdd && (
        <div className="p-4 rounded-2xl bg-ivory dark:bg-charcoal-light border border-charcoal/5 dark:border-charcoal-border mb-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-charcoal/60 dark:text-ivory/60 mb-1">{isAr ? 'الاسم *' : 'Name *'}</label>
            <input value={newName} onChange={(e) => setNewName(e.target.value)} className="w-full h-9 px-3 rounded-lg bg-sand-100 dark:bg-charcoal border border-charcoal/10 dark:border-charcoal-border text-sm" />
          </div>
          <div>
            <label className="block text-xs text-charcoal/60 dark:text-ivory/60 mb-1">{isAr ? 'الهاتف' : 'Phone'}</label>
            <input value={newPhone} onChange={(e) => setNewPhone(e.target.value)} dir="ltr" className="w-full h-9 px-3 rounded-lg bg-sand-100 dark:bg-charcoal border border-charcoal/10 dark:border-charcoal-border text-sm" />
          </div>
          <div>
            <label className="block text-xs text-charcoal/60 dark:text-ivory/60 mb-1">{isAr ? 'واتساب' : 'WhatsApp'}</label>
            <input value={newWhatsapp} onChange={(e) => setNewWhatsapp(e.target.value)} dir="ltr" className="w-full h-9 px-3 rounded-lg bg-sand-100 dark:bg-charcoal border border-charcoal/10 dark:border-charcoal-border text-sm" />
          </div>
          <div>
            <label className="block text-xs text-charcoal/60 dark:text-ivory/60 mb-1">{isAr ? 'ملاحظات داخلية' : 'Internal notes'}</label>
            <input value={newNotes} onChange={(e) => setNewNotes(e.target.value)} className="w-full h-9 px-3 rounded-lg bg-sand-100 dark:bg-charcoal border border-charcoal/10 dark:border-charcoal-border text-sm" />
          </div>
          <div className="sm:col-span-2">
            <button onClick={addMerchant} className="h-9 px-4 rounded-lg bg-forest text-ivory text-sm font-medium">
              {isAr ? 'إضافة' : 'Add'}
            </button>
          </div>
        </div>
      )}

      {/* ─── Notifications center ─── */}
      {notifications.length > 0 && (
        <div className="p-5 rounded-2xl bg-ivory dark:bg-charcoal-light border border-charcoal/5 dark:border-charcoal-border mb-6">
          <div className="flex items-center justify-between gap-3 mb-3">
            <h2 className="font-semibold text-charcoal dark:text-ivory">
              {isAr ? 'الإشعارات' : 'Notifications'}
              {notifications.some((n) => !n.read) && (
                <span className="ms-2 inline-block px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 text-xs font-medium">
                  {notifications.filter((n) => !n.read).length} {isAr ? 'جديد' : 'new'}
                </span>
              )}
            </h2>
            {notifications.some((n) => !n.read) && (
              <button onClick={markAllRead} className="text-xs text-forest dark:text-forest-light hover:underline">
                {isAr ? 'تعليم الكل كمقروء' : 'Mark all read'}
              </button>
            )}
          </div>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`p-3 rounded-lg border text-sm ${n.read ? 'bg-ivory dark:bg-charcoal border-charcoal/5 dark:border-charcoal-border' : 'bg-red-500/5 border-red-500/20'}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium text-charcoal dark:text-ivory">{n.title}</div>
                    {n.message && <div className="text-xs text-charcoal/60 dark:text-ivory/60 mt-1 leading-relaxed">{n.message}</div>}
                    <div className="text-[11px] text-charcoal/40 dark:text-ivory/40 mt-1">
                      {new Date(n.createdAt).toLocaleString(isAr ? 'ar-EG' : 'en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  {!n.read && (
                    <button onClick={() => markRead(n.id)} className="shrink-0 text-xs text-forest dark:text-forest-light hover:underline">
                      {isAr ? 'قرأت' : 'Mark read'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => <div key={i} className="h-24 rounded-2xl bg-sand-100 dark:bg-charcoal-light animate-pulse" />)}
        </div>
      ) : merchants.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-3">🤝</div>
          <div className="text-charcoal/50 dark:text-ivory/50 text-sm">
            {isAr ? 'مفيش تُجّار — ضيف أول تاجر عشان تبدأ' : 'No merchants yet — add your first merchant to get started'}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {merchants.map((m) => {
            const isOpen = expanded === m.id;
            const assigned = products.filter((p) => p.merchantId === m.id);
            return (
              <div key={m.id} className="p-5 rounded-2xl bg-ivory dark:bg-charcoal-light border border-charcoal/5 dark:border-charcoal-border">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="font-bold text-charcoal dark:text-ivory">{m.name}</h2>
                      {statusBadge(m.status, isAr)}
                      <span className="text-xs text-charcoal/50 dark:text-ivory/50">
                        {isAr ? `${fmtNum(assigned.length, isAr)} منتج مسند` : `${assigned.length} products assigned`}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-charcoal/50 dark:text-ivory/50">
                      {m.phone && <span dir="ltr">📞 {m.phone}</span>}
                      {m.whatsapp && <span dir="ltr">💬 {m.whatsapp}</span>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => toggleExpand(m)} className="h-9 px-3 rounded-lg border border-charcoal/15 dark:border-charcoal-border text-sm">
                      {isOpen ? (isAr ? 'إغلاق' : 'Close') : isAr ? 'التفاصيل' : 'Details'}
                    </button>
                    {m.status !== 'archived' && (
                      <button onClick={() => archiveMerchant(m.id)} className="h-9 px-3 rounded-lg border border-red-500/30 text-red-500 text-sm">
                        {isAr ? 'أرشفة' : 'Archive'}
                      </button>
                    )}
                  </div>
                </div>

                {isOpen && (
                  <div className="mt-4 pt-4 border-t border-charcoal/10 dark:border-charcoal-border space-y-4">
                    {/* agreements */}
                    <div>
                      <h3 className="text-sm font-semibold text-charcoal dark:text-ivory mb-2">{isAr ? 'الاتفاقيات' : 'Agreements'}</h3>
                      {(agreements[m.id] ?? []).length === 0 ? (
                        <p className="text-xs text-charcoal/40 dark:text-ivory/40 mb-2">{isAr ? 'مفيش اتفاقيات — ضيف واحدة' : 'No agreements yet'}</p>
                      ) : (
                        <div className="space-y-2 mb-2">
                          {(agreements[m.id] ?? []).map((a) => (
                            <AgreementCard key={a.id} agreement={a} isAr={isAr} onChanged={() => loadAgreements(m.id)} />
                          ))}
                        </div>
                      )}
                      <details>
                        <summary className="cursor-pointer text-sm text-forest dark:text-forest-light">+ {isAr ? 'اتفاقية جديدة' : 'New agreement'}</summary>
                        <div className="mt-2">
                          <AgreementForm merchant={m} onDone={() => loadAgreements(m.id)} />
                        </div>
                      </details>
                    </div>

                    {/* product assignment */}
                    <div>
                      <h3 className="text-sm font-semibold text-charcoal dark:text-ivory mb-2">{isAr ? 'إسناد المنتجات' : 'Assign products'}</h3>
                      {products.length === 0 ? (
                        <p className="text-xs text-charcoal/40 dark:text-ivory/40">{isAr ? 'مفيش منتجات' : 'No products'}</p>
                      ) : (
                        <div className="max-h-64 overflow-y-auto rounded-lg border border-charcoal/10 dark:border-charcoal-border divide-y divide-charcoal/5 dark:divide-charcoal-border/50">
                          {products.map((p) => {
                            const isAssigned = p.merchantId === m.id;
                            const otherMerchant = p.merchantId != null && p.merchantId !== m.id
                              ? merchants.find((mm) => mm.id === p.merchantId)
                              : null;
                            return (
                              <label key={p.slug} className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-sand-50 dark:hover:bg-charcoal">
                                <input
                                  type="checkbox"
                                  checked={isAssigned}
                                  disabled={!!otherMerchant}
                                  onChange={() => toggleAssign(m.id, p.slug, isAssigned)}
                                  className="w-4 h-4 accent-forest"
                                />
                                <span className="flex-1 text-sm text-charcoal dark:text-ivory truncate">{isAr ? p.nameAr : p.nameEn}</span>
                                {otherMerchant && (
                                  <span className="text-[11px] text-charcoal/40 dark:text-ivory/40 shrink-0">
                                    {isAr ? 'مسند لـ' : 'Assigned to'} {otherMerchant.name}
                                  </span>
                                )}
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
