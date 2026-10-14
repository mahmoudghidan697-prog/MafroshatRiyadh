import { NextRequest, NextResponse } from 'next/server';
import { getDb, getAllProducts, getCategories, createProduct, updateProduct, deleteProduct } from '@/lib/db';

/** Normalize price to a plain integer (SAR) or null. Guards against
 *  {amount} objects, strings, or garbage like "[object Object]". */
function normalizePrice(p: any): number | null {
  if (p == null) return null;
  if (typeof p === 'number') return Number.isFinite(p) ? Math.round(p) : null;
  if (typeof p === 'object' && p.amount != null) {
    const n = Number(p.amount);
    return Number.isFinite(n) ? Math.round(n) : null;
  }
  const n = Number(p);
  return Number.isFinite(n) ? Math.round(n) : null;
}

export async function GET() {
  const products = await getAllProducts();
  const categories = await getCategories();
  return NextResponse.json({ products, categories });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const db = getDb();

    if (!body.slug || !body.name?.ar || !body.name?.en || !body.category) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check slug uniqueness
    const existing = await db.execute({ sql: 'SELECT id FROM products WHERE slug = ?', args: [body.slug] });
    if (existing.rows.length > 0) {
      return NextResponse.json({ error: 'Slug already exists' }, { status: 409 });
    }

    await createProduct({
      slug: body.slug,
      sku: body.sku ?? null,
      name: { ar: body.name.ar, en: body.name.en },
      category: body.category,
      description: { ar: body.description?.ar ?? '', en: body.description?.en ?? '' },
      material: { ar: body.material?.ar ?? '', en: body.material?.en ?? '' },
      color: { ar: body.color?.ar ?? '', en: body.color?.en ?? '' },
      dimensions: body.dimensions?.ar ? { ar: body.dimensions.ar, en: body.dimensions.en ?? '' } : undefined,
      price: normalizePrice(body.price),
      unit: body.unit?.ar ? { ar: body.unit.ar, en: body.unit.en ?? '' } : undefined,
      images: body.images ?? [],
      featured: body.featured ? 1 : 0,
      createdAt: body.createdAt ?? new Date().toISOString().split('T')[0],
      specs: body.specs ?? [],
      variations: body.variations ?? [],
      useCases: body.useCases ?? [],
      published: 1,
      seoTitle: body.seoTitle ?? null,
      seoDescription: body.seoDescription ?? null,
    } as any);

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get('slug');
    if (!slug) {
      return NextResponse.json({ error: 'Slug required' }, { status: 400 });
    }
    const body = await req.json();
    const db = getDb();

    const existing = await db.execute({ sql: 'SELECT id FROM products WHERE slug = ?', args: [slug] });
    if (existing.rows.length === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    await updateProduct(slug, {
      sku: body.sku ?? null,
      name: { ar: body.name.ar, en: body.name.en },
      categoryId: body.category,
      description: { ar: body.description?.ar ?? '', en: body.description?.en ?? '' },
      material: { ar: body.material?.ar ?? '', en: body.material?.en ?? '' },
      color: { ar: body.color?.ar ?? '', en: body.color?.en ?? '' },
      dimensions: body.dimensions?.ar ? { ar: body.dimensions.ar, en: body.dimensions.en ?? '' } : undefined,
      price: normalizePrice(body.price),
      unit: body.unit?.ar ? { ar: body.unit.ar, en: body.unit.en ?? '' } : undefined,
      images: body.images ?? [],
      featured: body.featured ? 1 : 0,
      specs: body.specs ?? [],
      variations: body.variations ?? [],
      useCases: body.useCases ?? [],
      published: body.published ? 1 : 0,
      seoTitle: body.seoTitle ?? null,
      seoDescription: body.seoDescription ?? null,
    } as any);

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get('slug');
    if (!slug) {
      return NextResponse.json({ error: 'Slug required' }, { status: 400 });
    }
    const db = getDb();
    const existing = await db.execute({ sql: 'SELECT id FROM products WHERE slug = ?', args: [slug] });
    if (existing.rows.length === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    await deleteProduct(slug);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
