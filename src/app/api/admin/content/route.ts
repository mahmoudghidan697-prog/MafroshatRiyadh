import { NextRequest, NextResponse } from 'next/server';
import {
  getContentSection,
  upsertContentItem,
  deleteContentItem,
  setContentPublished,
} from '@/lib/db';

export const dynamic = 'force-dynamic';

const VALID_SECTIONS = ['services', 'faqs', 'hero', 'about'];

/** GET /api/admin/content?section=services — list items in a section */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const section = searchParams.get('section') || '';
  if (!VALID_SECTIONS.includes(section)) {
    return NextResponse.json({ error: 'valid section required' }, { status: 400 });
  }
  return NextResponse.json({ items: await getContentSection(section) });
}

/** POST — create or update an item.
 *  body: { section, item_id, data, sort_order? } */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { section, item_id, data, sort_order } = body;
    if (!section || !VALID_SECTIONS.includes(section)) {
      return NextResponse.json({ error: 'valid section required' }, { status: 400 });
    }
    if (!item_id || typeof item_id !== 'string') {
      return NextResponse.json({ error: 'item_id required' }, { status: 400 });
    }
    if (!data || typeof data !== 'object') {
      return NextResponse.json({ error: 'data object required' }, { status: 400 });
    }
    await upsertContentItem(section, item_id, data, Number(sort_order) || 0);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

/** PUT — toggle publish state. body: { section, item_id, published } */
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { section, item_id, published } = body;
    if (!section || !VALID_SECTIONS.includes(section) || !item_id) {
      return NextResponse.json({ error: 'section and item_id required' }, { status: 400 });
    }
    await setContentPublished(section, item_id, !!published);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

/** DELETE — remove an item. ?section=services&item_id=service-1 */
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const section = searchParams.get('section') || '';
    const item_id = searchParams.get('item_id') || '';
    if (!VALID_SECTIONS.includes(section) || !item_id) {
      return NextResponse.json({ error: 'section and item_id required' }, { status: 400 });
    }
    await deleteContentItem(section, item_id);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
