import { NextRequest, NextResponse } from 'next/server';
import { getContactByNumber, getDb, rangeBounds } from '@/lib/db';

export const dynamic = 'force-dynamic';

// NOTE: /api/admin/* is auth-guarded by src/middleware.ts

// GET /api/admin/analytics/number?contact=9665...&type=whatsapp|phone&range=30d
// Detailed analytics for a single contact number: period totals + daily
// series + originating pages, plus all-time first/last click.
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const contact = searchParams.get('contact');
    const type = searchParams.get('type') ?? 'whatsapp';
    const range = searchParams.get('range') ?? '30d';
    const from = searchParams.get('from') ?? undefined;
    const to = searchParams.get('to') ?? undefined;

    if (!contact) {
      return NextResponse.json({ error: 'contact is required' }, { status: 400 });
    }

    const byNumber = await getContactByNumber(range, from, to);
    const row = byNumber.find((r) => r.contact === contact && r.type === type) ?? null;

    // Per-day clicks for this number only (chart + daily breakdown)
    const db = getDb();
    const b = rangeBounds(range, from, to);
    const [dailyRows, pageRows] = await Promise.all([
      db.execute({
        sql: `SELECT substr(created_at, 1, 10) AS day, COUNT(*) AS clicks
          FROM contact_events
          WHERE contact = ? AND type = ? AND created_at BETWEEN ? AND ?
          GROUP BY day ORDER BY day ASC`,
        args: [contact, type, b.from, b.to],
      }),
      db.execute({
        sql: `SELECT page_url, page_title, COUNT(*) AS clicks, MAX(created_at) AS last
          FROM contact_events
          WHERE contact = ? AND type = ? AND created_at BETWEEN ? AND ?
          GROUP BY page_url ORDER BY clicks DESC`,
        args: [contact, type, b.from, b.to],
      }),
    ]);

    return NextResponse.json(
      {
        contact,
        type,
        row,
        daily: dailyRows.rows.map((r: any) => ({ date: String(r.day), clicks: Number(r.clicks) })),
        pages: pageRows.rows.map((r: any) => ({
          url: String(r.page_url),
          title: r.page_title ? String(r.page_title) : null,
          clicks: Number(r.clicks),
          last: r.last ? String(r.last) : null,
        })),
      },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
