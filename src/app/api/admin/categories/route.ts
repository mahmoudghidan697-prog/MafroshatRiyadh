import { NextRequest, NextResponse } from 'next/server';
import { getDb, createCategory, updateCategory, deleteCategory } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const db = getDb();
    if (!body.id || !body.name?.ar || !body.name?.en) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    const existing = await db.execute({ sql: 'SELECT id FROM categories WHERE id = ?', args: [body.id] });
    if (existing.rows.length > 0) {
      return NextResponse.json({ error: 'Category ID already exists' }, { status: 409 });
    }
    await createCategory({
      id: body.id,
      name: { ar: body.name.ar, en: body.name.en },
      description: { ar: body.description?.ar ?? '', en: body.description?.en ?? '' },
      image: body.image ?? '/images/categories/default.jpg',
    });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const db = getDb();
    if (!body.id) {
      return NextResponse.json({ error: 'Category ID required' }, { status: 400 });
    }
    const existing = await db.execute({ sql: 'SELECT id FROM categories WHERE id = ?', args: [body.id] });
    if (existing.rows.length === 0) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }
    await updateCategory(body.id, {
      name: { ar: body.name.ar, en: body.name.en },
      description: { ar: body.description?.ar ?? '', en: body.description?.en ?? '' },
      image: body.image,
      primaryProductId: body.primaryProductId,
    });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
    const db = getDb();
    const existing = await db.execute({ sql: 'SELECT id FROM categories WHERE id = ?', args: [id] });
    if (existing.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    await deleteCategory(id);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
