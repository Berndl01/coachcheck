import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Humatrix Coach Assessment — Premium Edition',
  description: 'Wie wirkt dein Trainerstil wirklich? Hybrides Premium-Assessment für Führungsarchitektur, Coach Impact und Teamdynamik im Sport.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
