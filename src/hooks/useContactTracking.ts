'use client';

import { useEffect } from 'react';

/**
 * useContactTracking — installs a single global click listener that
 * records every WhatsApp (wa.me) and phone (tel:) click on the page,
 * regardless of which component rendered the link.
 *
 * Why event delegation instead of editing 15 individual links:
 *   - ONE listener catches every current AND future contact link.
 *   - No double-counting: a single delegated handler fires exactly once
 *     per click (unlike per-component listeners that can stack on remount).
 *   - Tracking NEVER blocks navigation: we use navigator.sendBeacon (or a
 *     fetch with keepalive) which fires without delaying the link opening.
 *   - We only track anchors whose resolved href is a wa.me / tel: link —
 *     ordinary links are ignored.
 *
 * The server distinguishes "clicked" from "completed": a recorded event
 * means the user tapped the link, NOT that a message was sent or a call
 * connected.
 */
export function useContactTracking() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Stable anonymous session id (per browser tab/session)
    let sessionId = sessionStorage.getItem('ms_track_session');
    if (!sessionId) {
      sessionId = 's_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
      sessionStorage.setItem('ms_track_session', sessionId);
    }

    function send(type: 'whatsapp' | 'phone', contact: string) {
      const payload = JSON.stringify({
        type,
        contact,
        pageUrl: window.location.pathname + window.location.search,
        pageTitle: document.title,
        sessionId,
      });
      // sendBeacon survives page unload/navigation and never blocks the click.
      // Fall back to a keepalive fetch if sendBeacon is unavailable.
      try {
        if (navigator.sendBeacon) {
          navigator.sendBeacon('/api/track', new Blob([payload], { type: 'application/json' }));
        } else {
          fetch('/api/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: payload,
            keepalive: true,
          }).catch(() => {});
        }
      } catch {
        // Tracking failure must NEVER break the contact link — swallow it.
      }
    }

    function onClick(e: MouseEvent) {
      // Find the nearest anchor (works even if an icon inside the <a> is clicked)
      const anchor = (e.target as HTMLElement)?.closest?.('a');
      if (!anchor) return;
      const href = anchor.getAttribute('href') || '';

      // WhatsApp: https://wa.me/<number> or api.whatsapp.com
      if (/wa\.me\/\+?\d{6,20}/i.test(href) || /api\.whatsapp\.com\/send/i.test(href)) {
        const m = href.match(/wa\.me\/(\+?\d{6,20})/i) || href.match(/phone=(\+?\d{6,20})/i);
        if (m) {
          e.preventDefault(); // hold navigation just long enough to send
          send('whatsapp', m[1].replace(/^\+/, ''));
          // Open in a new tab (preserve existing target behavior)
          window.open(href, anchor.target || '_blank', 'noopener,noreferrer');
          return;
        }
      }

      // Phone: tel:<number>
      if (/^tel:\+?[\d\s()-]{6,25}/i.test(href)) {
        const m = href.match(/^tel:(\+?[\d\s()-]{6,25})/i);
        if (m) {
          const contact = m[1].replace(/[\s()-]/g, '');
          // tel: doesn't navigate the tab, so we DON'T preventDefault —
          // just record and let the dialer open natively.
          send('phone', contact);
        }
      }
    }

    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);
}
