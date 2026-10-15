import { NextRequest, NextResponse } from 'next/server';
import { recordContactEvent } from '@/lib/db';

export const dynamic = 'force-dynamic';

// ─── Lightweight in-memory rate limiter ───
// Prevents spam/abuse: max 30 events per session per 5 minutes.
// (Serverless instances reset on cold start — this is a best-effort
//  guard, not a hard guarantee. The event type + field validation below
//  is the real defense against garbage submissions.)
const RATE_WINDOW_MS = 5 * 60 * 1000;
const RATE_MAX = 30;
const hits = new Map<string, number[]>();

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const arr = (hits.get(key) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  if (arr.length >= RATE_MAX) {
    hits.set(key, arr);
    return true;
  }
  arr.push(now);
  hits.set(key, arr);
  // Opportunistic cleanup so the map can't grow unbounded
  if (hits.size > 5000) {
    for (const [k, v] of hits) {
      if (v.every((t) => now - t > RATE_WINDOW_MS)) hits.delete(k);
    }
  }
  return false;
}

// ─── Validation helpers ───

function sanitizeText(v: unknown, max: number): string {
  return String(v ?? '').trim().slice(0, max);
}

// Only allow safe path-like page URLs (no external/protocol injection).
function sanitizePageUrl(v: unknown): string {
  let s = sanitizeText(v, 300);
  if (!s.startsWith('/')) return '/';
  // Strip control chars
  return s.replace(/[\r\n\t]/g, '');
}

// Normalize a WhatsApp number to digits only (wa.me/<digits>).
function extractWhatsapp(href: string): string | null {
  const m = href.match(/wa\.me\/(\+?\d{6,20})/i);
  return m ? m[1].replace(/^\+/, '') : null;
}

// Normalize a tel: number to a dialable string.
function extractPhone(href: string): string | null {
  const m = href.match(/^tel:(\+?[\d\s()-]{6,25})/i);
  return m ? m[1].replace(/[\s()-]/g, '') : null;
}

/**
 * POST /api/track — record a public contact click.
 *
 * Accepts EITHER:
 *   { type: 'whatsapp' | 'phone', contact, pageUrl, pageTitle, sessionId }
 * (contact = the number)
 *
 * This endpoint is intentionally UNAUTHENTICATED (visitors are anonymous)
 * but strictly validated + rate-limited. It NEVER returns analytics data.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
    }

    const type = body.type;
    const pageUrl = sanitizePageUrl(body.pageUrl);
    const pageTitle = sanitizeText(body.pageTitle, 200) || null;
    const sessionId = sanitizeText(body.sessionId, 64) || null;
    const contactKey = sanitizeText(body.contactKey, 64) || null;
    // Product attribution — the server re-derives merchant/agreement from
    // this slug; it is NOT a billing value the client can trust. Validated
    // as a slug shape only.
    const productSlugRaw = sanitizeText(body.productSlug, 100);
    const productSlug = /^[a-z0-9-]+$/i.test(productSlugRaw) ? productSlugRaw : null;

    // Determine + validate the contact number based on type
    let contact: string | null = null;
    if (type === 'whatsapp') {
      // Frontend may send either the number or the full wa.me href
      const raw = sanitizeText(body.contact ?? body.href, 100);
      contact = /^\+?\d{6,20}$/.test(raw) ? raw.replace(/^\+/, '') : extractWhatsapp(raw);
    } else if (type === 'phone') {
      const raw = sanitizeText(body.contact ?? body.href, 100);
      contact = /^\+?[\d]{6,20}$/.test(raw) ? raw.replace(/^\+/, '') : extractPhone(raw);
    }

    if (!contact) {
      return NextResponse.json({ error: 'Invalid or missing contact' }, { status: 400 });
    }
    if (type !== 'whatsapp' && type !== 'phone') {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    // Rate limit by session (fallback to IP via header on serverless)
    const rateKey = sessionId || req.headers.get('x-forwarded-for') || 'anon';
    if (isRateLimited(rateKey)) {
      return NextResponse.json({ error: 'Too many events' }, { status: 429 });
    }

    await recordContactEvent({
      type,
      contact,
      contactKey: contactKey ?? undefined,
      pageUrl,
      pageTitle: pageTitle ?? undefined,
      sessionId: sessionId ?? undefined,
      productSlug: productSlug ?? undefined,
    });

    // Fire-and-forget: always return fast so the link opens without delay
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    // NEVER block the user's click — return ok-ish so navigation proceeds.
    return NextResponse.json({ ok: true, logged: false });
  }
}
