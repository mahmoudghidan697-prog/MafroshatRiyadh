import { NextResponse } from 'next/server';
import { createTestimonial } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Public endpoint — anyone can submit a review. It lands as 'pending'
// and only appears on the site after an admin approves it in /admin.
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const name = String(body.name ?? '').trim();
    const role = String(body.role ?? '').trim();
    const quote = String(body.quote ?? '').trim();
    const rating = Math.min(5, Math.max(1, Number(body.rating) || 5));

    // Basic validation
    if (name.length < 2) {
      return NextResponse.json({ error: 'Name is too short' }, { status: 400 });
    }
    if (quote.length < 10) {
      return NextResponse.json({ error: 'Review is too short' }, { status: 400 });
    }

    const created = await createTestimonial({ name, role: role || 'عميل', quote, rating });
    return NextResponse.json({ ok: true, id: created.id, status: created.status });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
