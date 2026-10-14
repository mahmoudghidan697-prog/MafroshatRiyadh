'use client';

import { useState, useEffect } from 'react';
import type { Product, Category } from '@/data/site';
import { products as staticProducts, categories as staticCategories, services as staticServices, faqs as staticFaqs } from '@/data/site';

export interface ApprovedTestimonial {
  id: number;
  name: string;
  role: string;
  quote: string;
  rating: number;
  status: string;
  createdAt: string;
}

interface SiteData {
  products: Product[];
  categories: Category[];
  testimonials: ApprovedTestimonial[];
  services: any[];
  faqs: any[];
  settings: Record<string, string>;
  loading: boolean;
  /** true when data came from the live database */
  live: boolean;
}

/**
 * useSiteData — fetches the live catalog from the database-backed
 * API and falls back to the static seed data (src/data/site.ts) if
 * the request fails or returns nothing. This makes admin changes
 * (add/edit/delete products) appear on the public site automatically.
 */
export function useSiteData(): SiteData {
  // Start EMPTY (loading) — never seed with static data. The static
  // seed contains old image paths (e.g. /images/products/gym-1.jpg),
  // so using it as the initial state makes stale images flash for
  // seconds before the live DB data (with new Blob URLs) replaces them.
  // Static data is kept only as a last-resort fallback on fetch failure.
  const [data, setData] = useState<{
    products: Product[];
    categories: Category[];
    testimonials: ApprovedTestimonial[];
    services: any[];
    faqs: any[];
    settings: Record<string, string>;
    live: boolean;
  }>({
    products: [],
    categories: staticCategories,
    testimonials: [],
    services: staticServices as any,
    faqs: staticFaqs as any,
    settings: {},
    live: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch('/api/site-data');
        if (!res.ok) return;
        const json = await res.json();
        if (cancelled) return;
        // Only use DB data if it actually has products
        if (json.products && json.products.length > 0) {
          setData({
            products: json.products,
            categories: json.categories?.length ? json.categories : staticCategories,
            testimonials: json.testimonials ?? [],
            services: json.services?.length ? json.services.map((s: any) => s.data) : (staticServices as any),
            faqs: json.faqs?.length ? json.faqs.map((f: any) => f.data) : (staticFaqs as any),
            settings: json.settings ?? {},
            live: true,
          });
        }
      } catch {
        // Network/DB error — fall back to static seed data
        setData({
          products: staticProducts,
          categories: staticCategories,
          testimonials: [],
          services: staticServices as any,
          faqs: staticFaqs as any,
          settings: {},
          live: false,
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { ...data, loading };
}
