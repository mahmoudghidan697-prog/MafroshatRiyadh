import { NextRequest, NextResponse } from 'next/server';
import { getAllTestimonials, setTestimonialStatus, deleteTestimonial } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET: list ALL testimonials (pending, approved, rejected) for the admin
export async function GET() {
  return NextResponse.json({ testimonials: await getAllTestimonials() });
}

// POST: approve or reject a testimonial
// body: { id, status: 'approved' | 'rejected' }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const id = Number(body.id);
    const status = String(body.status);
    if (!id || !['approved', 'rejected', 'pending'].includes(status)) {
      return NextResponse.json({ error: 'id and valid status required' }, { status: 400 });
    }
    await setTestimonialStatus(id, status as any);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// DELETE: remove a testimonial entirely
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = Number(searchParams.get('id'));
    if (!id) {
      return NextResponse.json({ error: 'id required' }, { status: 400 });
    }
    await deleteTestimonial(id);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
