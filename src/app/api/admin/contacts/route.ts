import { NextRequest, NextResponse } from 'next/server';
import { getAllContacts, updateContact } from '@/lib/db';

export const dynamic = 'force-dynamic';

// NOTE: /api/admin/* is auth-guarded by src/middleware.ts.

// GET: all contact icon configurations (admin view, includes inactive).
export async function GET() {
  const contacts = await getAllContacts();
  return NextResponse.json(
    { contacts },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}

// PUT: update one contact's number / active state / name.
// body: { key, number?, active?, nameAr?, nameEn? }
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const key = String(body.key ?? '');
    if (!key) {
      return NextResponse.json({ error: 'key required' }, { status: 400 });
    }
    const ok = await updateContact(key, {
      number: body.number,
      active: typeof body.active === 'boolean' ? body.active : undefined,
      nameAr: body.nameAr,
      nameEn: body.nameEn,
    });
    if (!ok) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
