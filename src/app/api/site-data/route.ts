import { NextResponse } from 'next/server';
import { getProducts, getCategories, getSettings, getApprovedTestimonials, getContentSection } from '@/lib/db';

// Public catalog API. The LOGO/settings/testimonials must be LIVE (not
// cached) — a cached payload is exactly why an admin-approved review or
// an uploaded logo never appeared on the public site. We force dynamic
// rendering (revalidate = 0) + no-store so admin changes show instantly.
export const revalidate = 0;
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Run all queries in parallel — sequential awaits were adding
    // ~1.8s of round-trip latency to every public page load.
    const [products, categories, settings, testimonials, services, faqs] = await Promise.all([
      getProducts(),
      getCategories(),
      getSettings(),
      getApprovedTestimonials(),
      getContentSection('services'),
      getContentSection('faqs'),
    ]);
    return NextResponse.json(
      { products, categories, settings, testimonials, services, faqs },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
