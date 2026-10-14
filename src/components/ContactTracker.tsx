'use client';

import { useContactTracking } from '@/hooks/useContactTracking';

/**
 * Installs the global contact-click tracker. Mounted once in the root
 * layout so it covers every page. Renders nothing itself.
 */
export function ContactTracker() {
  useContactTracking();
  return null;
}
