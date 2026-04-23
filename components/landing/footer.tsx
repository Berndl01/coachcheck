import Link from 'next/link';
import { HumatrixLogo } from '@/components/logo';

export function Footer() {
  return (
    <footer className="bg-ink text-muted-dark pt-16 pb-8 px-4 md:px-8">
      <div className="max-w-[1440px] mx-auto grid grid-cols-1 md:grid-cols-[1.3fr_2fr] gap-12 md:gap-16">
        <div>
          <div style={{ color: 'var(--bone)' }}>
            <HumatrixLogo color="var(--bone)" size={40} />
          </div>
          <p className="font-editorial text-base leading-[1.45] text-bone-soft mt-6 max-w-[38ch]">
            Diagnostik für Führung, Team und Mindset.<br />
            Entwickelt in Wien, eingesetzt international.
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-8">
          <div>
            <h5 className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-gold font-medium mb-4">
              Sport Edition
            </h5>
            <ul className="space-y-2 text-sm">
              <li><Link href="/#products" className="text-bone-soft hover:text-gold transition">Alle Pakete</Link></li>
              <li><Link href="/#architecture" className="text-bone-soft hover:text-gold transition">Architektur</Link></li>
              <li><Link href="/#archetypes" className="text-bone-soft hover:text-gold transition">12 Archetypen</Link></li>
            </ul>
          </div>
          <div>
            <h5 className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-gold font-medium mb-4">
              Humatrix
            </h5>
            <ul className="space-y-2 text-sm">
              <li><a href="https://check.humatrix.cc" className="text-bone-soft hover:text-gold transition">Mindset Check</a></li>
              <li><a href="#" className="text-bone-soft hover:text-gold transition">Leadership Edition</a></li>
              <li><a href="#" className="text-bone-soft hover:text-gold transition">Über uns</a></li>
            </ul>
          </div>
          <div>
            <h5 className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-gold font-medium mb-4">
              Rechtliches
            </h5>
            <ul className="space-y-2 text-sm">
              <li><a href="/legal/impressum" className="text-bone-soft hover:text-gold transition">Impressum</a></li>
              <li><a href="/legal/datenschutz" className="text-bone-soft hover:text-gold transition">Datenschutz</a></li>
              <li><a href="/legal/agb" className="text-bone-soft hover:text-gold transition">AGB</a></li>
              <li><a href="mailto:hello@humatrix.cc" className="text-bone-soft hover:text-gold transition">Kontakt</a></li>
            </ul>
          </div>
        </div>
      </div>
      <div className="max-w-[1440px] mx-auto mt-12 pt-8 border-t border-ink-line flex flex-wrap justify-between gap-4 font-mono text-[0.68rem] uppercase tracking-[0.12em]">
        <span>© 2026 Humatrix · The Mind Club Company</span>
        <span>Made in Austria · Vienna</span>
      </div>
    </footer>
  );
}
