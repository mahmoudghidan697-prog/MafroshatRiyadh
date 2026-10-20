'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { useToast } from '@/components/admin/Toast';

interface ContactInfo {
  key: string;
  type: 'whatsapp' | 'phone';
  number: string;
  name: { ar: string; en: string };
  location: { ar: string; en: string };
  active: boolean;
}

interface Stats {
  total: number;
  whatsapp: number;
  phone: number;
  today: number;
  yesterday: number;
  last7: number;
  last30: number;
  allTime: number;
  uniqueVisitors: number;
  firstClicked: string | null;
  lastClicked: string | null;
}

interface PageRow { url: string; title: string | null; clicks: number }
interface SeriesPoint { date: string; clicks: number }
interface HistoryRow {
  id: number;
  type: string;
  contact: string;
  pageUrl: string;
  pageTitle: string | null;
  sessionId: string | null;
  deviceType: string | null;
  productSlug: string | null;
  createdAt: string;
}

type RangeKey = 'today' | 'yesterday' | '7d' | '30d' | 'month' | 'custom';

const RANGES: { key: RangeKey; ar: string; en: string }[] = [
  { key: 'today', ar: 'اليوم', en: 'Today' },
  { key: 'yesterday', ar: 'أمس', en: 'Yesterday' },
  { key: '7d', ar: 'آخر ٧ أيام', en: 'Last 7 days' },
  { key: '30d', ar: 'آخر ٣٠ يوم', en: 'Last 30 days' },
  { key: 'month', ar: 'هذا الشهر', en: 'This month' },
  { key: 'custom', ar: 'مدة مخصصة', en: 'Custom range' },
];

function fmtNum(n: number, isAr: boolean): string {
  if (!isAr) return n.toLocaleString('en-US');
  return n.toLocaleString('ar-EG');
}
function fmtDate(s: string | null, locale: string): string {
  if (!s) return '—';
  try {
    return new Date(s).toLocaleString(locale === 'ar' ? 'ar-EG' : 'en-US', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  } catch { return s; }
}
function fmtDay(day: string, locale: string): string {
  try {
    return new Date(day + 'T00:00:00').toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US', { month: 'short', day: 'numeric' });
  } catch { return day; }
}

function SeriesChart({ data, locale }: { data: SeriesPoint[]; locale: string }) {
  const isAr = locale === 'ar';
  const [hover, setHover] = useState<number | null>(null);
  if (data.length === 0) {
    return <div className="h-48 flex items-center justify-center text-charcoal/40 dark:text-ivory/40 text-sm">{isAr ? 'مفيش بيانات في المدة دي' : 'No data for this period'}</div>;
  }
  const W = 720, H = 200, padL = 36, padR = 12, padT = 12, padB = 28;
  const max = Math.max(1, ...data.map((d) => d.clicks));
  const niceMax = Math.ceil(max / 5) * 5 || 5;
  const x = (i: number) => padL + (i / Math.max(1, data.length - 1)) * (W - padL - padR);
  const y = (v: number) => padT + (1 - v / niceMax) * (H - padT - padB);
  const path = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(d.clicks).toFixed(1)}`).join(' ');
  const tickIdx = data.length <= 1 ? [0] : [0, Math.floor(data.length / 2), data.length - 1];

  return (
    <div className="w-full">
      <div className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-48" preserveAspectRatio="none" onMouseLeave={() => setHover(null)}>
          {[0, 0.25, 0.5, 0.75, 1].map((f) => (
            <line key={f} x1={padL} x2={W - padR} y1={y(niceMax * f)} y2={y(niceMax * f)} className="stroke-charcoal/10 dark:stroke-ivory/10" strokeWidth="1" />
          ))}
          <path d={path} fill="none" className="stroke-forest" strokeWidth="2" />
          {data.map((d, i) => (
            <circle key={i} cx={x(i)} cy={y(d.clicks)} r={hover === i ? 4 : 2.5}
              className="fill-forest cursor-pointer" onMouseEnter={() => setHover(i)} />
          ))}
          {hover !== null && (
            <g>
              <line x1={x(hover)} x2={x(hover)} y1={padT} y2={H - padB} className="stroke-charcoal/30 dark:stroke-ivory/30" strokeWidth="1" strokeDasharray="3 3" />
              <rect x={x(hover) - 46} y={padT - 2} width="92" height="26" rx="4" className="fill-charcoal dark:fill-ivory" />
              <text x={x(hover)} y={padT + 14} textAnchor="middle" className="fill-ivory dark:fill-charcoal" fontSize="11" fontWeight="600">
                {fmtNum(data[hover].clicks, isAr)} · {fmtDay(data[hover].date, locale)}
              </text>
            </g>
          )}
          {tickIdx.map((i) => (
            <text key={i} x={x(i)} y={H - 8} textAnchor="middle" className="fill-charcoal/50 dark:fill-ivory/50" fontSize="10">
              {fmtDay(data[i].date, locale)}
            </text>
          ))}
          {[0, 0.5, 1].map((f) => (
            <text key={f} x={padL - 6} y={y(niceMax * f) + 3} textAnchor="end" className="fill-charcoal/50 dark:fill-ivory/50" fontSize="9">
              {Math.round(niceMax * f)}
            </text>
          ))}
        </svg>
      </div>
    </div>
  );
}

export default function ContactAnalyticsPage() {
  const { locale } = useApp();
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const key = decodeURIComponent(String(params?.key ?? ''));
  const isAr = locale === 'ar';

  const [range, setRange] = useState<RangeKey>('30d');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [historyOffset, setHistoryOffset] = useState(0);
  const [sortDesc, setSortDesc] = useState(true);
  const PAGE_SIZE = 25;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ range, limit: String(PAGE_SIZE), offset: String(historyOffset) });
      if (range === 'custom') {
        if (from) params.set('from', new Date(from).toISOString());
        if (to) params.set('to', new Date(to + 'T23:59:59').toISOString());
      }
      const res = await fetch(`/api/admin/contacts/${encodeURIComponent(key)}/analytics?${params.toString()}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || (isAr ? 'فشل التحميل' : 'Failed to load'));
      }
      const json = await res.json();
      setData(json);
    } catch (e: any) {
      setError(e?.message ?? (isAr ? 'خطأ' : 'Error'));
    } finally {
      setLoading(false);
    }
  }, [key, range, from, to, historyOffset, isAr]);

  useEffect(() => { load(); }, [load]);

  const contact: ContactInfo | null = data?.contact ?? null;
  const stats: Stats | null = data?.stats ?? null;
  const pages: PageRow[] = data?.pages ?? [];
  const series: SeriesPoint[] = data?.series ?? [];
  const history: HistoryRow[] = useMemo(() => {
    const h = data?.history ?? [];
    return sortDesc ? h : [...h].reverse();
  }, [data?.history, sortDesc]);
  const historyTotal: number = data?.historyTotal ?? 0;

  const exportCsv = () => {
    if (!history.length) return;
    const header = ['id', 'createdAt', 'type', 'contact', 'deviceType', 'pageUrl', 'productSlug', 'sessionId'];
    const rows = history.map((h) => [h.id, h.createdAt, h.type, h.contact, h.deviceType ?? '', h.pageUrl, h.productSlug ?? '', h.sessionId ?? '']);
    const csv = [header, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contact-analytics-${key}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      {/* Back + header */}
      <div className="mb-6 flex items-center gap-3 flex-wrap">
        <button
          onClick={() => router.push('/admin/contacts')}
          className="btn-press h-9 px-3 rounded-lg border border-charcoal/15 dark:border-charcoal-border text-sm font-medium text-charcoal dark:text-ivory hover:border-forest dark:hover:border-forest-light"
        >
          ← {isAr ? 'رجوع إلى أيقونات التواصل' : 'Back to Contact Icons'}
        </button>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-charcoal dark:text-ivory">
          {isAr ? 'تحليلات أيقونة التواصل' : 'Contact Icon Analytics'}
        </h1>
        {contact && (
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
            <span className="font-semibold text-charcoal dark:text-ivory">
              {isAr ? contact.name.ar : contact.name.en}
            </span>
            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${contact.type === 'whatsapp' ? 'bg-[#25D366]/10 text-[#25D366]' : 'bg-forest/10 text-forest dark:text-forest-light'}`}>
              {contact.type === 'whatsapp' ? 'واتساب' : 'هاتف'}
            </span>
            <span className="font-mono text-charcoal/60 dark:text-ivory/60" dir="ltr">{contact.number}</span>
            {!contact.active && (
              <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-charcoal/10 text-charcoal/50 dark:bg-white/10 dark:text-ivory/50">
                {isAr ? 'معطّلة' : 'Disabled'}
              </span>
            )}
          </div>
        )}
        <p className="text-xs text-charcoal/50 dark:text-ivory/50 mt-1" dir="ltr">
          key: {key}
        </p>
      </div>

      {/* Range filters */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        {RANGES.map((r) => (
          <button
            key={r.key}
            onClick={() => { setRange(r.key); setHistoryOffset(0); }}
            className={`btn-press h-9 px-3 rounded-lg text-sm font-medium border transition-colors ${range === r.key ? 'bg-forest text-ivory border-forest' : 'border-charcoal/15 dark:border-charcoal-border text-charcoal dark:text-ivory hover:border-forest'}`}
          >
            {isAr ? r.ar : r.en}
          </button>
        ))}
        {range === 'custom' && (
          <div className="flex items-center gap-2">
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-9 px-2 rounded-lg border border-charcoal/15 dark:border-charcoal-border bg-ivory dark:bg-charcoal text-sm" />
            <span className="text-charcoal/50">→</span>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-9 px-2 rounded-lg border border-charcoal/15 dark:border-charcoal-border bg-ivory dark:bg-charcoal text-sm" />
            <button onClick={() => { setHistoryOffset(0); load(); }} className="btn-press h-9 px-3 rounded-lg bg-forest text-ivory text-sm font-medium">Apply</button>
          </div>
        )}
      </div>

      {loading && (
        <p className="text-charcoal/60 dark:text-ivory/60">{isAr ? 'جاري التحميل...' : 'Loading...'}</p>
      )}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm">
          {error}
        </div>
      )}

      {!loading && !error && data && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
            {[
              { label: isAr ? 'إجمالي النقرات' : 'Total clicks', value: stats?.total ?? 0 },
              { label: isAr ? 'اليوم' : 'Today', value: stats?.today ?? 0 },
              { label: isAr ? 'أمس' : 'Yesterday', value: stats?.yesterday ?? 0 },
              { label: isAr ? 'آخر ٧ أيام' : 'Last 7 days', value: stats?.last7 ?? 0 },
              { label: isAr ? 'آخر ٣٠ يوم' : 'Last 30 days', value: stats?.last30 ?? 0 },
              { label: isAr ? 'زوار مميزون' : 'Unique visitors', value: stats?.uniqueVisitors ?? 0 },
            ].map((c, i) => (
              <div key={i} className="p-4 rounded-2xl bg-ivory dark:bg-charcoal-light border border-charcoal/5 dark:border-charcoal-border">
                <div className="text-xs text-charcoal/50 dark:text-ivory/50 mb-1">{c.label}</div>
                <div className="text-2xl font-bold text-charcoal dark:text-ivory">{fmtNum(c.value, isAr)}</div>
              </div>
            ))}
          </div>

          {/* All-time + first/last */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
            <div className="p-4 rounded-2xl bg-ivory dark:bg-charcoal-light border border-charcoal/5 dark:border-charcoal-border">
              <div className="text-xs text-charcoal/50 dark:text-ivory/50 mb-1">{isAr ? 'كل الأوقات' : 'All time'}</div>
              <div className="text-2xl font-bold text-charcoal dark:text-ivory">{fmtNum(stats?.allTime ?? 0, isAr)}</div>
            </div>
            <div className="p-4 rounded-2xl bg-ivory dark:bg-charcoal-light border border-charcoal/5 dark:border-charcoal-border">
              <div className="text-xs text-charcoal/50 dark:text-ivory/50 mb-1">{isAr ? 'أول نقرة' : 'First click'}</div>
              <div className="text-sm font-medium text-charcoal dark:text-ivory">{fmtDate(stats?.firstClicked ?? null, locale)}</div>
            </div>
            <div className="p-4 rounded-2xl bg-ivory dark:bg-charcoal-light border border-charcoal/5 dark:border-charcoal-border">
              <div className="text-xs text-charcoal/50 dark:text-ivory/50 mb-1">{isAr ? 'آخر نقرة' : 'Last click'}</div>
              <div className="text-sm font-medium text-charcoal dark:text-ivory">{fmtDate(stats?.lastClicked ?? null, locale)}</div>
            </div>
          </div>

          {/* Daily chart */}
          <div className="p-4 rounded-2xl bg-ivory dark:bg-charcoal-light border border-charcoal/5 dark:border-charcoal-border mb-6">
            <h2 className="text-sm font-semibold text-charcoal dark:text-ivory mb-3">{isAr ? 'النقرات يومياً' : 'Daily clicks'}</h2>
            <SeriesChart data={series} locale={locale} />
          </div>

          {/* Referring pages */}
          <div className="p-4 rounded-2xl bg-ivory dark:bg-charcoal-light border border-charcoal/5 dark:border-charcoal-border mb-6">
            <h2 className="text-sm font-semibold text-charcoal dark:text-ivory mb-3">{isAr ? 'الصفحات المرجعية' : 'Referring pages'}</h2>
            {pages.length === 0 ? (
              <p className="text-sm text-charcoal/40 dark:text-ivory/40">{isAr ? 'مفيش بيانات' : 'No data'}</p>
            ) : (
              <div className="space-y-2">
                {pages.map((p, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-charcoal dark:text-ivory truncate">{p.title || p.url}</div>
                      <div className="text-xs text-charcoal/45 dark:text-ivory/45 truncate" dir="ltr">{p.url}</div>
                    </div>
                    <div className="font-mono font-semibold text-charcoal dark:text-ivory ms-3">{fmtNum(p.clicks, isAr)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* History table */}
          <div className="p-4 rounded-2xl bg-ivory dark:bg-charcoal-light border border-charcoal/5 dark:border-charcoal-border">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <h2 className="text-sm font-semibold text-charcoal dark:text-ivory">
                {isAr ? 'سجل النقرات' : 'Click history'} ({fmtNum(historyTotal, isAr)})
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSortDesc((v) => !v)}
                  className="btn-press h-8 px-3 rounded-lg border border-charcoal/15 dark:border-charcoal-border text-xs font-medium text-charcoal dark:text-ivory"
                >
                  {sortDesc ? (isAr ? 'الأحدث أولاً' : 'Newest first') : (isAr ? 'الأقدم أولاً' : 'Oldest first')}
                </button>
                <button
                  onClick={exportCsv}
                  className="btn-press h-8 px-3 rounded-lg border border-charcoal/15 dark:border-charcoal-border text-xs font-medium text-charcoal dark:text-ivory"
                >
                  {isAr ? 'تصدير CSV' : 'Export CSV'}
                </button>
              </div>
            </div>

            {history.length === 0 ? (
              <p className="text-sm text-charcoal/40 dark:text-ivory/40 py-8 text-center">
                {isAr ? 'مفيش نقرات في المدة دي' : 'No clicks in this period'}
              </p>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs text-charcoal/50 dark:text-ivory/50 border-b border-charcoal/10 dark:border-charcoal-border">
                        <th className="text-start py-2 px-2">{isAr ? 'التاريخ' : 'Date'}</th>
                        <th className="text-start py-2 px-2">{isAr ? 'النوع' : 'Type'}</th>
                        <th className="text-start py-2 px-2">{isAr ? 'الرقم' : 'Number'}</th>
                        <th className="text-start py-2 px-2">{isAr ? 'الجهاز' : 'Device'}</th>
                        <th className="text-start py-2 px-2">{isAr ? 'الصفحة' : 'Page'}</th>
                        <th className="text-start py-2 px-2">{isAr ? 'المنتج' : 'Product'}</th>
                        <th className="text-start py-2 px-2">{isAr ? 'الجلسة' : 'Session'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((h) => (
                        <tr key={h.id} className="border-b border-charcoal/5 dark:border-charcoal-border/50">
                          <td className="py-2 px-2 whitespace-nowrap text-charcoal dark:text-ivory">{fmtDate(h.createdAt, locale)}</td>
                          <td className="py-2 px-2">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${h.type === 'whatsapp' ? 'bg-[#25D366]/10 text-[#25D366]' : 'bg-forest/10 text-forest dark:text-forest-light'}`}>
                              {h.type === 'whatsapp' ? 'واتساب' : 'هاتف'}
                            </span>
                          </td>
                          <td className="py-2 px-2 font-mono text-charcoal dark:text-ivory" dir="ltr">{h.contact}</td>
                          <td className="py-2 px-2 text-charcoal/60 dark:text-ivory/60">{h.deviceType || '—'}</td>
                          <td className="py-2 px-2 text-charcoal/60 dark:text-ivory/60 truncate max-w-[160px]" title={h.pageUrl}>{h.pageTitle || h.pageUrl}</td>
                          <td className="py-2 px-2 text-charcoal/60 dark:text-ivory/60">{h.productSlug || '—'}</td>
                          <td className="py-2 px-2 font-mono text-xs text-charcoal/40 dark:text-ivory/40 truncate max-w-[120px]">{h.sessionId || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between mt-4 text-sm">
                  <button
                    disabled={historyOffset === 0}
                    onClick={() => setHistoryOffset((o) => Math.max(0, o - PAGE_SIZE))}
                    className="btn-press h-8 px-3 rounded-lg border border-charcoal/15 dark:border-charcoal-border text-xs font-medium text-charcoal dark:text-ivory disabled:opacity-40"
                  >
                    {isAr ? 'السابق' : 'Prev'}
                  </button>
                  <span className="text-charcoal/50 dark:text-ivory/50 text-xs">
                    {historyOffset + 1}–{Math.min(historyOffset + PAGE_SIZE, historyTotal)} / {fmtNum(historyTotal, isAr)}
                  </span>
                  <button
                    disabled={historyOffset + PAGE_SIZE >= historyTotal}
                    onClick={() => setHistoryOffset((o) => o + PAGE_SIZE)}
                    className="btn-press h-8 px-3 rounded-lg border border-charcoal/15 dark:border-charcoal-border text-xs font-medium text-charcoal dark:text-ivory disabled:opacity-40"
                  >
                    {isAr ? 'التالي' : 'Next'}
                  </button>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}