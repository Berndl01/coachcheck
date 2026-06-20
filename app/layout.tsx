import type { Metadata, Viewport } from 'next';
import { CookieBanner } from '@/components/cookie-banner';
import { LocaleProvider } from '@/components/i18n/locale-provider';
import { getLocale } from '@/lib/i18n/server';
import { makeT } from '@/lib/i18n';
import './globals.css';

export async function generateMetadata(): Promise<Metadata> {
  const t = makeT(await getLocale());
  return {
    title: t('meta.title'),
    description: t('meta.description'),
  };
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#1B1C1E',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  return (
    <html lang={locale}>
      <body>
        <LocaleProvider locale={locale}>
          {children}
          <CookieBanner />
        </LocaleProvider>
      </body>
    </html>
  );
}
