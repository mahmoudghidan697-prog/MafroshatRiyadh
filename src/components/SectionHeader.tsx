import { ScrollReveal } from './ScrollReveal';

/** Consistent, refined section header used across the homepage. */
export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  align = 'center',
}: {
  /** Small label above the title (optional) */
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: 'center' | 'start';
}) {
  return (
    <ScrollReveal
      className={`mb-10 lg:mb-14 ${align === 'center' ? 'text-center' : 'text-start'}`}
    >
      {eyebrow && (
        <span className="inline-block text-xs font-semibold uppercase tracking-[0.2em] text-olive dark:text-olive/80 mb-3">
          {eyebrow}
        </span>
      )}
      <div className={`flex items-center gap-3 mb-4 ${align === 'center' ? 'justify-center' : ''}`}>
        <span className="h-px w-8 bg-forest/30 dark:bg-forest-light/30 hidden sm:block" />
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-charcoal dark:text-ivory tracking-tight">
          {title}
        </h2>
        <span className="h-px w-8 bg-forest/30 dark:bg-forest-light/30 hidden sm:block" />
      </div>
      {subtitle && (
        <p
          className={`text-charcoal/60 dark:text-ivory/60 max-w-2xl leading-relaxed ${
            align === 'center' ? 'mx-auto' : ''
          }`}
        >
          {subtitle}
        </p>
      )}
    </ScrollReveal>
  );
}
