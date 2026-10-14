import { NextRequest, NextResponse } from 'next/server';
import {
  getContactStats,
  getContactByNumber,
  getContactByPage,
  getContactTimeSeries,
} from '@/lib/db';

export const dynamic = 'force-dynamic';

// NOTE: /api/admin/* is already auth-guarded by src/middleware.ts
// (requires the admin_token cookie). These endpoints return aggregated
// analytics ONLY — no admin credentials or sensitive config.

function parseRange(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const range = searchParams.get('range') ?? '30d';
  const from = searchParams.get('from') ?? undefined;
  const to = searchParams.get('to') ?? undefined;
  return { range, from, to };
}

// GET /api/admin/analytics?range=today|yesterday|7d|30d|month|custom&from=&to=
// Returns overview counters + all tables + chart series in one payload.
export async function GET(req: NextRequest) {
  try {
    const { range, from, to } = parseRange(req);
    const [stats, byNumber, byPage, series] = await Promise.all([
      getContactStats(range, from, to),
      getContactByNumber(range, from, to),
      getContactByPage(range, from, to),
      getContactTimeSeries(range, from, to),
    ]);
    return NextResponse.json(
      { stats, byNumber, byPage, series },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
