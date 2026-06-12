import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { DataControls } from './data-controls';

export const dynamic = 'force-dynamic';

export default async function KontoDatenPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirectTo=/konto/daten');

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <div className="font-mono text-xs uppercase tracking-[0.2em] text-gold-deep mb-3">Datenschutz</div>
      <h1 className="font-display text-4xl tracking-[-0.02em] mb-2">Meine Daten</h1>
      <p className="text-muted mb-10 max-w-[60ch]">
        Verwalte hier deine bei Humatrix Coach gespeicherten Daten. Bei Fragen erreichst du uns
        unter <a href="mailto:office@humatrix.cc" className="text-gold-deep hover:underline">office@humatrix.cc</a>.
      </p>
      <DataControls />
    </main>
  );
}
