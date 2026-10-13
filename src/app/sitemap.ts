import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/seo';
import { products as staticProducts, categories as staticCategories } from '@/data/site';
import { getProducts, getCategories } from '@/lib/db';

async function loadCatalog() {
  try {
    const products = await getProducts();
    const categories = await getCategories();
    if (products.length > 0) {
      return {
        products: products.map((p) => ({ slug: p.slug, createdAt: p.createdAt })),
        categories: categories.map((c) => ({ id: c.id })),
      };
    }
  } catch {
    // fall through to static
  }
  return {
    products: staticProducts.map((p) => ({ slug: p.slug, createdAt: p.createdAt })),
    categories: staticCategories.map((c) => ({ id: c.id })),
  };
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = await getSiteUrl();
  const now = new Date().toISOString();
  const { products, categories } = await loadCatalog();

  const entries: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${base}/catalog`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${base}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/contact`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    ...categories.map((c) => ({
      url: `${base}/catalog?category=${c.id}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
    ...products.map((p) => ({
      url: `${base}/products/${p.slug}`,
      lastModified: new Date(p.createdAt).toISOString(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
  ];

  return entries;
}
