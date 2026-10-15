import { NextRequest, NextResponse } from 'next/server';
import {
  getAllMerchants,
  createMerchant,
  updateMerchant,
  archiveMerchant,
  getMerchant,
} from '@/lib/db';

export const dynamic = 'force-dynamic';

// NOTE: /api/admin/* is auth-guarded by src/middleware.ts

// GET /api/admin/merchants — list all merchants
export async function GET() {
  try {
    const merchants = await getAllMerchants();
    return NextResponse.json({ merchants }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST /api/admin/merchants — create a merchant
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body?.name) {
      return NextResponse.json({ error: 'Merchant name is required' }, { status: 400 });
    }
    const id = await createMerchant({
      name: String(body.name).trim(),
      phone: body.phone ? String(body.phone).trim() : undefined,
      whatsapp: body.whatsapp ? String(body.whatsapp).trim() : undefined,
      notes: body.notes ? String(body.notes) : undefined,
    });
    return NextResponse.json({ ok: true, id });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// PUT /api/admin/merchants — update or archive a merchant
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body?.id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }
    const id = Number(body.id);

    if (body.action === 'archive') {
      await archiveMerchant(id);
      return NextResponse.json({ ok: true });
    }

    const updates: any = {};
    if (body.name !== undefined) updates.name = String(body.name).trim();
    if (body.phone !== undefined) updates.phone = body.phone ? String(body.phone).trim() : null;
    if (body.whatsapp !== undefined) updates.whatsapp = body.whatsapp ? String(body.whatsapp).trim() : null;
    if (body.notes !== undefined) updates.notes = body.notes ? String(body.notes) : null;
    if (body.status !== undefined) updates.status = String(body.status);

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }
    await updateMerchant(id, updates);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
