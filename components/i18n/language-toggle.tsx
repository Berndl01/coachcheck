'use client';
import { useRouter } from 'next/navigation';
import { useLocale } from './locale-provider';
import { locales, LOCALE_COOKIE, type Locale } from '@/lib/i18n/config';

/** DE/EN-Umschalter: setzt das Locale-Cookie und lädt die Server-Komponenten neu. */
export function LanguageToggle() {
  const router = useRouter();
  const active = useLocale();

  function choose(next: Locale) {
    if (next === active) return;
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  }

  return (
    <div className="inline-flex items-center rounded-full border border-bone-line overflow-hidden font-mono text-[0.65rem] uppercase tracking-[0.1em]">
      {locales.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => choose(l)}
          aria-pressed={l === active}
          className={
            'px-2.5 py-1.5 transition ' +
            (l === active ? 'bg-ink text-bone' : 'text-muted hover:text-ink')
          }
        >
          {l}
        </button>
      ))}
    </div>
  );
}
