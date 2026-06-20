// Server-seitiger Zugriff: liest Locale aus Cookie (Next 15: cookies() ist async).
import { cookies } from 'next/headers';
import { LOCALE_COOKIE, defaultLocale, isLocale, type Locale } from './config';
import { makeT } from './index';

export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const value = store.get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : defaultLocale;
}

export async function getT() {
  return makeT(await getLocale());
}
