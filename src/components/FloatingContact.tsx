'use client';

import { useApp } from '@/context/AppContext';
import { useContacts } from '@/hooks/useContacts';
import { WhatsAppIcon, PhoneIcon, CloseIcon } from './Icons';
import { useState } from 'react';

export function FloatingContact() {
  const { locale, t } = useApp();
  const { waLink, phoneLink } = useContacts();
  const [expanded, setExpanded] = useState(false);
  const waDefault = waLink('floating_whatsapp', t.whatsappMessageDefault);

  return (
    <>
      {/* ═══ Floating contact widget (desktop) — bottom end, above footer content ═══ */}
      <div className="hidden md:flex fixed bottom-6 inset-inline-end-6 z-40 flex-col items-end gap-3">
        {/* Expanded buttons */}
        {expanded && (
          <div className="flex flex-col gap-3 fade-in">
            <a
              href={waDefault}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t.whatsapp}
              title={t.whatsappTooltip}
              data-contact-key="floating_whatsapp"
              className="btn-press w-12 h-12 rounded-full bg-[#25D366] text-white shadow-float flex items-center justify-center hover:scale-105"
            >
              <WhatsAppIcon />
            </a>
            <a
              href={phoneLink('floating_phone')}
              aria-label={t.call}
              title={t.callTooltip}
              data-contact-key="floating_phone"
              className="btn-press w-12 h-12 rounded-full bg-forest text-ivory shadow-float flex items-center justify-center hover:scale-105"
            >
              <PhoneIcon />
            </a>
          </div>
        )}

        {/* Toggle FAB */}
        <button
          onClick={() => setExpanded(!expanded)}
          aria-label={expanded ? t.close : t.navContact}
          aria-expanded={expanded}
          className={`btn-press w-14 h-14 rounded-full shadow-float flex items-center justify-center transition-all duration-300 ${
            expanded
              ? 'bg-charcoal text-ivory rotate-0'
              : 'bg-forest text-ivory hover:scale-105'
          }`}
        >
          {expanded ? <CloseIcon className="w-5 h-5" /> : <PhoneIcon className="w-5 h-5" />}
        </button>
      </div>

      {/* ═══ Mobile sticky contact bar ═══ */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-40 flex border-t border-charcoal/10 dark:border-charcoal-border/30 bg-ivory/95 dark:bg-charcoal/95 backdrop-blur-md" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <a
          href={waDefault}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-press flex-1 flex items-center justify-center gap-2 h-14 text-sm font-medium text-white bg-[#25D366]"
          data-contact-key="floating_whatsapp"
        >
          <WhatsAppIcon className="w-5 h-5" />
          {t.whatsapp}
        </a>
        <a
          href={phoneLink('floating_phone')}
          className="btn-press flex-1 flex items-center justify-center gap-2 h-14 text-sm font-medium text-ivory bg-forest"
          data-contact-key="floating_phone"
        >
          <PhoneIcon className="w-5 h-5" />
          {t.call}
        </a>
      </div>

      {/* Spacer so mobile bar doesn't cover content */}
      <div className="md:hidden h-14" aria-hidden="true" />
    </>
  );
}
