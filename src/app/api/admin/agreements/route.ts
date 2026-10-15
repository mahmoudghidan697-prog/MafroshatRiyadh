import { NextRequest, NextResponse } from 'next/server';
import {
  createAgreement,
  getAgreements,
  getAgreement,
  getAgreementBilling,
  extendAgreement,
  closeAgreement,
} from '@/lib/db';

export const dynamic = 'force-dynamic';

// NOTE: /api/admin/* is auth-guarded by src/middleware.ts

// GET /api/admin/agreements?merchantId=1 — agreements (+ live billing) for a merchant
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const merchantId = Number(searchParams.get('merchantId'));
    if (!Number.isFinite(merchantId)) {
      return NextResponse.json({ error: 'merchantId is required' }, { status: 400 });
    }
    const agreements = await getAgreements(merchantId);
    // Attach the live billing breakdown to each agreement
    const withBilling = await Promise.all(
      agreements.map(async (a) => ({ ...a, billing: await getAgreementBilling(a.id) })),
    );
    return NextResponse.json({ agreements: withBilling }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST /api/admin/agreements — create an agreement
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body?.merchantId || !body?.agreedClicks || !body?.ratePerClick) {
      return NextResponse.json({ error: 'merchantId, agreedClicks and ratePerClick are required' }, { status: 400 });
    }
    const id = await createAgreement({
      merchantId: Number(body.merchantId),
      name: body.name ? String(body.name) : undefined,
      startDate: body.startDate ? String(body.startDate) : new Date().toISOString().slice(0, 10),
      endDate: body.endDate ? String(body.endDate) : null,
      agreedClicks: Number(body.agreedClicks),
      ratePerClick: Number(body.ratePerClick),
      additionalRate: body.additionalRate != null ? Number(body.additionalRate) : null,
      notes: body.notes ? String(body.notes) : undefined,
    });
    return NextResponse.json({ ok: true, id });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// PUT /api/admin/agreements — extend or close an agreement
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body?.id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }
    const id = Number(body.id);

    if (body.action === 'extend') {
      const extra = Number(body.extraClicks);
      if (!Number.isFinite(extra) || extra <= 0) {
        return NextResponse.json({ error: 'extraClicks must be a positive number' }, { status: 400 });
      }
      await extendAgreement(id, extra, body.newRate != null ? Number(body.newRate) : null);
      return NextResponse.json({ ok: true });
    }

    if (body.action === 'close') {
      await closeAgreement(id);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
