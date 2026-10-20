import { NextRequest, NextResponse } from 'next/server';
import { getContactAnalyticsByKey } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { key: string } }) {
  try {
    const key = decodeURIComponent(params.key);
    if (!key || key.length > 64) {
      return NextResponse.json({ error: 'Invalid key' }, { status: 400 });
    }
    const { searchParams } = new URL(req.url);
    const range = searchParams.get('range') ?? '30d';
    const from = searchParams.get('from') ?? undefined;
    const to = searchParams.get('to') ?? undefined;
    const limit = Math.min(200, Math.max(1, Number(searchParams.get('limit') ?? 50)));
    const offset = Math.max(0, Number(searchParams.get('offset') ?? 0));

    const data = await getContactAnalyticsByKey(key, range, from, to, limit, offset);
    if (!data.contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }
    return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Failed' }, { status: 500 });
  }
}