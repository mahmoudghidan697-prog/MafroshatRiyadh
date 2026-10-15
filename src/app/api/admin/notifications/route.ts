import { NextRequest, NextResponse } from 'next/server';
import {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationRead,
  markAllNotificationsRead,
} from '@/lib/db';

export const dynamic = 'force-dynamic';

// NOTE: /api/admin/* is auth-guarded by src/middleware.ts

// GET /api/admin/notifications — notifications + unread count
export async function GET() {
  try {
    const [notifications, unread] = await Promise.all([getNotifications(), getUnreadNotificationCount()]);
    return NextResponse.json({ notifications, unread }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// PUT /api/admin/notifications — mark one (id) or all (all:true) as read
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (body?.all) {
      await markAllNotificationsRead();
      return NextResponse.json({ ok: true });
    }
    if (body?.id) {
      await markNotificationRead(Number(body.id));
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: 'id or all is required' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
