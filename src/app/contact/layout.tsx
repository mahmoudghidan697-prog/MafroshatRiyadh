import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'اتصل بنا',
  description:
    'تواصل مع مفروشات السريع في الرياض عبر الواتساب أو الهاتف أو البريد الإلكتروني. زوروا معرضنا في حي المنفوحة أو أرسلوا استفساركم.',
  alternates: {
    canonical: '/contact',
    languages: {
      'ar-SA': '/contact',
      'en-SA': '/contact',
    },
  },
  openGraph: {
    title: 'اتصل بنا | مفروشات السريع',
    description:
      'تواصل مع مفروشات السريع في الرياض. واتساب، هاتف، بريد إلكتروني، ومعرضنا في المنفوحة.',
    locale: 'ar_SA',
    type: 'website',
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
