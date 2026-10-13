import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/seo';
import { getSettings } from '@/lib/db';

// robots.txt — reads the admin's custom robots rules from the DB
// (settings key `robots_txt`). If empty, uses the default (allow all
// except /admin and /api). Admin edits it in /admin/seo.
export default async function robots(): Promise<MetadataRoute.Robots> {
  let custom = '';
  try {
    const s = await getSettings();
    custom = s.robots_txt || '';
  } catch {
    // DB unavailable at build time — use defaults
  }

  const siteUrl = await getSiteUrl();
  const sitemap = `${siteUrl}/sitemap.xml`;

  if (custom.trim()) {
    // Parse the custom robots.txt into disallow/allow lines
    const disallow: string[] = [];
    const allow: string[] = [];
    for (const rawLine of custom.split(/\r?\n/)) {
      const line = rawLine.trim();
      const m = line.match(/^(Disallow|Allow)\s*:\s*(.+)$/i);
      if (!m) continue;
      const value = m[2].trim();
      if (m[1].toLowerCase() === 'disallow' && value) disallow.push(value);
      if (m[1].toLowerCase() === 'allow' && value) allow.push(value);
    }
    return {
      rules: { userAgent: '*', allow: allow.length ? allow : ['/'], disallow },
      sitemap,
      host: siteUrl,
    };
  }

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/api/'],
    },
    sitemap,
    host: siteUrl,
  };
}
