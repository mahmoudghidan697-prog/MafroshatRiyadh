import type { Metadata } from 'next';
import { getProductBySlug, getProducts } from '@/lib/db';
import ProductDetail from './ProductDetail';

// Products are rendered on-demand (dynamic) so admin edits — new images,
// specs, prices — appear immediately instead of serving a stale
// pre-rendered HTML page from the build.
export const dynamic = 'force-dynamic';

export async function generateStaticParams() {
  try {
    const products = await getProducts();
    return products.map((p) => ({ slug: p.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const product = await getProductBySlug(params.slug);
  if (!product) return { title: 'Product not found' };
  // Per-product SEO (admin-editable) with sensible fallbacks
  const title = product.seoTitle || `${product.name.ar} | ${product.name.en}`;
  const description =
    product.seoDescription || product.description.ar?.slice(0, 160) || product.name.ar;
  return {
    title,
    description,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: {
      title,
      description,
      images: product.images?.[0] ? [{ url: product.images[0] }] : undefined,
      type: 'website',
    },
  };
}

export default function Page({ params }: { params: { slug: string } }) {
  return <ProductDetail params={params} />;
}
