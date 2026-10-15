'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
  contacts: Record<string, { number: string; type: string }>;
  loading: boolean;
  /** true when data came from the live database */
  live: boolean;
  /** Force a re-fetch (e.g. after editing a contact number inline) */
  refresh: () => void;
}

const CACHE_KEY = 'ms_site_data_v1';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface CachePayload {
  products: Product[];
  categories: Category[];
  contacts: Record<string, { number: string; type: string }>;
  ts: number;
}

function readCache(): CachePayload | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.ts > CACHE_TTL) return null;
    if (!parsed.products?.length) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(products: Product[], categories: Category[], contacts: Record<string, { number: string; type: string }>) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ products, categories, contacts, ts: Date.now() }));
  } catch {
    // storage full or unavailable — ignore
  }
}

function clearCache() {
  try {
    sessionStorage.removeItem(CACHE_KEY);
  } catch {
    // ignore
  }
}

/**
 * useSiteData — fetches the live catalog from the database-backed
 * API and falls back to the static seed data (src/data/site.ts) if
 * the request fails or returns nothing. This makes admin changes
 * (add/edit/delete products) appear on the public site automatically.
 */
export function useSiteData(): SiteData {
  const cached = typeof window !== 'undefined' ? readCache() : null;
  const [data, setData] = useState<{
    products: Product[];
    categories: Category[];
    testimonials: ApprovedTestimonial[];
    services: any[];
    faqs: any[];
    settings: Record<string, string>;
    contacts: Record<string, { number: string; type: string }>;
    live: boolean;
  }>({
    // Show cached data instantly if available (no skeleton flash)
    products: cached?.products ?? [],
    categories: cached?.categories ?? staticCategories,
    testimonials: [],
    services: staticServices as any,
    faqs: staticFaqs as any,
    settings: {},
    // Use cached contacts if available — but if the cache has no contacts
    // (older cache format), start empty so useContacts doesn't fall back
    // to the static placeholder number during the fetch.
    contacts: cached?.contacts ?? {},
    live: !!cached && !!cached?.contacts,
  });
  // If we have cached products but NO cached contacts, keep loading=true
  // until the fetch delivers contacts — prevents the placeholder flash.
  const [loading, setLoading] = useState(!cached || !cached?.contacts);

  // fetch function — defined at component level so refresh() can reuse it
  const loadRef = useRef<() => Promise<void>>(async () => {});
  const refresh = useCallback(() => {
    // Clear the stale sessionStorage cache so the re-fetch gets fresh data
    clearCache();
    loadRef.current();
  }, []);

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
          const freshContacts = json.contacts ?? {};
          setData({
            products: json.products,
            categories: json.categories?.length ? json.categories : staticCategories,
            testimonials: json.testimonials ?? [],
            services: json.services?.length ? json.services.map((s: any) => s.data) : (staticServices as any),
            faqs: json.faqs?.length ? json.faqs.map((f: any) => f.data) : (staticFaqs as any),
            settings: json.settings ?? {},
            contacts: freshContacts,
            live: true,
          });
          // Cache for instant load on next navigation (includes contacts!)
          writeCache(json.products, json.categories?.length ? json.categories : staticCategories, freshContacts);
        }
      } catch {
        // Network/DB error — fall back to cache, then static seed
        if (!cached) {
          setData({
            products: staticProducts,
            categories: staticCategories,
            testimonials: [],
            services: staticServices as any,
            faqs: staticFaqs as any,
            settings: {},
            contacts: {},
            live: false,
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadRef.current = load;
    load();
    return () => {
      cancelled = true;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { ...data, loading, refresh };
}
