import { NextRequest, NextResponse } from 'next/server';
import { getSettings, saveSettings } from '@/lib/db';

export async function GET() {
  return NextResponse.json({ settings: await getSettings() });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.settings || typeof body.settings !== 'object') {
      return NextResponse.json({ error: 'settings object required' }, { status: 400 });
    }
    await saveSettings(body.settings);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
