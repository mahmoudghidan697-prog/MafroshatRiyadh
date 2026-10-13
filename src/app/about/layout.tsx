import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'من نحن',
  description:
    'تعرّف على مفروشات السريع — خبرة طويلة في السجاد والموكيت والأرضيات في الرياض، بمنتجات عالية الجودة وخدمة قياس وتركيب وتوصيل احترافية.',
  alternates: {
    canonical: '/about',
    languages: {
      'ar-SA': '/about',
      'en-SA': '/about',
    },
  },
  openGraph: {
    title: 'من نحن | مفروشات السريع',
    description:
      'خبرة في السجاد والموكيت والأرضيات في الرياض مع خدمة احترافية للقياس والتركيب والتوصيل.',
    locale: 'ar_SA',
    type: 'website',
  },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
