import { NextRequest, NextResponse } from 'next/server';
import { assignProductMerchant, getMerchantProducts } from '@/lib/db';

export const dynamic = 'force-dynamic';

// NOTE: /api/admin/* is auth-guarded by src/middleware.ts

// PUT /api/admin/merchants/assign — { slug, merchantId | null }
// Assigns (or unassigns) a product to a merchant. The merchantId comes
// from the server session's DB lookup, never from client trust.
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body?.slug) {
      return NextResponse.json({ error: 'slug is required' }, { status: 400 });
    }
    const slug = String(body.slug);
    const merchantId = body.merchantId == null ? null : Number(body.merchantId);
    if (merchantId != null && !Number.isFinite(merchantId)) {
      return NextResponse.json({ error: 'Invalid merchantId' }, { status: 400 });
    }
    const ok = await assignProductMerchant(slug, merchantId);
    if (!ok) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// GET /api/admin/merchants/assign?merchantId=1 — products for a merchant
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const merchantId = Number(searchParams.get('merchantId'));
    if (!Number.isFinite(merchantId)) {
      return NextResponse.json({ error: 'merchantId is required' }, { status: 400 });
    }
    const products = await getMerchantProducts(merchantId);
    return NextResponse.json({ products }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
