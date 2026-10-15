/**
 * RiyalIcon — the official Saudi Riyal currency symbol (SAMA 2025).
 * Rendered as an inline <img> so it inherits surrounding text size and
 * color via CSS. The symbol is white on a transparent background, so it
 * adapts to both light and dark themes.
 *
 * Usage:
 *   <RiyalIcon className="w-4 h-4" />
 *   <RiyalIcon inline />              // inline with text, slightly smaller
 */
export function RiyalIcon({ className = 'w-4 h-4', inline = false }: { className?: string; inline?: boolean }) {
  return (
    <img
      src="/images/riyal-symbol.png"
      alt=""
      aria-hidden="true"
      className={`inline-block align-middle ${inline ? 'w-[0.85em] h-[0.85em] mx-0.5' : className}`}
      style={{ verticalAlign: 'baseline' }}
    />
  );
}
