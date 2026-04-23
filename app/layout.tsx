import type { Metadata } from 'next';
import { CookieBanner } from '@/components/cookie-banner';
import './globals.css';

export const metadata: Metadata = {
  title: 'Humatrix Coach Assessment — Premium Edition',
  description: 'Wie wirkt dein Trainerstil wirklich? Hybrides Premium-Assessment für Führungsarchitektur, Coach Impact und Teamdynamik im Sport. Entwickelt in Tirol.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <body>
        {children}
        <CookieBanner />
      </body>
    </html>
  );
}
