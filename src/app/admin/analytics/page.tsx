'use client';

import { useState, useEffect, useCallback } from 'react';
import { useApp } from '@/context/AppContext';

// ─── Types (mirror the API response) ───
interface Stats {
  total: number;
  whatsapp: number;
  phone: number;
  uniqueContacts: number;
  mostClicked: { contact: string; type: string; clicks: number } | null;
  mostEngagedPage: { url: string; clicks: number } | null;
}
interface NumberRow {
  contact: string;
  type: 'whatsapp' | 'phone';
  total: number;
  today: number;
  yesterday: number;
  last7: number;
  last30: number;
  lastClicked: string | null;
  pages: { url: string; clicks: number }[];
}
interface PageRow {
  url: string;
  title: string | null;
  whatsapp: number;
  phone: number;
  total: number;
  lastInteraction: string | null;
  topContact: { contact: string; clicks: number } | null;
}
interface SeriesPoint { date: string; whatsapp: number; phone: number; total: number }

type RangeKey = 'today' | 'yesterday' | '7d' | '30d' | 'month' | 'custom';

const RANGES: { key: RangeKey; ar: string; en: string }[] = [
  { key: 'today', ar: 'اليوم', en: 'Today' },
  { key: 'yesterday', ar: 'أمس', en: 'Yesterday' },
  { key: '7d', ar: 'آخر ٧ أيام', en: 'Last 7 days' },
  { key: '30d', ar: 'آخر ٣٠ يوم', en: 'Last 30 days' },
  { key: 'month', ar: 'هذا الشهر', en: 'This month' },
  { key: 'custom', ar: 'مدة مخصصة', en: 'Custom range' },
];

function fmtDate(iso: string | null, locale: string): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString(locale === 'ar' ? 'ar-EG' : 'en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

// ─── Lightweight SVG bar chart (no external deps) ───
function BarChart({ data, locale }: { data: SeriesPoint[]; locale: string }) {
  const max = Math.max(1, ...data.map((d) => Math.max(d.whatsapp, d.phone)));
  if (data.length === 0) {
    return <div className="h-40 flex items-center justify-center text-charcoal/40 dark:text-ivory/40 text-sm">{locale === 'ar' ? 'مفيش بيانات في المدة دي' : 'No data for this period'}</div>;
  }
  // Show at most ~30 bars
  const shown = data.slice(-30);
  const barW = 100 / (shown.length * 2);
  return (
    <div className="w-full">
      <div className="flex items-center gap-4 text-xs text-charcoal/60 dark:text-ivory/60 mb-2">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[#25D366]" />{locale === 'ar' ? 'واتساب' : 'WhatsApp'}</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-forest dark:bg-forest-light" />{locale === 'ar' ? 'اتصال' : 'Phone'}</span>
      </div>
      <div className="flex items-end gap-1 h-40 border-b border-charcoal/10 dark:border-charcoal-border">
        {shown.map((d) => (
          <div key={d.date} className="flex-1 flex flex-col justify-end gap-0.5 h-full group relative" title={`${d.date}: ${d.whatsapp} ${locale === 'ar' ? 'واتساب' : 'WA'} / ${d.phone} ${locale === 'ar' ? 'اتصال' : 'call'}`}>
            <div className="flex-1 flex flex-col justify-end gap-px">
              <div style={{ height: `${(d.whatsapp / max) * 100}%` }} className="bg-[#25D366] rounded-t-sm min-h-[1px]" />
              <div style={{ height: `${(d.phone / max) * 100}%` }} className="bg-forest dark:bg-forest-light min-h-[1px]" />
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-between text-[10px] text-charcoal/40 dark:text-ivory/40 mt-1">
        <span>{shown[0]?.date}</span>
        <span>{shown[shown.length - 1]?.date}</span>
      </div>
    </div>
  );
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function AdminAnalytics() {
  const { locale } = useApp();
  const isAr = locale === 'ar';
  const [range, setRange] = useState<RangeKey>('30d');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [stats, setStats] = useState<Stats | null>(null);
  const [byNumber, setByNumber] = useState<NumberRow[]>([]);
  const [byPage, setByPage] = useState<PageRow[]>([]);
  const [series, setSeries] = useState<SeriesPoint[]>([]);
  const [loading, setLoading] = useState(true);
  // table controls
  const [numType, setNumType] = useState<'all' | 'whatsapp' | 'phone'>('all');
  const [numSearch, setNumSearch] = useState('');
  const [numSort, setNumSort] = useState<'total' | 'today' | 'last7' | 'last30'>('total');
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ range });
    if (range === 'custom') {
      if (from) params.set('from', from);
      if (to) params.set('to', to);
    }
    const res = await fetch(`/api/admin/analytics?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      setStats(data.stats);
      setByNumber(data.byNumber);
      setByPage(data.byPage);
      setSeries(data.series);
    }
    setLoading(false);
  }, [range, from, to]);

  useEffect(() => {
    load();
  }, [load]);

  const filteredNumbers = byNumber
    .filter((n) => (numType === 'all' || n.type === numType) && (!numSearch || n.contact.includes(numSearch)))
    .sort((a, b) => b[numSort] - a[numSort]);

  const typeBadge = (t: string) =>
    t === 'whatsapp'
      ? { cls: 'bg-[#25D366]/10 text-[#25D366] dark:bg-[#25D366]/15', label: 'واتساب', labelEn: 'WhatsApp' }
      : { cls: 'bg-forest/10 text-forest dark:bg-forest-light/15 dark:text-forest-light', label: 'هاتف', labelEn: 'Phone' };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-charcoal dark:text-ivory">
            {isAr ? 'تحليلات التواصل' : 'Contact Analytics'}
          </h1>
          <p className="text-sm text-charcoal/60 dark:text-ivory/60 mt-1">
            {isAr
              ? 'تتبّع ضغطات الواتساب والهاتف. الضغطة تعني أن الزائر فتح الرابط — ليست تأكيداً لإرسال رسالة أو إتمام مكالمة.'
              : 'Tracks WhatsApp and phone link clicks. A click means the visitor opened the link — not a confirmed message or completed call.'}
          </p>
        </div>
      </div>

      {/* ─── Date filters ─── */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        {RANGES.map((r) => (
          <button
            key={r.key}
            onClick={() => setRange(r.key)}
            className={`btn-press px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              range === r.key
                ? 'bg-forest text-ivory shadow-sm'
                : 'bg-ivory dark:bg-charcoal-light text-charcoal/70 dark:text-ivory/70 border border-charcoal/10 dark:border-charcoal-border hover:border-forest/30'
            }`}
          >
            {isAr ? r.ar : r.en}
          </button>
        ))}
        {range === 'custom' && (
          <div className="flex items-center gap-2">
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-9 px-3 rounded-lg bg-sand-100 dark:bg-charcoal-light border border-charcoal/10 dark:border-charcoal-border text-sm" />
            <span className="text-charcoal/40">—</span>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-9 px-3 rounded-lg bg-sand-100 dark:bg-charcoal-light border border-charcoal/10 dark:border-charcoal-border text-sm" />
          </div>
        )}
      </div>

      {loading && !stats ? (
        <p className="text-charcoal/60 dark:text-ivory/60">{isAr ? 'جاري التحميل...' : 'Loading...'}</p>
      ) : !stats ? (
        <div className="text-center py-16 text-charcoal/50 dark:text-ivory/50">{isAr ? 'مفيش بيانات' : 'No data'}</div>
      ) : (
        <>
          {/* ─── Overview cards ─── */}
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 mb-8">
            {[
              { label: isAr ? 'ضغطات واتساب' : 'WhatsApp Clicks', value: stats.whatsapp, icon: '💬', color: 'text-[#25D366]' },
              { label: isAr ? 'ضغطات الهاتف' : 'Phone Clicks', value: stats.phone, icon: '📞', color: 'text-forest dark:text-forest-light' },
              { label: isAr ? 'إجمالي الضغطات' : 'Total Clicks', value: stats.total, icon: '📊', color: '' },
              { label: isAr ? 'أرقام التواصل' : 'Contact Numbers', value: stats.uniqueContacts, icon: '🔢', color: '' },
              { label: isAr ? 'الأكثر ضغطاً' : 'Most Clicked', value: stats.mostClicked ? stats.mostClicked.clicks : 0, sub: stats.mostClicked?.contact, icon: '🔥', color: '' },
              { label: isAr ? 'أكثر صفحة تفاعلاً' : 'Top Page', value: stats.mostEngagedPage?.clicks ?? 0, sub: stats.mostEngagedPage?.url, icon: '📄', color: '' },
            ].map((c, i) => (
              <div key={i} className="p-4 rounded-2xl bg-ivory dark:bg-charcoal-light border border-charcoal/5 dark:border-charcoal-border">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{c.icon}</span>
                  <span className="text-xs text-charcoal/50 dark:text-ivory/50 leading-tight">{c.label}</span>
                </div>
                <div className={`text-2xl font-bold ${c.color || 'text-charcoal dark:text-ivory'}`}>{c.value}</div>
                {c.sub && <div className="text-[11px] text-charcoal/40 dark:text-ivory/40 truncate mt-0.5" dir="ltr">{c.sub}</div>}
              </div>
            ))}
          </div>

          {/* ─── Charts ─── */}
          <div className="p-5 rounded-2xl bg-ivory dark:bg-charcoal-light border border-charcoal/5 dark:border-charcoal-border mb-8">
            <h2 className="font-semibold text-charcoal dark:text-ivory mb-4">
              {isAr ? 'الضغطات عبر الوقت' : 'Clicks Over Time'}
            </h2>
            <BarChart data={series} locale={locale} />
          </div>

          {/* ─── Contact numbers table ─── */}
          <div className="p-5 rounded-2xl bg-ivory dark:bg-charcoal-light border border-charcoal/5 dark:border-charcoal-border mb-8">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h2 className="font-semibold text-charcoal dark:text-ivory">
                {isAr ? 'أرقام التواصل' : 'Contact Numbers'}
              </h2>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  value={numSearch}
                  onChange={(e) => setNumSearch(e.target.value)}
                  placeholder={isAr ? 'ابحث برقم...' : 'Search number...'}
                  className="h-9 px-3 rounded-lg bg-sand-100 dark:bg-charcoal border border-charcoal/10 dark:border-charcoal-border text-sm w-40"
                />
                <select value={numType} onChange={(e) => setNumType(e.target.value as any)} className="h-9 px-3 rounded-lg bg-sand-100 dark:bg-charcoal border border-charcoal/10 dark:border-charcoal-border text-sm">
                  <option value="all">{isAr ? 'الكل' : 'All types'}</option>
                  <option value="whatsapp">{isAr ? 'واتساب' : 'WhatsApp'}</option>
                  <option value="phone">{isAr ? 'هاتف' : 'Phone'}</option>
                </select>
                <select value={numSort} onChange={(e) => setNumSort(e.target.value as any)} className="h-9 px-3 rounded-lg bg-sand-100 dark:bg-charcoal border border-charcoal/10 dark:border-charcoal-border text-sm">
                  <option value="total">{isAr ? 'ترتيب: الإجمالي' : 'Sort: Total'}</option>
                  <option value="today">{isAr ? 'ترتيب: اليوم' : 'Sort: Today'}</option>
                  <option value="last7">{isAr ? 'ترتيب: ٧ أيام' : 'Sort: 7 days'}</option>
                  <option value="last30">{isAr ? 'ترتيب: ٣٠ يوم' : 'Sort: 30 days'}</option>
                </select>
              </div>
            </div>
            {filteredNumbers.length === 0 ? (
              <div className="text-center py-10 text-charcoal/50 dark:text-ivory/50 text-sm">{isAr ? 'مفيش أرقام مطابقة' : 'No matching numbers'}</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-charcoal/50 dark:text-ivory/50 text-xs border-b border-charcoal/10 dark:border-charcoal-border">
                      <th className="text-start p-2 font-medium">{isAr ? 'الرقم' : 'Number'}</th>
                      <th className="text-start p-2 font-medium">{isAr ? 'النوع' : 'Type'}</th>
                      <th className="text-end p-2 font-medium">{isAr ? 'الإجمالي' : 'Total'}</th>
                      <th className="text-end p-2 font-medium">{isAr ? 'اليوم' : 'Today'}</th>
                      <th className="text-end p-2 font-medium">{isAr ? 'أمس' : 'Yest.'}</th>
                      <th className="text-end p-2 font-medium">{isAr ? '٧ أيام' : '7d'}</th>
                      <th className="text-end p-2 font-medium">{isAr ? 'آخر ضغطة' : 'Last click'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredNumbers.map((n) => {
                      const b = typeBadge(n.type);
                      const key = n.contact + n.type;
                      const isOpen = expanded === key;
                      return (
                        <>
                          <tr key={key} className="border-b border-charcoal/5 dark:border-charcoal-border/50 hover:bg-sand-50 dark:hover:bg-charcoal-elevated cursor-pointer" onClick={() => setExpanded(isOpen ? null : key)}>
                            <td className="p-2 font-medium text-charcoal dark:text-ivory" dir="ltr">{n.contact}</td>
                            <td className="p-2"><span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${b.cls}`}>{isAr ? b.label : b.labelEn}</span></td>
                            <td className="p-2 text-end font-bold text-charcoal dark:text-ivory">{n.total}</td>
                            <td className="p-2 text-end text-charcoal/70 dark:text-ivory/70">{n.today}</td>
                            <td className="p-2 text-end text-charcoal/70 dark:text-ivory/70">{n.yesterday}</td>
                            <td className="p-2 text-end text-charcoal/70 dark:text-ivory/70">{n.last7}</td>
                            <td className="p-2 text-end text-charcoal/50 dark:text-ivory/50 text-xs">{fmtDate(n.lastClicked, locale)}</td>
                          </tr>
                          {isOpen && (
                            <tr key={key + '-detail'}>
                              <td colSpan={7} className="p-3 bg-sand-50 dark:bg-charcoal">
                                <div className="text-xs font-medium text-charcoal/60 dark:text-ivory/60 mb-2">{isAr ? 'الصفحات المرتبطة' : 'Associated pages'}</div>
                                {n.pages.length === 0 ? (
                                  <div className="text-xs text-charcoal/40">{isAr ? 'مفيش' : 'None'}</div>
                                ) : (
                                  <div className="flex flex-wrap gap-2">
                                    {n.pages.map((p) => (
                                      <span key={p.url} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-ivory dark:bg-charcoal-light border border-charcoal/10 dark:border-charcoal-border text-xs">
                                        <span dir="ltr">{p.url}</span>
                                        <span className="font-bold text-forest dark:text-forest-light">{p.clicks}</span>
                                      </span>
                                    ))}
                                  </div>
                                )}
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

          {/* ─── Page-level table ─── */}
          <div className="p-5 rounded-2xl bg-ivory dark:bg-charcoal-light border border-charcoal/5 dark:border-charcoal-border">
            <h2 className="font-semibold text-charcoal dark:text-ivory mb-4">
              {isAr ? 'تحليلات الصفحات' : 'Page Analytics'}
            </h2>
            {byPage.length === 0 ? (
              <div className="text-center py-10 text-charcoal/50 dark:text-ivory/50 text-sm">{isAr ? 'مفيش بيانات' : 'No data'}</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-charcoal/50 dark:text-ivory/50 text-xs border-b border-charcoal/10 dark:border-charcoal-border">
                      <th className="text-start p-2 font-medium">{isAr ? 'الصفحة' : 'Page'}</th>
                      <th className="text-end p-2 font-medium">{isAr ? 'واتساب' : 'WhatsApp'}</th>
                      <th className="text-end p-2 font-medium">{isAr ? 'هاتف' : 'Phone'}</th>
                      <th className="text-end p-2 font-medium">{isAr ? 'الإجمالي' : 'Total'}</th>
                      <th className="text-start p-2 font-medium">{isAr ? 'الأكثر ضغطاً' : 'Top number'}</th>
                      <th className="text-start p-2 font-medium">{isAr ? 'آخر تفاعل' : 'Last interaction'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {byPage.map((p) => (
                      <tr key={p.url} className="border-b border-charcoal/5 dark:border-charcoal-border/50">
                        <td className="p-2 text-charcoal dark:text-ivory">
                          <div dir="ltr" className="font-medium">{p.url}</div>
                          {p.title && <div className="text-xs text-charcoal/40 dark:text-ivory/40 truncate max-w-[200px]">{p.title}</div>}
                        </td>
                        <td className="p-2 text-end text-[#25D366] font-medium">{p.whatsapp}</td>
                        <td className="p-2 text-end text-forest dark:text-forest-light font-medium">{p.phone}</td>
                        <td className="p-2 text-end font-bold text-charcoal dark:text-ivory">{p.total}</td>
                        <td className="p-2 text-charcoal/70 dark:text-ivory/70 text-xs" dir="ltr">{p.topContact ? `${p.topContact.contact} (${p.topContact.clicks})` : '—'}</td>
                        <td className="p-2 text-charcoal/50 dark:text-ivory/50 text-xs">{fmtDate(p.lastInteraction, locale)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
