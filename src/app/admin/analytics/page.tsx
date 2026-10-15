'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { WhatsAppIcon, PhoneIcon, SearchIcon } from '@/components/Icons';

// ─── Types (mirror the API response) ───
interface PrevPeriod {
  total: number;
  whatsapp: number;
  phone: number;
  uniqueContacts: number;
  totalPct: number | null;
  whatsappPct: number | null;
  phonePct: number | null;
  uniqueContactsPct: number | null;
}
interface Stats {
  total: number;
  whatsapp: number;
  phone: number;
  uniqueContacts: number;
  mostClicked: { contact: string; type: string; clicks: number } | null;
  mostEngagedPage: { url: string; clicks: number } | null;
  from: string;
  to: string;
  prev: PrevPeriod | null;
}
interface NumberRow {
  contact: string;
  type: 'whatsapp' | 'phone';
  total: number;
  today: number;
  yesterday: number;
  last7: number;
  last30: number;
  allTime: number;
  firstClicked: string | null;
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

// Arabic-Indic digit formatting for AR locale
function fmtNum(n: number, isAr: boolean): string {
  if (!isAr) return n.toLocaleString('en-US');
  return n.toLocaleString('ar-EG');
}

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

function fmtDay(day: string, locale: string): string {
  try {
    return new Date(day + 'T00:00:00').toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US', { month: 'short', day: 'numeric' });
  } catch {
    return day;
  }
}

/** Pretty-print a digits-only phone number (9665 12 345 6789). */
function prettyNumber(raw: string): string {
  const d = raw.replace(/[^\d]/g, '');
  if (d.length === 12) return `${d.slice(0, 4)} ${d.slice(4, 6)} ${d.slice(6, 9)} ${d.slice(9)}`;
  if (d.length === 10) return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
  return raw;
}

// ─── Period-over-period delta badge ───
function DeltaBadge({ pct, isAr }: { pct: number | null; isAr: boolean }) {
  if (pct === null) return null;
  const up = pct >= 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[11px] font-semibold ${up ? 'text-[#25D366]' : 'text-red-500'}`}>
      {up ? '↑' : '↓'} {Math.abs(pct)}%
    </span>
  );
}

// ─── CSS-only tooltip ───
function InfoTip({ text }: { text: string }) {
  return (
    <span className="relative inline-flex items-center group cursor-help align-middle">
      <svg className="w-3.5 h-3.5 text-charcoal/30 dark:text-ivory/30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 16v-4M12 8h.01" strokeLinecap="round" />
      </svg>
      <span className="pointer-events-none absolute bottom-full start-1/2 -translate-x-1/2 mb-1.5 w-56 p-2 rounded-lg bg-charcoal dark:bg-charcoal-elevated text-ivory text-[11px] leading-snug opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-lg text-center">
        {text}
      </span>
    </span>
  );
}

// ─── Activity chart: SVG line chart with hover tooltips ───
function ActivityChart({ data, locale }: { data: SeriesPoint[]; locale: string }) {
  const isAr = locale === 'ar';
  const [hover, setHover] = useState<number | null>(null);

  if (data.length === 0) {
    return <div className="h-56 flex items-center justify-center text-charcoal/40 dark:text-ivory/40 text-sm">{isAr ? 'مفيش بيانات في المدة دي' : 'No data for this period'}</div>;
  }

  const W = 720;
  const H = 220;
  const padL = 36;
  const padR = 12;
  const padT = 12;
  const padB = 28;
  const max = Math.max(1, ...data.map((d) => Math.max(d.whatsapp, d.phone)));
  const niceMax = Math.ceil(max / 5) * 5 || 5;

  const x = (i: number) => padL + (i / Math.max(1, data.length - 1)) * (W - padL - padR);
  const y = (v: number) => padT + (1 - v / niceMax) * (H - padT - padB);

  const waPath = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(d.whatsapp).toFixed(1)}`).join(' ');
  const phPath = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(d.phone).toFixed(1)}`).join(' ');
  const waArea = `${waPath} L${x(data.length - 1).toFixed(1)},${(H - padB).toFixed(1)} L${padL},${(H - padB).toFixed(1)} Z`;
  const tickIdx = data.length <= 1 ? [0] : [0, Math.floor(data.length / 2), data.length - 1];

  return (
    <div className="w-full">
      <div className="flex items-center gap-4 text-xs text-charcoal/60 dark:text-ivory/60 mb-3">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#25D366]" />{isAr ? 'واتساب' : 'WhatsApp'}</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-forest dark:bg-forest-light" />{isAr ? 'هاتف' : 'Phone'}</span>
      </div>
      <div className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-56" preserveAspectRatio="none" onMouseLeave={() => setHover(null)}>
          {[0, 0.25, 0.5, 0.75, 1].map((f) => (
            <line key={f} x1={padL} x2={W - padR} y1={y(niceMax * f)} y2={y(niceMax * f)} className="stroke-charcoal/10 dark:stroke-ivory/10" strokeWidth="1" />
          ))}
          {[0, 0.5, 1].map((f) => (
            <text key={f} x={padL - 6} y={y(niceMax * f) + 4} textAnchor="end" className="fill-charcoal/35 dark:fill-ivory/35 text-[10px]">{Math.round(niceMax * f)}</text>
          ))}
          <path d={waArea} className="fill-[#25D366]/10" />
          <path d={phPath} className="stroke-forest dark:stroke-forest-light" strokeWidth="2.5" fill="none" strokeLinejoin="round" strokeLinecap="round" />
          <path d={waPath} className="stroke-[#25D366]" strokeWidth="2.5" fill="none" strokeLinejoin="round" strokeLinecap="round" />
          {data.map((d, i) => (
            <g key={d.date}>
              <rect x={x(i) - 8} y={padT} width={16} height={H - padT - padB} fill="transparent" onMouseEnter={() => setHover(i)} />
              {hover === i && (
                <>
                  <line x1={x(i)} x2={x(i)} y1={padT} y2={H - padB} className="stroke-charcoal/20 dark:stroke-ivory/20" strokeWidth="1" strokeDasharray="3 3" />
                  <circle cx={x(i)} cy={y(d.whatsapp)} r="4.5" className="fill-[#25D366] stroke-white dark:stroke-charcoal" strokeWidth="2" />
                  <circle cx={x(i)} cy={y(d.phone)} r="4.5" className="fill-forest dark:fill-forest-light stroke-white dark:stroke-charcoal" strokeWidth="2" />
                </>
              )}
            </g>
          ))}
          {tickIdx.map((i) => (
            <text key={i} x={x(i)} y={H - 8} textAnchor={i === 0 ? 'start' : i === data.length - 1 ? 'end' : 'middle'} className="fill-charcoal/35 dark:fill-ivory/35 text-[10px]">{fmtDay(data[i].date, locale)}</text>
          ))}
        </svg>
        {hover !== null && data[hover] && (
          <div
            className="absolute pointer-events-none z-10 px-3 py-2 rounded-lg bg-charcoal dark:bg-charcoal-elevated text-ivory text-xs shadow-lg whitespace-nowrap"
            style={{ left: `${(x(hover) / W) * 100}%`, top: 0, transform: `translateX(${hover > data.length / 2 ? '-90%' : '-10%'})` }}
          >
            <div className="font-medium mb-1">{fmtDay(data[hover].date, locale)}</div>
            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#25D366]" />{isAr ? 'واتساب' : 'WhatsApp'}: <b>{fmtNum(data[hover].whatsapp, isAr)}</b></div>
            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-forest" />{isAr ? 'هاتف' : 'Phone'}: <b>{fmtNum(data[hover].phone, isAr)}</b></div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Per-number detail slide-over ───
function NumberDetailPanel({
  contact, type, range, from, to, locale, onClose,
}: {
  contact: string;
  type: 'whatsapp' | 'phone';
  range: RangeKey;
  from: string;
  to: string;
  locale: string;
  onClose: () => void;
}) {
  const isAr = locale === 'ar';
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const params = new URLSearchParams({ contact, type, range });
    if (range === 'custom') {
      if (from) params.set('from', from);
      if (to) params.set('to', to);
    }
    fetch(`/api/admin/analytics/number?${params.toString()}`)
      .then((r) => r.json())
      .then((j) => { if (!cancelled) { setData(j); setLoading(false); } })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [contact, type, range, from, to]);

  const row = data?.row;

  return (
    <div className="fixed inset-0 z-50 flex" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="absolute inset-0 bg-charcoal/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative ms-auto w-full max-w-md h-full bg-ivory dark:bg-charcoal-light border-s border-charcoal/10 dark:border-charcoal-border shadow-2xl overflow-y-auto">
        <div className="sticky top-0 bg-ivory dark:bg-charcoal-light border-b border-charcoal/10 dark:border-charcoal-border p-5 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`w-7 h-7 rounded-lg flex items-center justify-center ${type === 'whatsapp' ? 'bg-[#25D366]/10 text-[#25D366]' : 'bg-forest/10 text-forest dark:text-forest-light'}`}>
                {type === 'whatsapp' ? <WhatsAppIcon className="w-4 h-4" /> : <PhoneIcon className="w-4 h-4" />}
              </span>
              <span className="font-bold text-charcoal dark:text-ivory" dir="ltr">{prettyNumber(contact)}</span>
            </div>
            <p className="text-xs text-charcoal/50 dark:text-ivory/50">
              {type === 'whatsapp' ? (isAr ? 'واتساب' : 'WhatsApp') : (isAr ? 'هاتف' : 'Phone')}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-sand-100 dark:hover:bg-charcoal flex items-center justify-center text-charcoal/60 dark:text-ivory/60" aria-label={isAr ? 'إغلاق' : 'Close'}>
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>

        {loading ? (
          <div className="p-5 space-y-3">
            {[1, 2, 3, 4].map((i) => <div key={i} className="h-12 rounded-xl bg-sand-100 dark:bg-charcoal animate-pulse" />)}
          </div>
        ) : !row ? (
          <div className="p-8 text-center text-charcoal/50 dark:text-ivory/50 text-sm">
            {isAr ? 'مفيش ضغطات للرقم ده في المدة المحددة' : 'No clicks for this number in the selected period'}
          </div>
        ) : (
          <div className="p-5 space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-ivory dark:bg-charcoal border border-charcoal/5 dark:border-charcoal-border">
                <div className="text-[11px] text-charcoal/50 dark:text-ivory/50 mb-1">{isAr ? 'ضغطات المدة' : 'Period clicks'}</div>
                <div className="text-xl font-bold text-charcoal dark:text-ivory">{fmtNum(row.total, isAr)}</div>
              </div>
              <div className="p-3 rounded-xl bg-ivory dark:bg-charcoal border border-charcoal/5 dark:border-charcoal-border">
                <div className="text-[11px] text-charcoal/50 dark:text-ivory/50 mb-1">{isAr ? 'الإجمالي التاريخي' : 'All-time'}</div>
                <div className="text-xl font-bold text-charcoal dark:text-ivory">{fmtNum(row.allTime, isAr)}</div>
              </div>
              <div className="p-3 rounded-xl bg-ivory dark:bg-charcoal border border-charcoal/5 dark:border-charcoal-border">
                <div className="text-[11px] text-charcoal/50 dark:text-ivory/50 mb-1">{isAr ? 'أول ضغطة' : 'First click'}</div>
                <div className="text-sm font-medium text-charcoal dark:text-ivory">{fmtDate(row.firstClicked, locale)}</div>
              </div>
              <div className="p-3 rounded-xl bg-ivory dark:bg-charcoal border border-charcoal/5 dark:border-charcoal-border">
                <div className="text-[11px] text-charcoal/50 dark:text-ivory/50 mb-1">{isAr ? 'آخر ضغطة' : 'Last click'}</div>
                <div className="text-sm font-medium text-charcoal dark:text-ivory">{fmtDate(row.lastClicked, locale)}</div>
              </div>
            </div>

            <p className="text-[11px] text-charcoal/40 dark:text-ivory/40 leading-snug p-3 rounded-lg bg-sand-50 dark:bg-charcoal">
              {isAr
                ? 'الضغطة تعني أن الزائر فتح الرابط — ليست تأكيداً بإتمام مكالمة أو إرسال رسالة.'
                : 'A click means the visitor opened the link — not a confirmed call or delivered message.'}
            </p>

            {data?.daily?.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-charcoal dark:text-ivory mb-2">{isAr ? 'الضغطات اليومية' : 'Daily clicks'}</h3>
                <div className="flex items-end gap-1 h-24">
                  {data.daily.map((d: any) => {
                    const mx = Math.max(1, ...data.daily.map((x: any) => x.clicks));
                    return (
                      <div key={d.date} className="flex-1 flex flex-col items-center gap-1" title={`${fmtDay(d.date, locale)}: ${d.clicks}`}>
                        <div style={{ height: `${(d.clicks / mx) * 100}%` }} className={`w-full rounded-t-sm min-h-[2px] ${type === 'whatsapp' ? 'bg-[#25D366]' : 'bg-forest dark:bg-forest-light'}`} />
                        <span className="text-[8px] text-charcoal/40 dark:text-ivory/40">{fmtDay(d.date, locale).split(' ')[0]}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div>
              <h3 className="text-sm font-semibold text-charcoal dark:text-ivory mb-2">{isAr ? 'الصفحات المصدر' : 'Originating pages'}</h3>
              {!data?.pages?.length ? (
                <div className="text-xs text-charcoal/40 dark:text-ivory/40">{isAr ? 'مفيش' : 'None'}</div>
              ) : (
                <div className="space-y-1.5">
                  {data.pages.map((p: any) => (
                    <div key={p.url} className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-ivory dark:bg-charcoal border border-charcoal/5 dark:border-charcoal-border">
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-charcoal dark:text-ivory truncate" dir="ltr">{p.url}</div>
                        {p.title && <div className="text-[10px] text-charcoal/40 dark:text-ivory/40 truncate">{p.title}</div>}
                      </div>
                      <span className="shrink-0 text-sm font-bold text-forest dark:text-forest-light">{fmtNum(p.clicks, isAr)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Summary metric card ───
function MetricCard({
  label, value, pct, icon, iconCls, tip, isAr,
}: {
  label: string;
  value: number;
  pct?: number | null;
  icon: React.ReactNode;
  iconCls: string;
  tip: string;
  isAr: boolean;
}) {
  return (
    <div className="text-start p-4 rounded-2xl bg-ivory dark:bg-charcoal-light border border-charcoal/5 dark:border-charcoal-border hover:border-charcoal/15 dark:hover:border-charcoal-border transition-colors">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-charcoal/50 dark:text-ivory/50 leading-tight">{label}</span>
          <InfoTip text={tip} />
        </div>
        <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${iconCls}`}>{icon}</span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold text-charcoal dark:text-ivory tabular-nums">{fmtNum(value, isAr)}</span>
        {pct !== undefined && pct !== null && <DeltaBadge pct={pct} isAr={isAr} />}
      </div>
    </div>
  );
}

// /admin/analytics is a client component — the API it calls
// (/api/admin/analytics) is already force-dynamic + no-store.

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
  const [error, setError] = useState<string | null>(null);

  // table controls
  const [numType, setNumType] = useState<'all' | 'whatsapp' | 'phone'>('all');
  const [numSearch, setNumSearch] = useState('');
  const [numSort, setNumSort] = useState<'total' | 'today' | 'last7' | 'last30' | 'lastClicked' | 'contact'>('total');
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState<{ contact: string; type: 'whatsapp' | 'phone' } | null>(null);

  const PER_PAGE = 10;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ range });
    if (range === 'custom') {
      if (from) params.set('from', from);
      if (to) params.set('to', to);
    }
    try {
      const res = await fetch(`/api/admin/analytics?${params.toString()}`);
      if (!res.ok) throw new Error('Request failed');
      const data = await res.json();
      setStats(data.stats);
      setByNumber(data.byNumber);
      setByPage(data.byPage);
      setSeries(data.series);
    } catch {
      setError(isAr ? 'حصل خطأ في تحميل البيانات' : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, [range, from, to, isAr]);

  useEffect(() => {
    load();
  }, [load]);

  // Reset table page when filters change
  useEffect(() => { setPage(1); }, [numType, numSearch, range]);

  const filteredNumbers = useMemo(() => {
    return byNumber
      .filter((n) => (numType === 'all' || n.type === numType) && (!numSearch || n.contact.includes(numSearch)))
      .sort((a, b) => {
        switch (numSort) {
          case 'today': return b.today - a.today;
          case 'last7': return b.last7 - a.last7;
          case 'last30': return b.last30 - a.last30;
          case 'lastClicked': return (b.lastClicked ?? '').localeCompare(a.lastClicked ?? '');
          case 'contact': return a.contact.localeCompare(b.contact);
          default: return b.total - a.total;
        }
      });
  }, [byNumber, numType, numSearch, numSort]);

  const pageCount = Math.max(1, Math.ceil(filteredNumbers.length / PER_PAGE));
  const pagedNumbers = filteredNumbers.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const activeFilters = (numType !== 'all' ? 1 : 0) + (numSearch ? 1 : 0);
  const resetFilters = () => { setNumType('all'); setNumSearch(''); };

  return (
    <div>
      {/* ─── Header ─── */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-charcoal dark:text-ivory">
          {isAr ? 'تحليلات التواصل' : 'Contact Analytics'}
        </h1>
        <p className="text-sm text-charcoal/60 dark:text-ivory/60 mt-1 max-w-2xl">
          {isAr
            ? 'تتبّع مكالمات الهاتف وتفاعلات الواتساب على موقعك، راقب النشاط، واعرف أكتر أرقامك استخداماً.'
            : 'Track phone calls and WhatsApp interactions across your website, monitor activity, and discover your most frequently used contact numbers.'}
        </p>
      </div>

      {/* ─── Range selector ─── */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        {RANGES.map((r) => (
          <button
            key={r.key}
            onClick={() => setRange(r.key)}
            className={`btn-press px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
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
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-9 px-3 rounded-lg bg-ivory dark:bg-charcoal-light border border-charcoal/10 dark:border-charcoal-border text-sm" />
            <span className="text-charcoal/40">—</span>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-9 px-3 rounded-lg bg-ivory dark:bg-charcoal-light border border-charcoal/10 dark:border-charcoal-border text-sm" />
          </div>
        )}
      </div>

      {error && (
        <div className="mb-5 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* ─── Loading skeleton ─── */}
      {loading && !stats ? (
        <div className="space-y-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => <div key={i} className="h-24 rounded-2xl bg-sand-100 dark:bg-charcoal-light animate-pulse" />)}
          </div>
          <div className="h-72 rounded-2xl bg-sand-100 dark:bg-charcoal-light animate-pulse" />
          <div className="h-64 rounded-2xl bg-sand-100 dark:bg-charcoal-light animate-pulse" />
        </div>
      ) : stats ? (
        <>
          {/* ─── Summary cards ─── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <MetricCard
              label={isAr ? 'إجمالي الضغطات' : 'Total Clicks'}
              value={stats.total}
              pct={stats.prev?.totalPct ?? undefined}
              icon={<span className="text-base">📊</span>}
              iconCls="bg-charcoal/5 dark:bg-ivory/10"
              tip={isAr ? 'إجمالي ضغطات روابط التواصل في المدة المحددة' : 'Total contact-link clicks during the selected period'}
              isAr={isAr}
            />
            <MetricCard
              label={isAr ? 'ضغطات واتساب' : 'WhatsApp Clicks'}
              value={stats.whatsapp}
              pct={stats.prev?.whatsappPct ?? undefined}
              icon={<WhatsAppIcon className="w-4 h-4" />}
              iconCls="bg-[#25D366]/10 text-[#25D366]"
              tip={isAr ? 'عدد الضغطات على روابط واتساب — فتح الرابط فقط، مش إرسال رسالة' : 'Clicks on WhatsApp links — opening the link only, not a sent message'}
              isAr={isAr}
            />
            <MetricCard
              label={isAr ? 'ضغطات الهاتف' : 'Phone Clicks'}
              value={stats.phone}
              pct={stats.prev?.phonePct ?? undefined}
              icon={<PhoneIcon className="w-4 h-4" />}
              iconCls="bg-forest/10 text-forest dark:text-forest-light"
              tip={isAr ? 'عدد الضغطات على روابط الهاتف — فتح الرابط فقط، مش إتمام مكالمة' : 'Clicks on phone links — opening the link only, not a completed call'}
              isAr={isAr}
            />
            <MetricCard
              label={isAr ? 'أرقام نشطة' : 'Active Numbers'}
              value={stats.uniqueContacts}
              pct={stats.prev?.uniqueContactsPct ?? undefined}
              icon={<span className="text-base">🔢</span>}
              iconCls="bg-charcoal/5 dark:bg-ivory/10"
              tip={isAr ? 'عدد أرقام التواصل اللي استقبلت ضغطة واحدة على الأقل في المدة المحددة' : 'Contact numbers that received at least one click during the selected period'}
              isAr={isAr}
            />
          </div>

          {/* ─── Activity chart ─── */}
          <div className="p-5 rounded-2xl bg-ivory dark:bg-charcoal-light border border-charcoal/5 dark:border-charcoal-border mb-6">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <h2 className="font-semibold text-charcoal dark:text-ivory">
                {isAr ? 'النشاط عبر الوقت' : 'Activity Over Time'}
              </h2>
              <span className="text-xs text-charcoal/40 dark:text-ivory/40">
                {isAr ? 'مرّر على الرسم لعرض الأرقام اليومية' : 'Hover the chart for daily counts'}
              </span>
            </div>
            <ActivityChart data={series} locale={locale} />
          </div>

          {/* ─── Numbers table ─── */}
          <div className="p-5 rounded-2xl bg-ivory dark:bg-charcoal-light border border-charcoal/5 dark:border-charcoal-border mb-6">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-charcoal dark:text-ivory">
                  {isAr ? 'أداء أرقام التواصل' : 'Contact Number Performance'}
                </h2>
                <InfoTip text={isAr ? 'كل صف = رقم + نوع (واتساب/هاتف). "التاريخي" يحسب كل الضغطات من بداية التتبع.' : 'Each row = number + type. "All-time" counts every click since tracking began.'} />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <SearchIcon className="w-4 h-4 absolute top-1/2 -translate-y-1/2 start-2.5 text-charcoal/30 dark:text-ivory/30" />
                  <input
                    value={numSearch}
                    onChange={(e) => setNumSearch(e.target.value)}
                    placeholder={isAr ? 'ابحث برقم...' : 'Search number...'}
                    className="h-9 ps-8 pe-3 rounded-lg bg-sand-100 dark:bg-charcoal border border-charcoal/10 dark:border-charcoal-border text-sm w-44"
                  />
                </div>
                <select value={numType} onChange={(e) => setNumType(e.target.value as any)} className="h-9 px-3 rounded-lg bg-sand-100 dark:bg-charcoal border border-charcoal/10 dark:border-charcoal-border text-sm">
                  <option value="all">{isAr ? 'كل الأنواع' : 'All types'}</option>
                  <option value="whatsapp">{isAr ? 'واتساب' : 'WhatsApp'}</option>
                  <option value="phone">{isAr ? 'هاتف' : 'Phone'}</option>
                </select>
                <select value={numSort} onChange={(e) => setNumSort(e.target.value as any)} className="h-9 px-3 rounded-lg bg-sand-100 dark:bg-charcoal border border-charcoal/10 dark:border-charcoal-border text-sm">
                  <option value="total">{isAr ? 'الأكثر ضغطاً' : 'Most clicks'}</option>
                  <option value="today">{isAr ? 'الأكثر اليوم' : 'Most today'}</option>
                  <option value="last7">{isAr ? 'الأكثر ٧ أيام' : 'Most 7d'}</option>
                  <option value="last30">{isAr ? 'الأكثر ٣٠ يوم' : 'Most 30d'}</option>
                  <option value="lastClicked">{isAr ? 'الأحدث نشاطاً' : 'Most recent'}</option>
                  <option value="contact">{isAr ? 'أبجدي بالرقم' : 'By number'}</option>
                </select>
                {activeFilters > 0 && (
                  <button onClick={resetFilters} className="h-9 px-3 rounded-lg text-sm text-charcoal/60 dark:text-ivory/60 border border-charcoal/10 dark:border-charcoal-border hover:border-forest/30">
                    {isAr ? `مسح الفلاتر (${activeFilters})` : `Clear filters (${activeFilters})`}
                  </button>
                )}
              </div>
            </div>

            {filteredNumbers.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-3xl mb-2">📭</div>
                <div className="text-sm text-charcoal/50 dark:text-ivory/50">
                  {isAr
                    ? byNumber.length === 0 ? 'مفيش ضغطات مسجّلة في المدة دي' : 'مفيش أرقام مطابقة للفلاتر'
                    : byNumber.length === 0 ? 'No clicks recorded in this period' : 'No numbers match your filters'}
                </div>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto -mx-5 px-5">
                  <table className="w-full text-sm min-w-[680px]">
                    <thead>
                      <tr className="text-charcoal/50 dark:text-ivory/50 text-xs border-b border-charcoal/10 dark:border-charcoal-border">
                        <th className="text-start py-2.5 px-2 font-medium">{isAr ? 'الرقم' : 'Number'}</th>
                        <th className="text-start py-2.5 px-2 font-medium">{isAr ? 'النوع' : 'Type'}</th>
                        <th className="text-end py-2.5 px-2 font-medium cursor-pointer select-none hover:text-charcoal dark:hover:text-ivory" onClick={() => setNumSort('total')}>{isAr ? 'المدة' : 'Period'}</th>
                        <th className="text-end py-2.5 px-2 font-medium cursor-pointer select-none hover:text-charcoal dark:hover:text-ivory" onClick={() => setNumSort('today')}>{isAr ? 'اليوم' : 'Today'}</th>
                        <th className="text-end py-2.5 px-2 font-medium">{isAr ? 'أمس' : 'Yest.'}</th>
                        <th className="text-end py-2.5 px-2 font-medium cursor-pointer select-none hover:text-charcoal dark:hover:text-ivory" onClick={() => setNumSort('last7')}>{isAr ? '٧ أيام' : '7d'}</th>
                        <th className="text-end py-2.5 px-2 font-medium">{isAr ? 'التاريخي' : 'All-time'}</th>
                        <th className="text-end py-2.5 px-2 font-medium cursor-pointer select-none hover:text-charcoal dark:hover:text-ivory" onClick={() => setNumSort('lastClicked')}>{isAr ? 'آخر ضغطة' : 'Last click'}</th>
                        <th className="text-center py-2.5 px-2 font-medium">{isAr ? 'تفاصيل' : 'Details'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagedNumbers.map((n) => (
                        <tr key={n.contact + n.type} className="border-b border-charcoal/5 dark:border-charcoal-border/50 hover:bg-sand-50 dark:hover:bg-charcoal">
                          <td className="py-2.5 px-2 font-medium text-charcoal dark:text-ivory whitespace-nowrap" dir="ltr">{prettyNumber(n.contact)}</td>
                          <td className="py-2.5 px-2">
                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${n.type === 'whatsapp' ? 'bg-[#25D366]/10 text-[#25D366]' : 'bg-forest/10 text-forest dark:text-forest-light'}`}>
                              {n.type === 'whatsapp' ? <WhatsAppIcon className="w-3 h-3" /> : <PhoneIcon className="w-3 h-3" />}
                              {n.type === 'whatsapp' ? (isAr ? 'واتساب' : 'WA') : (isAr ? 'هاتف' : 'Phone')}
                            </span>
                          </td>
                          <td className="py-2.5 px-2 text-end font-bold text-charcoal dark:text-ivory tabular-nums">{fmtNum(n.total, isAr)}</td>
                          <td className="py-2.5 px-2 text-end text-charcoal/70 dark:text-ivory/70 tabular-nums">{fmtNum(n.today, isAr)}</td>
                          <td className="py-2.5 px-2 text-end text-charcoal/70 dark:text-ivory/70 tabular-nums">{fmtNum(n.yesterday, isAr)}</td>
                          <td className="py-2.5 px-2 text-end text-charcoal/70 dark:text-ivory/70 tabular-nums">{fmtNum(n.last7, isAr)}</td>
                          <td className="py-2.5 px-2 text-end text-charcoal/70 dark:text-ivory/70 tabular-nums">{fmtNum(n.allTime, isAr)}</td>
                          <td className="py-2.5 px-2 text-end text-charcoal/50 dark:text-ivory/50 text-xs whitespace-nowrap">{fmtDate(n.lastClicked, locale)}</td>
                          <td className="py-2.5 px-2 text-center">
                            <button
                              onClick={() => setDetail({ contact: n.contact, type: n.type })}
                              className="px-2.5 py-1 rounded-lg text-xs font-medium text-forest dark:text-forest-light hover:bg-forest/10 transition-colors"
                            >
                              {isAr ? 'عرض' : 'View'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* pagination */}
                {pageCount > 1 && (
                  <div className="flex items-center justify-between gap-3 mt-4">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="h-9 px-3 rounded-lg border border-charcoal/10 dark:border-charcoal-border text-sm disabled:opacity-40 hover:border-forest/30"
                    >
                      {isAr ? 'السابق' : 'Previous'}
                    </button>
                    <span className="text-xs text-charcoal/50 dark:text-ivory/50">
                      {isAr ? `صفحة ${fmtNum(page, isAr)} من ${fmtNum(pageCount, isAr)}` : `Page ${page} of ${pageCount}`}
                    </span>
                    <button
                      onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                      disabled={page === pageCount}
                      className="h-9 px-3 rounded-lg border border-charcoal/10 dark:border-charcoal-border text-sm disabled:opacity-40 hover:border-forest/30"
                    >
                      {isAr ? 'التالي' : 'Next'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* ─── Page-level analytics ─── */}
          <div className="p-5 rounded-2xl bg-ivory dark:bg-charcoal-light border border-charcoal/5 dark:border-charcoal-border">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="font-semibold text-charcoal dark:text-ivory">
                {isAr ? 'تحليلات الصفحات' : 'Page Analytics'}
              </h2>
              <InfoTip text={isAr ? 'الضغطات مجمّعة حسب الصفحة اللي الزائر ضغط منها' : 'Clicks grouped by the page the visitor clicked from'} />
            </div>
            {byPage.length === 0 ? (
              <div className="text-center py-10 text-charcoal/50 dark:text-ivory/50 text-sm">{isAr ? 'مفيش بيانات' : 'No data'}</div>
            ) : (
              <div className="overflow-x-auto -mx-5 px-5">
                <table className="w-full text-sm min-w-[560px]">
                  <thead>
                    <tr className="text-charcoal/50 dark:text-ivory/50 text-xs border-b border-charcoal/10 dark:border-charcoal-border">
                      <th className="text-start py-2.5 px-2 font-medium">{isAr ? 'الصفحة' : 'Page'}</th>
                      <th className="text-end py-2.5 px-2 font-medium">{isAr ? 'واتساب' : 'WhatsApp'}</th>
                      <th className="text-end py-2.5 px-2 font-medium">{isAr ? 'هاتف' : 'Phone'}</th>
                      <th className="text-end py-2.5 px-2 font-medium">{isAr ? 'الإجمالي' : 'Total'}</th>
                      <th className="text-start py-2.5 px-2 font-medium">{isAr ? 'الأكثر ضغطاً' : 'Top number'}</th>
                      <th className="text-start py-2.5 px-2 font-medium">{isAr ? 'آخر تفاعل' : 'Last interaction'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {byPage.map((p) => (
                      <tr key={p.url} className="border-b border-charcoal/5 dark:border-charcoal-border/50 hover:bg-sand-50 dark:hover:bg-charcoal">
                        <td className="py-2.5 px-2 text-charcoal dark:text-ivory">
                          <div dir="ltr" className="font-medium">{p.url}</div>
                          {p.title && <div className="text-xs text-charcoal/40 dark:text-ivory/40 truncate max-w-[200px]">{p.title}</div>}
                        </td>
                        <td className="py-2.5 px-2 text-end text-[#25D366] font-medium tabular-nums">{fmtNum(p.whatsapp, isAr)}</td>
                        <td className="py-2.5 px-2 text-end text-forest dark:text-forest-light font-medium tabular-nums">{fmtNum(p.phone, isAr)}</td>
                        <td className="py-2.5 px-2 text-end font-bold text-charcoal dark:text-ivory tabular-nums">{fmtNum(p.total, isAr)}</td>
                        <td className="py-2.5 px-2 text-charcoal/70 dark:text-ivory/70 text-xs" dir="ltr">{p.topContact ? `${prettyNumber(p.topContact.contact)} (${p.topContact.clicks})` : '—'}</td>
                        <td className="py-2.5 px-2 text-charcoal/50 dark:text-ivory/50 text-xs whitespace-nowrap">{fmtDate(p.lastInteraction, locale)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ─── Footer disclaimer ─── */}
          <p className="mt-5 text-[11px] text-charcoal/40 dark:text-ivory/40 text-center leading-relaxed">
            {isAr
              ? 'الأرقام تعكس ضغطات الزوار على روابط التواصل — الضغطة تعني فتح الرابط، وليست تأكيداً بإتمام مكالمة أو إرسال رسالة.'
              : 'Numbers reflect visitor clicks on contact links — a click means the link was opened, not a confirmed call or delivered message.'}
          </p>
        </>
      ) : null}

      {/* ─── Detail slide-over ─── */}
      {detail && (
        <NumberDetailPanel
          contact={detail.contact}
          type={detail.type}
          range={range}
          from={from}
          to={to}
          locale={locale}
          onClose={() => setDetail(null)}
        />
      )}
    </div>
  );
}
