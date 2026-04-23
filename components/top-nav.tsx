import Link from 'next/link';
import { HumatrixLogo } from './logo';
import { createClient } from '@/lib/supabase/server';

export async function TopNav() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-bone/85 border-b border-bone-line">
      <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-3 flex items-center justify-between gap-4">
        <Link href="/" aria-label="Humatrix Home">
          <HumatrixLogo />
        </Link>
        <nav className="hidden md:flex gap-7 font-mono text-xs uppercase tracking-[0.14em] text-muted">
          <a href="/#products" className="hover:text-ink transition">Pakete</a>
          <a href="/#architecture" className="hover:text-ink transition">Architektur</a>
          <a href="/#archetypes" className="hover:text-ink transition">12 Typen</a>
        </nav>
        {user ? (
          <Link
            href="/dashboard"
            className="font-mono text-xs uppercase tracking-[0.1em] px-4 py-2.5 bg-ink text-bone rounded-full hover:bg-gold hover:text-ink transition"
          >
            Dashboard
          </Link>
        ) : (
          <Link
            href="/login"
            className="font-mono text-xs uppercase tracking-[0.1em] px-4 py-2.5 bg-ink text-bone rounded-full hover:bg-gold hover:text-ink transition"
          >
            Login · Pakete
          </Link>
        )}
      </div>
    </header>
  );
}
