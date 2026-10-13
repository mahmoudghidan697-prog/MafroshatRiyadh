import { NextRequest, NextResponse } from 'next/server';
import { getDb, getProducts, getCategories, createProduct, deleteProduct } from '@/lib/db';

export async function GET() {
  const products = await getProducts();
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
      price: body.price ?? null,
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
