import { NextRequest, NextResponse } from 'next/server';
import {
  getTrafficSummary,
  getTopPages,
  getDeviceStats,
  getTrafficSources,
  getTrafficSeries,
  getLandingPages,
  getPageTraffic,
} from '@/lib/db';

export const dynamic = 'force-dynamic';

// NOTE: /api/admin/* is auth-guarded by src/middleware.ts

function parseRange(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const range = searchParams.get('range') ?? '30d';
  const from = searchParams.get('from') ?? undefined;
  const to = searchParams.get('to') ?? undefined;
  return { range, from, to };
}

// GET /api/admin/analytics/traffic?range=today|yesterday|7d|30d|month|custom&from=&to=
// Website traffic analytics — SEPARATE from the merchant contact-click system.
export async function GET(req: NextRequest) {
  try {
    const { range, from, to } = parseRange(req);
    const [summary, topPages, devices, sources, series, landing, pages] = await Promise.all([
      getTrafficSummary(range, from, to),
      getTopPages(range, from, to),
      getDeviceStats(range, from, to),
      getTrafficSources(range, from, to),
      getTrafficSeries(range, from, to),
      getLandingPages(range, from, to),
      getPageTraffic(range, from, to),
    ]);
    return NextResponse.json(
      { summary, topPages, devices, sources, series, landing, pages },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
