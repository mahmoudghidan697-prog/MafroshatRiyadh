'use client';

import { useCallback } from 'react';
import { useSiteData } from '@/hooks/useSiteData';
import { contact as staticContact } from '@/data/site';

/**
 * useContacts — resolves each contact icon's destination number from the
 * DB-backed config (fetched via useSiteData). Each frontend icon passes
 * its stable `key`; the number comes from the admin-managed `contacts`
 * table, falling back to the static site.ts value when missing/inactive.
 *
 * This gives the admin per-icon control: changing "header_whatsapp"'s
 * number in the dashboard changes ONLY the header icon, never the footer
 * or floating button.
 */
export function useContacts() {
  const { contacts } = useSiteData();

  /** wa.me URL for a given icon key (falls back to the global number). */
  const waLink = useCallback(
    (key: string, message?: string): string => {
      const num = contacts?.[key]?.number || staticContact.whatsapp;
      const base = `https://wa.me/${num}`;
      return message ? `${base}?text=${encodeURIComponent(message)}` : base;
    },
    [contacts],
  );

  /** tel: URL for a given icon key (falls back to the global number). */
  const phoneLink = useCallback(
    (key: string): string => {
      const num = contacts?.[key]?.number || staticContact.phone;
      return `tel:${num}`;
    },
    [contacts],
  );

  /** Raw number for a key (for display, dir=ltr). */
  const number = useCallback(
    (key: string): string => contacts?.[key]?.number || '',
    [contacts],
  );

  return { waLink, phoneLink, number, contacts };
}
