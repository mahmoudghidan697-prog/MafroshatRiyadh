'use client';

import { useState, useEffect, useCallback } from 'react';
import { useApp } from '@/context/AppContext';
import { useToast } from '@/components/admin/Toast';

interface Invoice {
  id: number;
  invoiceNumber: string;
  merchantId: number;
  agreementId: number;
  issueDate: string;
  periodFrom: string | null;
  periodTo: string | null;
  agreedClicks: number;
  agreedRate: number;
  additionalClicks: number;
  additionalRate: number;
  totalClicks: number;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  amountPaid: number;
  status: string;
  notes: string | null;
  payments: any[];
}
interface MerchantSummary {
  merchantId: number;
  name: string;
  productCount: number;
  whatsappClicks: number;
  phoneClicks: number;
  totalClicks: number;
  agreedLimit: number | null;
  remainingClicks: number | null;
  additionalClicks: number;
  invoiced: number;
  paid: number;
  balance: number;
  limitReached: boolean;
}

function fmtNum(n: number | null, isAr: boolean): string {
  if (n == null) return '—';
  return isAr ? n.toLocaleString('ar-EG') : n.toLocaleString('en-US');
}
function fmtMoney(n: number, isAr: boolean): string {
  return `${fmtNum(n, isAr)} ${isAr ? 'ر.س' : 'SAR'}`;
}

function statusBadge(status: string, isAr: boolean) {
  const map: Record<string, { cls: string; label: string; labelEn: string }> = {
    issued: { cls: 'bg-forest/10 text-forest dark:text-forest-light', label: 'صادرة', labelEn: 'Issued' },
    partially_paid: { cls: 'bg-amber-500/10 text-amber-600', label: 'مدفوعة جزئياً', labelEn: 'Partially paid' },
    paid: { cls: 'bg-[#25D366]/10 text-[#25D366]', label: 'مدفوعة', labelEn: 'Paid' },
    draft: { cls: 'bg-charcoal/10 text-charcoal/50', label: 'مسودة', labelEn: 'Draft' },
  };
  const s = map[status] ?? map.issued;
  return <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${s.cls}`}>{isAr ? s.label : s.labelEn}</span>;
}

// ─── Payment form (partial payments supported) ───
function PaymentForm({ invoice, onDone }: { invoice: Invoice; onDone: () => void }) {
  const { locale } = useApp();
  const isAr = locale === 'ar';
  const { toast } = useToast();
  const remaining = invoice.total - invoice.amountPaid;
  const [amount, setAmount] = useState(String(remaining));
  const [method, setMethod] = useState('تحويل بنكي');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  async function save() {
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) { toast(isAr ? 'مبلغ غير صحيح' : 'Invalid amount', 'error'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/admin/invoices', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId: invoice.id, amount: n, method, reference, notes }),
      });
      if (res.ok) { toast(isAr ? 'تم تسجيل الدفعة' : 'Payment recorded'); onDone(); }
      else { const e = await res.json().catch(() => ({})); toast(e.error || (isAr ? 'فشل التسجيل' : 'Failed'), 'error'); }
    } finally { setSaving(false); }
  }

  if (remaining <= 0) {
    return <div className="text-xs text-[#25D366]">✓ {isAr ? 'مدفوعة بالكامل' : 'Fully paid'}</div>;
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div>
          <label className="block text-xs text-charcoal/60 dark:text-ivory/60 mb-1">{isAr ? 'المبلغ' : 'Amount'}</label>
          <input type="number" min="1" max={remaining} value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full h-9 px-3 rounded-lg bg-sand-100 dark:bg-charcoal border border-charcoal/10 dark:border-charcoal-border text-sm" />
        </div>
        <div>
          <label className="block text-xs text-charcoal/60 dark:text-ivory/60 mb-1">{isAr ? 'طريقة الدفع' : 'Method'}</label>
          <select value={method} onChange={(e) => setMethod(e.target.value)} className="w-full h-9 px-3 rounded-lg bg-sand-100 dark:bg-charcoal border border-charcoal/10 dark:border-charcoal-border text-sm">
            <option>{isAr ? 'تحويل بنكي' : 'Bank transfer'}</option>
            <option>{isAr ? 'نقداً' : 'Cash'}</option>
            <option>{isAr ? 'شيك' : 'Cheque'}</option>
            <option>{isAr ? 'أخرى' : 'Other'}</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-charcoal/60 dark:text-ivory/60 mb-1">{isAr ? 'المرجع' : 'Reference'}</label>
          <input value={reference} onChange={(e) => setReference(e.target.value)} className="w-full h-9 px-3 rounded-lg bg-sand-100 dark:bg-charcoal border border-charcoal/10 dark:border-charcoal-border text-sm" />
        </div>
        <div className="flex items-end">
          <button onClick={save} disabled={saving} className="h-9 px-4 rounded-lg bg-forest text-ivory text-sm font-medium disabled:opacity-50">
            {saving ? '...' : isAr ? 'تسجيل الدفعة' : 'Record payment'}
          </button>
        </div>
      </div>
      <p className="text-[11px] text-charcoal/40 dark:text-ivory/40">
        {isAr ? `المتبقي: ${fmtMoney(remaining, isAr)} — الدفعات الجزئية مسموحة` : `Remaining: ${fmtMoney(remaining, isAr)} — partial payments allowed`}
      </p>
    </div>
  );
}

export default function AdminInvoices() {
  const { locale } = useApp();
  const isAr = locale === 'ar';
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [summary, setSummary] = useState<MerchantSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [merchantFilter, setMerchantFilter] = useState('all');

  const load = useCallback(async () => {
    const res = await fetch('/api/admin/invoices');
    if (res.ok) {
      const data = await res.json();
      setInvoices(data.invoices);
      setSummary(data.summary);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const merchants = [...new Map(summary.map((s) => [s.merchantId, s.name])).entries()];

  const filtered = invoices.filter((inv) => {
    if (statusFilter !== 'all' && inv.status !== statusFilter) return false;
    if (merchantFilter !== 'all' && String(inv.merchantId) !== merchantFilter) return false;
    if (search && !inv.invoiceNumber.includes(search)) return false;
    return true;
  });

  // Totals
  const totalInvoiced = invoices.reduce((s, i) => s + i.total, 0);
  const totalPaid = invoices.reduce((s, i) => s + i.amountPaid, 0);
  const totalBalance = totalInvoiced - totalPaid;

  function printInvoice(inv: Invoice) {
    const merchant = summary.find((s) => s.merchantId === inv.merchantId);
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html dir="${isAr ? 'rtl' : 'ltr'}"><head><meta charset="utf-8"><title>${inv.invoiceNumber}</title>
      <style>body{font-family:system-ui,sans-serif;padding:32px;color:#1C1F1E}
      table{width:100%;border-collapse:collapse;margin:16px 0}th,td{border:1px solid #ddd;padding:8px;text-align:start}
      th{background:#f5f5f4}.total{font-weight:bold;font-size:18px}.muted{color:#888;font-size:12px}</style></head>
      <body>
      <h2>${isAr ? 'فاتورة' : 'Invoice'} ${inv.invoiceNumber}</h2>
      <p class="muted">${isAr ? 'تاريخ الإصدار' : 'Issue date'}: ${inv.issueDate}</p>
      <p>${isAr ? 'التاجر' : 'Merchant'}: <b>${merchant?.name ?? '—'}</b></p>
      ${inv.periodFrom || inv.periodTo ? `<p class="muted">${isAr ? 'الفترة' : 'Period'}: ${inv.periodFrom ?? '—'} — ${inv.periodTo ?? '—'}</p>` : ''}
      <table><thead><tr>
        <th>${isAr ? 'البند' : 'Item'}</th><th>${isAr ? 'الكمية' : 'Qty'}</th><th>${isAr ? 'السعر' : 'Rate'}</th><th>${isAr ? 'المبلغ' : 'Amount'}</th>
      </tr></thead><tbody>
      <tr><td>${isAr ? 'ضغطات متفق عليها' : 'Agreed clicks'}</td><td>${inv.agreedClicks}</td><td>${inv.agreedRate}</td><td>${inv.agreedClicks * inv.agreedRate}</td></tr>
      ${inv.additionalClicks > 0 ? `<tr><td>${isAr ? 'ضغطات إضافية' : 'Additional clicks'}</td><td>${inv.additionalClicks}</td><td>${inv.additionalRate}</td><td>${inv.additionalClicks * inv.additionalRate}</td></tr>` : ''}
      <tr><td>${isAr ? 'المجموع الفرعي' : 'Subtotal'}</td><td colspan="2"></td><td>${inv.subtotal}</td></tr>
      ${inv.taxAmount > 0 ? `<tr><td>${isAr ? 'الضريبة' : 'Tax'} (${inv.taxRate}%)</td><td colspan="2"></td><td>${inv.taxAmount}</td></tr>` : ''}
      </tbody></table>
      <p class="total">${isAr ? 'الإجمالي' : 'Total'}: ${inv.total} ${isAr ? 'ر.س' : 'SAR'}</p>
      <p>${isAr ? 'المدفوع' : 'Paid'}: ${inv.amountPaid} · ${isAr ? 'المتبقي' : 'Balance'}: ${inv.total - inv.amountPaid}</p>
      ${inv.payments.length ? `<h4>${isAr ? 'الدفعات' : 'Payments'}</h4><ul>${inv.payments.map((p: any) => `<li>${p.paid_at?.slice(0, 10) ?? ''} — ${p.amount} ${isAr ? 'ر.س' : 'SAR'} ${p.method ? `(${p.method})` : ''}</li>`).join('')}</ul>` : ''}
      <p class="muted" style="margin-top:24px">${isAr ? 'الضغطة تعني فتح الرابط — ليست تأكيداً بمكالمة أو رسالة.' : 'A click means the link was opened — not a confirmed call or message.'}</p>
      </body></html>`);
    w.document.close();
    w.print();
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-charcoal dark:text-ivory">{isAr ? 'الفواتير والمدفوعات' : 'Invoices & Payments'}</h1>
        <p className="text-sm text-charcoal/60 dark:text-ivory/60 mt-1 max-w-2xl">
          {isAr
            ? 'تابع الفواتير والمبالغ المستحقة والمدفوعة لكل تاجر، وسجّل الدفعات اليدوية.'
            : 'Track invoices, balances, and payments per merchant, and record payments manually.'}
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="p-4 rounded-2xl bg-ivory dark:bg-charcoal-light border border-charcoal/5 dark:border-charcoal-border">
          <div className="text-[11px] text-charcoal/50 dark:text-ivory/50 mb-1">{isAr ? 'إجمالي الفواتير' : 'Total invoiced'}</div>
          <div className="text-2xl font-bold text-charcoal dark:text-ivory">{fmtMoney(totalInvoiced, isAr)}</div>
        </div>
        <div className="p-4 rounded-2xl bg-ivory dark:bg-charcoal-light border border-charcoal/5 dark:border-charcoal-border">
          <div className="text-[11px] text-charcoal/50 dark:text-ivory/50 mb-1">{isAr ? 'إجمالي المدفوع' : 'Total paid'}</div>
          <div className="text-2xl font-bold text-[#25D366]">{fmtMoney(totalPaid, isAr)}</div>
        </div>
        <div className="p-4 rounded-2xl bg-ivory dark:bg-charcoal-light border border-charcoal/5 dark:border-charcoal-border">
          <div className="text-[11px] text-charcoal/50 dark:text-ivory/50 mb-1">{isAr ? 'المتبقي' : 'Outstanding'}</div>
          <div className={`text-2xl font-bold ${totalBalance > 0 ? 'text-red-500' : 'text-charcoal dark:text-ivory'}`}>{fmtMoney(totalBalance, isAr)}</div>
        </div>
        <div className="p-4 rounded-2xl bg-ivory dark:bg-charcoal-light border border-charcoal/5 dark:border-charcoal-border">
          <div className="text-[11px] text-charcoal/50 dark:text-ivory/50 mb-1">{isAr ? 'عدد الفواتير' : 'Invoices'}</div>
          <div className="text-2xl font-bold text-charcoal dark:text-ivory">{fmtNum(invoices.length, isAr)}</div>
        </div>
      </div>

      {/* Merchant comparison table */}
      {summary.length > 0 && (
        <div className="p-5 rounded-2xl bg-ivory dark:bg-charcoal-light border border-charcoal/5 dark:border-charcoal-border mb-6">
          <h2 className="font-semibold text-charcoal dark:text-ivory mb-4">{isAr ? 'مقارنة التُجّار' : 'Merchant comparison'}</h2>
          <div className="overflow-x-auto -mx-5 px-5">
            <table className="w-full text-sm min-w-[760px]">
              <thead>
                <tr className="text-charcoal/50 dark:text-ivory/50 text-xs border-b border-charcoal/10 dark:border-charcoal-border">
                  <th className="text-start py-2.5 px-2 font-medium">{isAr ? 'التاجر' : 'Merchant'}</th>
                  <th className="text-end py-2.5 px-2 font-medium">{isAr ? 'المنتجات' : 'Products'}</th>
                  <th className="text-end py-2.5 px-2 font-medium">{isAr ? 'واتساب' : 'WhatsApp'}</th>
                  <th className="text-end py-2.5 px-2 font-medium">{isAr ? 'هاتف' : 'Phone'}</th>
                  <th className="text-end py-2.5 px-2 font-medium">{isAr ? 'الإجمالي' : 'Total'}</th>
                  <th className="text-end py-2.5 px-2 font-medium">{isAr ? 'الحد' : 'Limit'}</th>
                  <th className="text-end py-2.5 px-2 font-medium">{isAr ? 'إضافية' : 'Extra'}</th>
                  <th className="text-end py-2.5 px-2 font-medium">{isAr ? 'المتبقي' : 'Balance'}</th>
                  <th className="text-center py-2.5 px-2 font-medium">{isAr ? 'الحالة' : 'Status'}</th>
                </tr>
              </thead>
              <tbody>
                {summary.map((s) => (
                  <tr key={s.merchantId} className="border-b border-charcoal/5 dark:border-charcoal-border/50">
                    <td className="py-2.5 px-2 font-medium text-charcoal dark:text-ivory">{s.name}</td>
                    <td className="py-2.5 px-2 text-end text-charcoal/70 dark:text-ivory/70">{fmtNum(s.productCount, isAr)}</td>
                    <td className="py-2.5 px-2 text-end text-[#25D366]">{fmtNum(s.whatsappClicks, isAr)}</td>
                    <td className="py-2.5 px-2 text-end text-forest dark:text-forest-light">{fmtNum(s.phoneClicks, isAr)}</td>
                    <td className="py-2.5 px-2 text-end font-bold text-charcoal dark:text-ivory">{fmtNum(s.totalClicks, isAr)}</td>
                    <td className="py-2.5 px-2 text-end text-charcoal/70 dark:text-ivory/70">{s.agreedLimit != null ? fmtNum(s.agreedLimit, isAr) : '—'}</td>
                    <td className="py-2.5 px-2 text-end text-amber-600">{fmtNum(s.additionalClicks, isAr)}</td>
                    <td className="py-2.5 px-2 text-end font-medium">{fmtMoney(s.balance, isAr)}</td>
                    <td className="py-2.5 px-2 text-center">
                      {s.limitReached
                        ? <span className="text-red-500 text-xs font-medium">⚠️ {isAr ? 'وصلت للحد' : 'Limit'}</span>
                        : <span className="text-[#25D366] text-xs font-medium">✓</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Invoices list */}
      <div className="p-5 rounded-2xl bg-ivory dark:bg-charcoal-light border border-charcoal/5 dark:border-charcoal-border">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h2 className="font-semibold text-charcoal dark:text-ivory">{isAr ? 'الفواتير' : 'Invoices'}</h2>
          <div className="flex flex-wrap items-center gap-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={isAr ? 'ابحث برقم الفاتورة...' : 'Search invoice #...'}
              className="h-9 px-3 rounded-lg bg-sand-100 dark:bg-charcoal border border-charcoal/10 dark:border-charcoal-border text-sm w-44"
            />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-9 px-3 rounded-lg bg-sand-100 dark:bg-charcoal border border-charcoal/10 dark:border-charcoal-border text-sm">
              <option value="all">{isAr ? 'كل الحالات' : 'All statuses'}</option>
              <option value="issued">{isAr ? 'صادرة' : 'Issued'}</option>
              <option value="partially_paid">{isAr ? 'مدفوعة جزئياً' : 'Partially paid'}</option>
              <option value="paid">{isAr ? 'مدفوعة' : 'Paid'}</option>
            </select>
            <select value={merchantFilter} onChange={(e) => setMerchantFilter(e.target.value)} className="h-9 px-3 rounded-lg bg-sand-100 dark:bg-charcoal border border-charcoal/10 dark:border-charcoal-border text-sm">
              <option value="all">{isAr ? 'كل التُجّار' : 'All merchants'}</option>
              {merchants.map(([id, name]) => <option key={id} value={String(id)}>{name}</option>)}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-16 rounded-xl bg-sand-100 dark:bg-charcoal animate-pulse" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-3xl mb-2">🧾</div>
            <div className="text-sm text-charcoal/50 dark:text-ivory/50">
              {isAr ? 'مفيش فواتير — أنشئ واحدة من صفحة التُجّار' : 'No invoices — create one from the Merchants page'}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-5 px-5">
            <table className="w-full text-sm min-w-[720px]">
              <thead>
                <tr className="text-charcoal/50 dark:text-ivory/50 text-xs border-b border-charcoal/10 dark:border-charcoal-border">
                  <th className="text-start py-2.5 px-2 font-medium">{isAr ? 'رقم الفاتورة' : 'Invoice #'}</th>
                  <th className="text-start py-2.5 px-2 font-medium">{isAr ? 'التاجر' : 'Merchant'}</th>
                  <th className="text-end py-2.5 px-2 font-medium">{isAr ? 'الضغطات' : 'Clicks'}</th>
                  <th className="text-end py-2.5 px-2 font-medium">{isAr ? 'الإجمالي' : 'Total'}</th>
                  <th className="text-end py-2.5 px-2 font-medium">{isAr ? 'المدفوع' : 'Paid'}</th>
                  <th className="text-end py-2.5 px-2 font-medium">{isAr ? 'المتبقي' : 'Balance'}</th>
                  <th className="text-start py-2.5 px-2 font-medium">{isAr ? 'الحالة' : 'Status'}</th>
                  <th className="text-center py-2.5 px-2 font-medium">{isAr ? 'إجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((inv) => {
                  const merchant = summary.find((s) => s.merchantId === inv.merchantId);
                  const balance = inv.total - inv.amountPaid;
                  const isOpen = expanded === inv.id;
                  return (
                    <>
                      <tr key={inv.id} className="border-b border-charcoal/5 dark:border-charcoal-border/50 hover:bg-sand-50 dark:hover:bg-charcoal">
                        <td className="py-2.5 px-2 font-medium text-charcoal dark:text-ivory" dir="ltr">{inv.invoiceNumber}</td>
                        <td className="py-2.5 px-2 text-charcoal dark:text-ivory">{merchant?.name ?? '—'}</td>
                        <td className="py-2.5 px-2 text-end text-charcoal/70 dark:text-ivory/70">{fmtNum(inv.totalClicks, isAr)}</td>
                        <td className="py-2.5 px-2 text-end font-bold text-charcoal dark:text-ivory">{fmtNum(inv.total, isAr)}</td>
                        <td className="py-2.5 px-2 text-end text-[#25D366]">{fmtNum(inv.amountPaid, isAr)}</td>
                        <td className="py-2.5 px-2 text-end font-medium">{balance > 0 ? <span className="text-red-500">{fmtNum(balance, isAr)}</span> : <span className="text-charcoal/40">0</span>}</td>
                        <td className="py-2.5 px-2">{statusBadge(inv.status, isAr)}</td>
                        <td className="py-2.5 px-2">
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => setExpanded(isOpen ? null : inv.id)} className="px-2 py-1 rounded-lg text-xs font-medium text-forest dark:text-forest-light hover:bg-forest/10">
                              {isOpen ? (isAr ? 'إغلاق' : 'Close') : isAr ? 'تفاصيل' : 'Details'}
                            </button>
                            <button onClick={() => printInvoice(inv)} className="px-2 py-1 rounded-lg text-xs font-medium text-charcoal/60 dark:text-ivory/60 hover:bg-charcoal/5 dark:hover:bg-ivory/10">
                              {isAr ? 'طباعة' : 'Print'}
                            </button>
                          </div>
                        </td>
                      </tr>
                      {isOpen && (
                        <tr key={inv.id + '-detail'}>
                          <td colSpan={8} className="p-4 bg-sand-50 dark:bg-charcoal space-y-3">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                              <div className="p-2 rounded-lg bg-ivory dark:bg-charcoal-light">
                                <div className="text-[10px] text-charcoal/50 dark:text-ivory/50">{isAr ? 'ضغطات متفق عليها' : 'Agreed'}</div>
                                <div className="font-bold">{fmtNum(inv.agreedClicks, isAr)} × {fmtNum(inv.agreedRate, isAr)}</div>
                              </div>
                              <div className="p-2 rounded-lg bg-ivory dark:bg-charcoal-light">
                                <div className="text-[10px] text-charcoal/50 dark:text-ivory/50">{isAr ? 'إضافية' : 'Additional'}</div>
                                <div className="font-bold">{fmtNum(inv.additionalClicks, isAr)} × {fmtNum(inv.additionalRate, isAr)}</div>
                              </div>
                              <div className="p-2 rounded-lg bg-ivory dark:bg-charcoal-light">
                                <div className="text-[10px] text-charcoal/50 dark:text-ivory/50">{isAr ? 'المجموع الفرعي' : 'Subtotal'}</div>
                                <div className="font-bold">{fmtNum(inv.subtotal, isAr)}</div>
                              </div>
                              <div className="p-2 rounded-lg bg-ivory dark:bg-charcoal-light">
                                <div className="text-[10px] text-charcoal/50 dark:text-ivory/50">{isAr ? 'الفترة' : 'Period'}</div>
                                <div className="font-bold text-xs">{inv.periodFrom ?? '—'} → {inv.periodTo ?? '—'}</div>
                              </div>
                            </div>
                            {inv.payments.length > 0 && (
                              <div>
                                <h4 className="text-xs font-semibold text-charcoal/60 dark:text-ivory/60 mb-1">{isAr ? 'الدفعات المسجّلة' : 'Recorded payments'}</h4>
                                <div className="space-y-1">
                                  {inv.payments.map((p: any) => (
                                    <div key={p.id} className="flex items-center gap-3 text-xs text-charcoal/70 dark:text-ivory/70">
                                      <span>{p.paid_at?.slice(0, 10)}</span>
                                      <b>{fmtNum(p.amount, isAr)} {isAr ? 'ر.س' : 'SAR'}</b>
                                      {p.method && <span className="text-charcoal/40">({p.method})</span>}
                                      {p.reference && <span className="text-charcoal/40" dir="ltr">{p.reference}</span>}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            <PaymentForm invoice={inv} onDone={load} />
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="mt-5 text-[11px] text-charcoal/40 dark:text-ivory/40 text-center leading-relaxed">
        {isAr
          ? 'المبالغ محسوبة من الضغطات المسجّلة فعلياً — الضغطة تعني فتح الرابط، وليست تأكيداً بمكالمة مكتملة أو رسالة مُرسلة.'
          : 'Amounts are calculated from recorded clicks — a click means the link was opened, not a completed call or sent message.'}
      </p>
    </div>
  );
}
