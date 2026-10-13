import { getSettings } from '@/lib/db';
import { business, contact, site } from '@/data/site';

/** The canonical site URL — admin-overridable via settings `site_url`,
 *  falling back to the static site.ts value. Drives canonical links,
 *  sitemap.xml, robots.txt and OG URLs. */
export async function getSiteUrl(): Promise<string> {
  try {
    const s = await getSettings();
    if (s.site_url && /^https?:\/\//.test(s.site_url)) {
      return s.site_url.replace(/\/$/, ''); // strip trailing slash
    }
  } catch {
    // DB unavailable — use static
  }
  return site.url;
}

/**
 * buildSeoHead — reads the admin's SEO settings from the DB and builds
 * the dynamic <head> pieces: title, description, keywords, OG/Twitter
 * tags, LocalBusiness JSON-LD, Google Analytics + Search Console
 * verification. Rendered once in the root layout. Falls back to the
 * static site.ts values when a setting is empty.
 */
export async function buildSeoHead() {
  let s: Record<string, string> = {};
  try {
    s = await getSettings();
  } catch {
    s = {};
  }

  const title = s.seo_title || `${business.name.ar} — ${business.tagline.ar}`;
  const description =
    s.seo_description || business.description.ar || '';
  const keywords = s.seo_keywords
    ? s.seo_keywords.split(',').map((k) => k.trim()).filter(Boolean)
    : ['سجاد', 'موكيت', 'أرضيات', 'مفروشات الرياض', 'سجاد مساجد'];
  const ogImage = s.og_image || '';
  const twitter = s.twitter_handle || '';
  const siteUrl = await getSiteUrl();

  // LocalBusiness JSON-LD — helps Google show the business in Maps.
  // Contact fields fall back to admin settings (so the schema always
  // reflects the numbers the admin saved) then to the static site.ts.
  let businessSchema: any = null;
  if (s.business_schema_enabled !== '0') {
    const phone = s.phone || contact.phone || '';
    const street = s.address_ar || contact.address?.ar || '';
    const email = s.email || contact.email || '';
    businessSchema = {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      name: business.name.ar,
      description: description,
      image: ogImage ? new URL(ogImage, siteUrl).toString() : undefined,
      url: siteUrl,
      telephone: phone || undefined,
      email: email || undefined,
      address: {
        '@type': 'PostalAddress',
        streetAddress: street,
        addressLocality: 'Riyadh',
        addressCountry: 'SA',
      },
      openingHours: 'Sa-Th 09:00-21:00',
      priceRange: '$$',
    };
  }

  return { title, description, keywords, ogImage, twitter, businessSchema, s, siteUrl };
}

/** Google Analytics snippet (gtag.js). Returns { id, script } or null. */
export function analyticsScript(id: string): { id: string; script: string } | null {
  if (!id) return null;
  const script = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${id}');
  `;
  return { id, script };
}
