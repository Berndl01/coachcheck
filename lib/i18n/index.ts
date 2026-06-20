// t()-Fabrik: Punktpfad-Lookup mit Fallback DE -> Key (sichtbar, nie Crash).
import { dictionaries } from './dictionaries';
import { defaultLocale, type Locale } from './config';

function lookup(dict: unknown, path: string): string | undefined {
  const v = path.split('.').reduce<unknown>(
    (acc, k) => (acc && typeof acc === 'object' ? (acc as Record<string, unknown>)[k] : undefined),
    dict,
  );
  return typeof v === 'string' ? v : undefined;
}

export function makeT(locale: Locale) {
  return (key: string): string => {
    const primary = lookup(dictionaries[locale] ?? dictionaries[defaultLocale], key);
    if (primary !== undefined) return primary;
    const fallback = lookup(dictionaries[defaultLocale], key);
    return fallback !== undefined ? fallback : key;
  };
}
export type TFunc = ReturnType<typeof makeT>;
