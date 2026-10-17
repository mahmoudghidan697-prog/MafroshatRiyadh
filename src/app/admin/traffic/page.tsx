'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useApp } from '@/context/AppContext';

// ─── Types ───
interface Summary {
  uniqueVisitors: number;
  totalSessions: number;
  totalPageViews: number;
  mobileVisitors: number;
  desktopVisitors: number;
  tabletVisitors: number;
  unknownVisitors: number;
  avgPagesPerSession: number;
  avgSessionDuration: number;
}
interface TopPage { page_url: string; page_title: string | null; page_views: number; unique_visitors: number; sessions: number }
interface DeviceStat { device_type: string; visitors: number; sessions: number; page_views: number; pct: number }
interface SourceStat { source: string; visitors: number; sessions: number; page_views: number }
interface SeriesPoint { date: string; visitors: number; sessions: number; page_views: number }
interface LandingPage { page_url: string; page_title: string | null; sessions: number; visitors: number }
interface PageTraffic { page_url: string; page_title: string | null; page_views: number; unique_visitors: number; sessions: number; mobile_views: number }

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
function fmtDuration(sec: number, isAr: boolean): string {
  if (sec < 60) return `${sec}${isAr ? ' ث' : 's'}`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}${isAr ? ' د' : 'm'} ${s}${isAr ? ' ث' : 's'}`;
}
function fmtDay(day: string, locale: string): string {
  try {
    return new Date(day + 'T00:00:00').toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US', { month: 'short', day: 'numeric' });
  } catch { return day; }
}

// ─── Traffic chart (SVG line chart) ───
function TrafficChart({ data, locale }: { data: SeriesPoint[]; locale: string }) {
  const isAr = locale === 'ar';
  const [hover, setHover] = useState<number | null>(null);
  if (data.length === 0) {
    return <div className="h-56 flex items-center justify-center text-charcoal/40 dark:text-ivory/40 text-sm">{isAr ? 'مفيش بيانات في المدة دي' : 'No data for this period'}</div>;
  }
  const W = 720, H = 220, padL = 36, padR = 12, padT = 12, padB = 28;
  const max = Math.max(1, ...data.map((d) => Math.max(d.visitors, d.sessions, d.page_views)));
  const niceMax = Math.ceil(max / 5) * 5 || 5;
  const x = (i: number) => padL + (i / Math.max(1, data.length - 1)) * (W - padL - padR);
  const y = (v: number) => padT + (1 - v / niceMax) * (H - padT - padB);
  const path = (key: 'visitors' | 'sessions' | 'page_views') =>
    data.map((d, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(d[key]).toFixed(1)}`).join(' ');
  const tickIdx = data.length <= 1 ? [0] : [0, Math.floor(data.length / 2), data.length - 1];

  return (
    <div className="w-full">
      <div className="flex items-center gap-4 text-xs text-charcoal/60 dark:text-ivory/60 mb-3">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-forest" />{isAr ? 'زوار' : 'Visitors'}</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#25D366]" />{isAr ? 'جلسات' : 'Sessions'}</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" />{isAr ? 'مشاهدات' : 'Page views'}</span>
      </div>
      <div className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-56" preserveAspectRatio="none" onMouseLeave={() => setHover(null)}>
          {[0, 0.25, 0.5, 0.75, 1].map((f) => (
            <line key={f} x1={padL} x2={W - padR} y1={y(niceMax * f)} y2={y(niceMax * f)} className="stroke-charcoal/10 dark:stroke-ivory/10" strokeWidth="1" />
          ))}
          {[0, 0.5, 1].map((f) => (
            <text key={f} x={padL - 6} y={y(niceMax * f) + 4} textAnchor="end" className="fill-charcoal/35 dark:fill-ivory/35 text-[10px]">{Math.round(niceMax * f)}</text>
          ))}
          <path d={path('page_views')} className="stroke-amber-500" strokeWidth="2" fill="none" strokeLinejoin="round" />
          <path d={path('sessions')} className="stroke-[#25D366]" strokeWidth="2" fill="none" strokeLinejoin="round" />
          <path d={path('visitors')} className="stroke-forest dark:stroke-forest-light" strokeWidth="2.5" fill="none" strokeLinejoin="round" />
          {data.map((d, i) => (
            <g key={d.date}>
              <rect x={x(i) - 8} y={padT} width={16} height={H - padT - padB} fill="transparent" onMouseEnter={() => setHover(i)} />
              {hover === i && (
                <>
                  <line x1={x(i)} x2={x(i)} y1={padT} y2={H - padB} className="stroke-charcoal/20 dark:stroke-ivory/20" strokeWidth="1" strokeDasharray="3 3" />
                  <circle cx={x(i)} cy={y(d.visitors)} r="4" className="fill-forest dark:fill-forest-light stroke-white dark:stroke-charcoal" strokeWidth="2" />
                  <circle cx={x(i)} cy={y(d.sessions)} r="4" className="fill-[#25D366] stroke-white dark:stroke-charcoal" strokeWidth="2" />
                  <circle cx={x(i)} cy={y(d.page_views)} r="4" className="fill-amber-500 stroke-white dark:stroke-charcoal" strokeWidth="2" />
                </>
              )}
            </g>
          ))}
          {tickIdx.map((i) => (
            <text key={i} x={x(i)} y={H - 8} textAnchor={i === 0 ? 'start' : i === data.length - 1 ? 'end' : 'middle'} className="fill-charcoal/35 dark:fill-ivory/35 text-[10px]">{fmtDay(data[i].date, locale)}</text>
          ))}
        </svg>
        {hover !== null && data[hover] && (
          <div className="absolute pointer-events-none z-10 px-3 py-2 rounded-lg bg-charcoal dark:bg-charcoal-elevated text-ivory text-xs shadow-lg whitespace-nowrap"
            style={{ left: `${(x(hover) / W) * 100}%`, top: 0, transform: `translateX(${hover > data.length / 2 ? '-90%' : '-10%'})` }}>
            <div className="font-medium mb-1">{fmtDay(data[hover].date, locale)}</div>
            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-forest" />{isAr ? 'زوار' : 'Visitors'}: <b>{fmtNum(data[hover].visitors, isAr)}</b></div>
            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#25D366]" />{isAr ? 'جلسات' : 'Sessions'}: <b>{fmtNum(data[hover].sessions, isAr)}</b></div>
            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500" />{isAr ? 'مشاهدات' : 'Views'}: <b>{fmtNum(data[hover].page_views, isAr)}</b></div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main page ───
export default function AdminTrafficAnalytics() {
  const { locale } = useApp();
  const isAr = locale === 'ar';

  const [range, setRange] = useState<RangeKey>('30d');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [summary, setSummary] = useState<Summary | null>(null);
  const [topPages, setTopPages] = useState<TopPage[]>([]);
  const [devices, setDevices] = useState<DeviceStat[]>([]);
  const [sources, setSources] = useState<SourceStat[]>([]);
  const [series, setSeries] = useState<SeriesPoint[]>([]);
  const [landing, setLanding] = useState<LandingPage[]>([]);
  const [pages, setPages] = useState<PageTraffic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [pageSearch, setPageSearch] = useState('');
  const [pageSort, setPageSort] = useState<'page_views' | 'unique_visitors' | 'sessions'>('page_views');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ range });
    if (range === 'custom') {
      if (from) params.set('from', from);
      if (to) params.set('to', to);
    }
    try {
      const res = await fetch(`/api/admin/analytics/traffic?${params.toString()}`);
      if (!res.ok) throw new Error('Request failed');
      const data = await res.json();
      setSummary(data.summary);
      setTopPages(data.topPages);
      setDevices(data.devices);
      setSources(data.sources);
      setSeries(data.series);
      setLanding(data.landing);
      setPages(data.pages);
    } catch {
      setError(isAr ? 'حصل خطأ في تحميل البيانات' : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, [range, from, to, isAr]);

  useEffect(() => { load(); }, [load]);

  const filteredPages = useMemo(() => {
    return pages
      .filter((p) => !pageSearch || p.page_url.includes(pageSearch) || (p.page_title && p.page_title.includes(pageSearch)))
      .sort((a, b) => b[pageSort] - a[pageSort]);
  }, [pages, pageSearch, pageSort]);

  const deviceLabel = (t: string) =>
    t === 'mobile' ? (isAr ? 'موبايل' : 'Mobile')
    : t === 'desktop' ? (isAr ? 'كمبيوتر' : 'Desktop')
    : t === 'tablet' ? (isAr ? 'تابلت' : 'Tablet')
    : (isAr ? 'غير معروف' : 'Unknown');

  const sourceLabel = (s: string) =>
    s === 'direct' ? (isAr ? 'مباشر' : 'Direct')
    : s === 'organic_search' ? (isAr ? 'بحث جوجل' : 'Organic Search')
    : s === 'social' ? (isAr ? 'سوشيال' : 'Social')
    : s === 'referral' ? (isAr ? 'إحالة' : 'Referral')
    : (isAr ? 'غير معروف' : 'Unknown');

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-charcoal dark:text-ivory">
          {isAr ? 'تحليلات زيارات الموقع' : 'Website Traffic Analytics'}
        </h1>
        <p className="text-sm text-charcoal/60 dark:text-ivory/60 mt-1 max-w-2xl">
          {isAr
            ? 'تابع زوار الموقع والجلسات ومشاهدات الصفحات — منفصل عن تتبع ضغطات التواصل.'
            : 'Track visitors, sessions, and page views — separate from contact-click tracking.'}
        </p>
      </div>

      {/* Range selector */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        {RANGES.map((r) => (
          <button key={r.key} onClick={() => setRange(r.key)}
            className={`btn-press px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              range === r.key
                ? 'bg-forest text-ivory shadow-sm'
                : 'bg-ivory dark:bg-charcoal-light text-charcoal/70 dark:text-ivory/70 border border-charcoal/10 dark:border-charcoal-border hover:border-forest/30'
            }`}>
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
        <div className="mb-5 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-600 dark:text-red-400">{error}</div>
      )}

      {/* Loading skeleton */}
      {loading && !summary ? (
        <div className="space-y-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[1,2,3,4].map((i) => <div key={i} className="h-24 rounded-2xl bg-sand-100 dark:bg-charcoal-light animate-pulse" />)}
          </div>
          <div className="h-72 rounded-2xl bg-sand-100 dark:bg-charcoal-light animate-pulse" />
        </div>
      ) : summary ? (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            {[
              { label: isAr ? 'زوار فريدين' : 'Unique Visitors', value: summary.uniqueVisitors, icon: '👤' },
              { label: isAr ? 'الجلسات' : 'Sessions', value: summary.totalSessions, icon: '🔄' },
              { label: isAr ? 'مشاهدات الصفحات' : 'Page Views', value: summary.totalPageViews, icon: '📄' },
              { label: isAr ? 'متوسط الصفحات/الجلسة' : 'Avg Pages/Session', value: summary.avgPagesPerSession, icon: '📊' },
            ].map((c) => (
              <div key={c.label} className="p-4 rounded-2xl bg-ivory dark:bg-charcoal-light border border-charcoal/5 dark:border-charcoal-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] text-charcoal/50 dark:text-ivory/50 leading-tight">{c.label}</span>
                  <span className="text-lg">{c.icon}</span>
                </div>
                <div className="text-2xl font-bold text-charcoal dark:text-ivory tabular-nums">{fmtNum(c.value, isAr)}</div>
              </div>
            ))}
          </div>

          {/* Device + duration row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            {[
              { label: isAr ? 'موبايل' : 'Mobile', value: summary.mobileVisitors, color: 'text-[#25D366]' },
              { label: isAr ? 'كمبيوتر' : 'Desktop', value: summary.desktopVisitors, color: 'text-forest dark:text-forest-light' },
              { label: isAr ? 'تابلت' : 'Tablet', value: summary.tabletVisitors, color: 'text-amber-500' },
              { label: isAr ? 'متوسط مدة الجلسة' : 'Avg Session', value: null, raw: fmtDuration(summary.avgSessionDuration, isAr), color: 'text-charcoal dark:text-ivory' },
            ].map((c) => (
              <div key={c.label} className="p-4 rounded-2xl bg-ivory dark:bg-charcoal-light border border-charcoal/5 dark:border-charcoal-border">
                <div className="text-[11px] text-charcoal/50 dark:text-ivory/50 mb-1">{c.label}</div>
                <div className={`text-xl font-bold tabular-nums ${c.color}`}>{c.raw ?? fmtNum(c.value ?? 0, isAr)}</div>
              </div>
            ))}
          </div>

          {/* Traffic chart */}
          <div className="p-5 rounded-2xl bg-ivory dark:bg-charcoal-light border border-charcoal/5 dark:border-charcoal-border mb-6">
            <h2 className="font-semibold text-charcoal dark:text-ivory mb-4">{isAr ? 'حركة الزوار عبر الوقت' : 'Traffic Over Time'}</h2>
            <TrafficChart data={series} locale={locale} />
          </div>

          {/* Device breakdown */}
          <div className="p-5 rounded-2xl bg-ivory dark:bg-charcoal-light border border-charcoal/5 dark:border-charcoal-border mb-6">
            <h2 className="font-semibold text-charcoal dark:text-ivory mb-4">{isAr ? 'توزيع الأجهزة' : 'Device Breakdown'}</h2>
            {devices.length === 0 ? (
              <div className="text-center py-8 text-charcoal/50 dark:text-ivory/50 text-sm">{isAr ? 'مفيش بيانات' : 'No data'}</div>
            ) : (
              <div className="space-y-3">
                {devices.map((d) => (
                  <div key={d.device_type} className="flex items-center gap-3">
                    <span className="w-20 text-sm text-charcoal/70 dark:text-ivory/70">{deviceLabel(d.device_type)}</span>
                    <div className="flex-1 h-3 rounded-full bg-sand-100 dark:bg-charcoal overflow-hidden">
                      <div className="h-full rounded-full bg-forest dark:bg-forest-light" style={{ width: `${d.pct}%` }} />
                    </div>
                    <span className="w-12 text-end text-sm font-bold text-charcoal dark:text-ivory tabular-nums">{d.pct}%</span>
                    <span className="w-16 text-end text-xs text-charcoal/50 dark:text-ivory/50 tabular-nums">{fmtNum(d.visitors, isAr)} {isAr ? 'زائر' : 'visitors'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Traffic sources */}
          <div className="p-5 rounded-2xl bg-ivory dark:bg-charcoal-light border border-charcoal/5 dark:border-charcoal-border mb-6">
            <h2 className="font-semibold text-charcoal dark:text-ivory mb-4">{isAr ? 'مصادر الزيارات' : 'Traffic Sources'}</h2>
            {sources.length === 0 ? (
              <div className="text-center py-8 text-charcoal/50 dark:text-ivory/50 text-sm">{isAr ? 'مفيش بيانات' : 'No data'}</div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {sources.map((s) => (
                  <div key={s.source} className="p-3 rounded-xl bg-sand-50 dark:bg-charcoal text-center">
                    <div className="text-lg font-bold text-charcoal dark:text-ivory">{fmtNum(s.visitors, isAr)}</div>
                    <div className="text-[11px] text-charcoal/50 dark:text-ivory/50">{sourceLabel(s.source)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top pages + Landing pages */}
          <div className="grid lg:grid-cols-2 gap-6 mb-6">
            <div className="p-5 rounded-2xl bg-ivory dark:bg-charcoal-light border border-charcoal/5 dark:border-charcoal-border">
              <h2 className="font-semibold text-charcoal dark:text-ivory mb-4">{isAr ? 'أكثر الصفحات زيارة' : 'Top Pages'}</h2>
              {topPages.length === 0 ? (
                <div className="text-center py-8 text-charcoal/50 dark:text-ivory/50 text-sm">{isAr ? 'مفيش بيانات' : 'No data'}</div>
              ) : (
                <div className="space-y-2">
                  {topPages.slice(0, 8).map((p) => (
                    <div key={p.page_url} className="flex items-center justify-between gap-2 text-sm">
                      <span className="truncate text-charcoal dark:text-ivory" dir="ltr">{p.page_url}</span>
                      <span className="shrink-0 font-bold text-charcoal dark:text-ivory tabular-nums">{fmtNum(p.page_views, isAr)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="p-5 rounded-2xl bg-ivory dark:bg-charcoal-light border border-charcoal/5 dark:border-charcoal-border">
              <h2 className="font-semibold text-charcoal dark:text-ivory mb-4">{isAr ? 'صفحات الهبوط' : 'Landing Pages'}</h2>
              {landing.length === 0 ? (
                <div className="text-center py-8 text-charcoal/50 dark:text-ivory/50 text-sm">{isAr ? 'مفيش بيانات' : 'No data'}</div>
              ) : (
                <div className="space-y-2">
                  {landing.slice(0, 8).map((p) => (
                    <div key={p.page_url} className="flex items-center justify-between gap-2 text-sm">
                      <span className="truncate text-charcoal dark:text-ivory" dir="ltr">{p.page_url}</span>
                      <span className="shrink-0 font-bold text-charcoal dark:text-ivory tabular-nums">{fmtNum(p.sessions, isAr)} {isAr ? 'جلسة' : 'sessions'}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Page traffic table */}
          <div className="p-5 rounded-2xl bg-ivory dark:bg-charcoal-light border border-charcoal/5 dark:border-charcoal-border">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h2 className="font-semibold text-charcoal dark:text-ivory">{isAr ? 'حركة الصفحات' : 'Page Traffic'}</h2>
              <div className="flex items-center gap-2">
                <input value={pageSearch} onChange={(e) => setPageSearch(e.target.value)}
                  placeholder={isAr ? 'ابحث بصفحة...' : 'Search page...'}
                  className="h-9 px-3 rounded-lg bg-sand-100 dark:bg-charcoal border border-charcoal/10 dark:border-charcoal-border text-sm w-44" />
                <select value={pageSort} onChange={(e) => setPageSort(e.target.value as any)}
                  className="h-9 px-3 rounded-lg bg-sand-100 dark:bg-charcoal border border-charcoal/10 dark:border-charcoal-border text-sm">
                  <option value="page_views">{isAr ? 'الأكثر مشاهدة' : 'Most views'}</option>
                  <option value="unique_visitors">{isAr ? 'الأكثر زوار' : 'Most visitors'}</option>
                  <option value="sessions">{isAr ? 'الأكثر جلسات' : 'Most sessions'}</option>
                </select>
              </div>
            </div>
            {filteredPages.length === 0 ? (
              <div className="text-center py-8 text-charcoal/50 dark:text-ivory/50 text-sm">{isAr ? 'مفيش بيانات' : 'No data'}</div>
            ) : (
              <div className="overflow-x-auto -mx-5 px-5">
                <table className="w-full text-sm min-w-[560px]">
                  <thead>
                    <tr className="text-charcoal/50 dark:text-ivory/50 text-xs border-b border-charcoal/10 dark:border-charcoal-border">
                      <th className="text-start py-2.5 px-2 font-medium">{isAr ? 'الصفحة' : 'Page'}</th>
                      <th className="text-end py-2.5 px-2 font-medium">{isAr ? 'مشاهدات' : 'Views'}</th>
                      <th className="text-end py-2.5 px-2 font-medium">{isAr ? 'زوار' : 'Visitors'}</th>
                      <th className="text-end py-2.5 px-2 font-medium">{isAr ? 'جلسات' : 'Sessions'}</th>
                      <th className="text-end py-2.5 px-2 font-medium">{isAr ? 'موبايل' : 'Mobile'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPages.slice(0, 20).map((p) => (
                      <tr key={p.page_url} className="border-b border-charcoal/5 dark:border-charcoal-border/50">
                        <td className="py-2.5 px-2 text-charcoal dark:text-ivory">
                          <div dir="ltr" className="font-medium truncate max-w-[200px]">{p.page_url}</div>
                          {p.page_title && <div className="text-xs text-charcoal/40 dark:text-ivory/40 truncate max-w-[200px]">{p.page_title}</div>}
                        </td>
                        <td className="py-2.5 px-2 text-end font-bold text-charcoal dark:text-ivory tabular-nums">{fmtNum(p.page_views, isAr)}</td>
                        <td className="py-2.5 px-2 text-end text-charcoal/70 dark:text-ivory/70 tabular-nums">{fmtNum(p.unique_visitors, isAr)}</td>
                        <td className="py-2.5 px-2 text-end text-charcoal/70 dark:text-ivory/70 tabular-nums">{fmtNum(p.sessions, isAr)}</td>
                        <td className="py-2.5 px-2 text-end text-[#25D366] tabular-nums">{fmtNum(p.mobile_views, isAr)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Disclaimer */}
          <p className="mt-5 text-[11px] text-charcoal/40 dark:text-ivory/40 text-center leading-relaxed">
            {isAr
              ? 'الزوار والجلسات والمشاهدات مقاييس منفصلة عن ضغطات التواصل. الزائر الفريد تقدير وليس عدداً مضبوطاً للأشخاص.'
              : 'Visitors, sessions, and page views are separate from contact clicks. A unique visitor is an estimate, not a guaranteed count of distinct people.'}
          </p>
        </>
      ) : null}
    </div>
  );
}
