import type { Metadata } from 'next';
import { Inter, Cairo } from 'next/font/google';
import './globals.css';
import { AppProvider } from '@/context/AppContext';
import { ToastProvider } from '@/components/admin/Toast';
import { business, site, contact } from '@/data/site';
import { buildSeoHead, analyticsScript } from '@/lib/seo';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { FloatingContact } from '@/components/FloatingContact';
import { AdminBar } from '@/components/AdminBar';
import { ContactTracker } from '@/components/ContactTracker';
import { TrafficTracker } from '@/components/TrafficTracker';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  variable: '--font-cairo',
  display: 'swap',
});

// Dynamic SEO — reads the admin's SEO settings from the DB (title,
// description, keywords, OG/Twitter tags, verification). Falls back to
// the static site.ts values. Admin edits these in /admin/seo.
export async function generateMetadata(): Promise<Metadata> {
  const seo = await buildSeoHead();
  const extra: Record<string, string> = {};
  if (seo.s.google_search_console) {
    extra['google-site-verification'] = seo.s.google_search_console;
  }

  return {
    metadataBase: new URL(seo.siteUrl),
    title: {
      default: seo.title,
      template: `%s — ${business.name.ar}`,
    },
    description: seo.description,
    keywords: seo.keywords,
    alternates: {
      canonical: '/',
      languages: { ar: '/', en: '/?lang=en' },
    },
    openGraph: {
      type: 'website',
      locale: 'ar_SA',
      siteName: business.name.ar,
      title: seo.title,
      description: seo.description,
      images: seo.ogImage ? [{ url: seo.ogImage, width: 1200, height: 630 }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: seo.title,
      description: seo.description,
      images: seo.ogImage ? [seo.ogImage] : undefined,
      creator: seo.twitter || undefined,
    },
    robots: { index: true, follow: true },
    other: Object.keys(extra).length ? extra : undefined,
  };
}

// Anti-flicker theme bootstrap — runs before paint.
// DEFAULT = dark (user's preference). Light only when the visitor
// explicitly chose it (ms_theme=light in localStorage).
const themeScript = `(function(){try{var t=localStorage.getItem('ms_theme');var d=t!=='light';if(d){document.documentElement.classList.add('dark');}var l=localStorage.getItem('ms_locale');if(l==='en'){document.documentElement.dir='ltr';document.documentElement.lang='en';}else{document.documentElement.dir='rtl';document.documentElement.lang='ar';}}catch(e){}})();`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // SEO schema + analytics are injected client-side via a small
  // script that fetches /api/site-data (which reads from Turso).
  // This avoids needing a sync DB call in the layout (which runs
  // on both Edge and Node runtimes).

  return (
    <html suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body
        className={`${inter.variable} ${cairo.variable} bg-ivory text-charcoal dark:bg-charcoal dark:text-ivory antialiased`}
      >
        <AppProvider>
          <ToastProvider>
            <a
              href="#main"
              className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:top-4 focus:inset-inline-start-4 focus:bg-forest focus:text-white focus:px-4 focus:py-2 focus:rounded-lg"
            >
              تخطَّ إلى المحتوى
            </a>
            <ContactTracker />
            <TrafficTracker />
            <Header />
            <main id="main" className="min-h-[60vh]">
              {children}
            </main>
            <Footer />
            <FloatingContact />
            <AdminBar />
          </ToastProvider>
        </AppProvider>
      </body>
    </html>
  );
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FBF8F3' },
    { media: '(prefers-color-scheme: dark)', color: '#1C1F1E' },
  ],
};
