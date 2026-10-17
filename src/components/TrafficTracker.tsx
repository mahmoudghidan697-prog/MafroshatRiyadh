'use client';

import { useEffect, useRef } from 'react';

/**
 * TrafficTracker — records a page view on every route change.
 *
 * Privacy-conscious: uses an anonymous visitor ID (localStorage) and a
 * session ID. No personal data is collected. A session expires after 30
 * minutes of inactivity. Duration is measured from page load to unload.
 *
 * This system is SEPARATE from the merchant contact-click tracker —
 * page views never become billable contact clicks.
 */
export function TrafficTracker() {
  const startTimeRef = useRef(Date.now());
  const lastUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Stable anonymous visitor ID
    let visitorId = localStorage.getItem('ms_visitor_id');
    if (!visitorId) {
      visitorId = 'v_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem('ms_visitor_id', visitorId);
    }

    // Session ID — expires after 30 min of inactivity
    const SESSION_KEY = 'ms_analytics_session';
    const SESSION_TTL = 30 * 60 * 1000;
    let sessionId = sessionStorage.getItem(SESSION_KEY);
    let isNewSession = false;
    if (!sessionId) {
      sessionId = 's_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
      sessionStorage.setItem(SESSION_KEY, sessionId);
      isNewSession = true;
    }
    // Refresh session expiry on each page view
    sessionStorage.setItem(SESSION_KEY, sessionId);

    const pageUrl = window.location.pathname + window.location.search;
    const pageTitle = document.title;
    const referrer = document.referrer || null;

    // UTM parameters
    const params = new URLSearchParams(window.location.search);
    const utmSource = params.get('utm_source');
    const utmMedium = params.get('utm_medium');
    const utmCampaign = params.get('utm_campaign');

    // Only record if the URL actually changed (avoid double-fires in StrictMode)
    if (lastUrlRef.current === pageUrl) return;
    lastUrlRef.current = pageUrl;

    const payload = JSON.stringify({
      visitorId,
      sessionId,
      pageUrl,
      pageTitle,
      referrer,
      utmSource,
      utmMedium,
      utmCampaign,
      isNewSession,
      durationSeconds: Math.round((Date.now() - startTimeRef.current) / 1000),
    });

    // Use sendBeacon for reliability (survives page unload)
    try {
      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/analytics/track', new Blob([payload], { type: 'application/json' }));
      } else {
        fetch('/api/analytics/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
          keepalive: true,
        }).catch(() => {});
      }
    } catch {
      // Tracking must never break the page
    }

    // Update duration on page unload
    const onUnload = () => {
      const duration = Math.round((Date.now() - startTimeRef.current) / 1000);
      try {
        navigator.sendBeacon('/api/analytics/track', new Blob([JSON.stringify({
          visitorId, sessionId, pageUrl, pageTitle, referrer,
          utmSource, utmMedium, utmCampaign,
          isNewSession: false, durationSeconds: duration,
        })], { type: 'application/json' }));
      } catch { /* ignore */ }
    };
    window.addEventListener('beforeunload', onUnload);
    return () => window.removeEventListener('beforeunload', onUnload);
  }, []);

  return null;
}
