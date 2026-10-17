import type { Metadata } from 'next';
import { business } from '@/data/site';
import SolutionsContent from './SolutionsContent';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'الحلول التجارية والمشاريع',
    description:
      'نوفر حلول سجاد وأرضيات متكاملة للمنشآت التجارية والمشاريع في الرياض — مكاتب، مساجد، مستشفيات، فنادق، مدارس، ومساحات خارجية.',
    keywords: [
      'حلول تجارية',
      'سجاد مكاتب',
      'سجاد مساجد',
      'أرضيات مستشفيات',
      'سجاد فنادق',
      'أرضيات مدارس',
      'عشب صناعي',
      'أرضيات مطاطية',
    ],
    alternates: {
      canonical: '/solutions',
    },
    openGraph: {
      type: 'website',
      locale: 'ar_SA',
      siteName: business.name.ar,
      title: 'الحلول التجارية والمشاريع',
      description:
        'نوفر حلول سجاد وأرضيات متكاملة للمنشآت التجارية والمشاريع في الرياض.',
    },
    robots: { index: true, follow: true },
  };
}

export default function SolutionsPage() {
  return <SolutionsContent />;
}
