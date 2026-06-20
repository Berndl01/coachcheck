// i18n-Grundkonfiguration (zweisprachig DE/EN). Deutsch bleibt Standard.
export const locales = ['de', 'en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'de';
export const LOCALE_COOKIE = 'cc_locale';

export function isLocale(value: string | undefined | null): value is Locale {
  return value === 'de' || value === 'en';
}
