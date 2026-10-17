import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { categories, getCategory } from '@/data/site';
import CategoryContent from './CategoryContent';

// Products are rendered on-demand (dynamic) so admin edits appear immediately.
export const dynamic = 'force-dynamic';

export function generateStaticParams() {
  return categories.map((c) => ({ category: c.id }));
}

export async function generateMetadata({
  params,
}: {
  params: { category: string };
}): Promise<Metadata> {
  const category = getCategory(params.category);
  if (!category) {
    return {
      title: 'القسم غير موجود | مفروشات السريع',
      description: 'القسم المطلوب غير موجود.',
    };
  }

  const title = `${category.name.ar} في الرياض | مفروشات السريع`;
  const description = category.description.ar;

  return {
    title,
    description,
    alternates: { canonical: `/${category.id}` },
    openGraph: {
      title,
      description,
      type: 'website',
      locale: 'ar_SA',
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default function Page({ params }: { params: { category: string } }) {
  const category = getCategory(params.category);
  if (!category) notFound();

  return <CategoryContent categoryId={params.category} />;
}
