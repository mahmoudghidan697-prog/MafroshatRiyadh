import { NextRequest, NextResponse } from 'next/server';
import { recordPageView } from '@/lib/db';

export const dynamic = 'force-dynamic';

// ─── Lightweight rate limiter (best-effort) ───
const RATE_WINDOW_MS = 60 * 1000;
const RATE_MAX = 60;
const hits = new Map<string, number[]>();

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const arr = (hits.get(key) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  if (arr.length >= RATE_MAX) { hits.set(key, arr); return true; }
  arr.push(now); hits.set(key, arr);
  if (hits.size > 5000) {
    for (const [k, v] of hits) { if (v.every((t) => now - t > RATE_WINDOW_MS)) hits.delete(k); }
  }
  return false;
}

function sanitizeText(v: unknown, max: number): string {
  return String(v ?? '').trim().slice(0, max);
}

function sanitizeUrl(v: unknown): string {
  let s = sanitizeText(v, 300);
  if (!s.startsWith('/')) return '/';
  return s.replace(/[\r\n\t]/g, '');
}

function classifyDevice(ua: string): 'mobile' | 'tablet' | 'desktop' | 'unknown' {
  const u = ua.toLowerCase();
  if (/ipad|tablet|playbook|silk/i.test(u)) return 'tablet';
  if (/mobi|android|iphone|ipod|windows phone|blackberry|opera mini/i.test(u)) return 'mobile';
  if (/windows|macintosh|linux|x11/i.test(u)) return 'desktop';
  return 'unknown';
}

/**
 * POST /api/analytics/track — record a page view.
 * UNAUTHENTICATED but validated + rate-limited. NEVER returns analytics data.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') return NextResponse.json({ error: 'Invalid body' }, { status: 400 });

    const visitorId = sanitizeText(body.visitorId, 64);
    const sessionId = sanitizeText(body.sessionId, 64);
    if (!visitorId || !sessionId) return NextResponse.json({ error: 'visitorId and sessionId required' }, { status: 400 });

    const pageUrl = sanitizeUrl(body.pageUrl);
    const pageTitle = sanitizeText(body.pageTitle, 200) || null;
    const referrer = sanitizeText(body.referrer, 300) || null;
    const utmSource = sanitizeText(body.utmSource, 100) || null;
    const utmMedium = sanitizeText(body.utmMedium, 100) || null;
    const utmCampaign = sanitizeText(body.utmCampaign, 100) || null;
    const isNewSession = body.isNewSession === true;
    const durationSeconds = Number.isFinite(Number(body.durationSeconds)) ? Math.max(0, Math.min(3600, Number(body.durationSeconds))) : null;

    const ua = req.headers.get('user-agent') ?? '';
    const deviceType = classifyDevice(ua);

    if (isRateLimited(visitorId)) {
      return NextResponse.json({ ok: true, logged: false });
    }

    await recordPageView({ visitorId, sessionId, pageUrl, pageTitle: pageTitle ?? undefined, deviceType, referrer: referrer ?? undefined, utmSource: utmSource ?? undefined, utmMedium: utmMedium ?? undefined, utmCampaign: utmCampaign ?? undefined, isNewSession, durationSeconds: durationSeconds ?? undefined });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true, logged: false });
  }
}
