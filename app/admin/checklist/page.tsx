import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { TopNav } from '@/components/top-nav';
import { Footer } from '@/components/landing/footer';

// Only accessible to the admin email(s)
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? 'bernhard.eller@humatrix.cc').split(',').map(s => s.trim());

type CheckItem = {
  label: string;
  status: 'ok' | 'warn' | 'err';
  detail: string;
};

export default async function AdminChecklistPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Simple admin check — for dev purposes
  const isAdmin = user.email && ADMIN_EMAILS.includes(user.email);
  if (!isAdmin) {
    return (
      <>
        <TopNav />
        <main className="max-w-3xl mx-auto px-4 md:px-8 py-16">
          <h1 className="font-display text-3xl">Nicht autorisiert</h1>
          <p className="text-muted mt-3">Diese Seite ist nur für Admins zugänglich.</p>
          <Link href="/dashboard" className="text-gold-deep hover:underline mt-6 inline-block">← Dashboard</Link>
        </main>
        <Footer />
      </>
    );
  }

  // Perform checks
  const checks: CheckItem[] = [];

  // 1. Supabase
  checks.push({
    label: 'Supabase URL',
    status: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'ok' : 'err',
    detail: process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'nicht gesetzt',
  });
  checks.push({
    label: 'Supabase Anon Key',
    status: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'ok' : 'err',
    detail: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✓ gesetzt (public)' : 'nicht gesetzt',
  });
  checks.push({
    label: 'Supabase Service Role Key',
    status: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'ok' : 'err',
    detail: process.env.SUPABASE_SERVICE_ROLE_KEY ? '✓ gesetzt (geheim)' : 'nicht gesetzt',
  });

  // 2. App URL
  checks.push({
    label: 'App URL',
    status: process.env.NEXT_PUBLIC_APP_URL ? 'ok' : 'warn',
    detail: process.env.NEXT_PUBLIC_APP_URL ?? 'fallback auf coachcheck.humatrix.cc',
  });

  // 3. Stripe
  const stripeKey = process.env.STRIPE_SECRET_KEY ?? '';
  const stripePubKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '';
  const stripeWebhook = process.env.STRIPE_WEBHOOK_SECRET ?? '';
  checks.push({
    label: 'Stripe Secret Key',
    status: stripeKey ? (stripeKey.startsWith('sk_live_') ? 'ok' : 'warn') : 'err',
    detail: stripeKey.startsWith('sk_live_') ? '🔴 LIVE-MODE aktiv' : stripeKey.startsWith('sk_test_') ? '🟡 Test-Mode' : 'nicht gesetzt',
  });
  checks.push({
    label: 'Stripe Publishable Key',
    status: stripePubKey ? (stripePubKey.startsWith('pk_live_') ? 'ok' : 'warn') : 'err',
    detail: stripePubKey.startsWith('pk_live_') ? '🔴 LIVE-MODE' : stripePubKey.startsWith('pk_test_') ? '🟡 Test-Mode' : 'nicht gesetzt',
  });
  checks.push({
    label: 'Stripe Webhook Secret',
    status: stripeWebhook ? 'ok' : 'err',
    detail: stripeWebhook ? '✓ gesetzt' : 'nicht gesetzt — Webhooks funktionieren nicht',
  });

  // 4. Anthropic
  checks.push({
    label: 'Anthropic API Key',
    status: process.env.ANTHROPIC_API_KEY ? 'ok' : 'err',
    detail: process.env.ANTHROPIC_API_KEY ? '✓ gesetzt' : 'Reports können nicht generiert werden',
  });

  // 5. Resend
  const resendKey = process.env.RESEND_API_KEY ?? '';
  const resendFrom = process.env.RESEND_FROM_EMAIL ?? '';
  checks.push({
    label: 'Resend API Key',
    status: resendKey ? 'ok' : 'warn',
    detail: resendKey ? '✓ gesetzt' : 'E-Mails werden nicht versendet',
  });
  checks.push({
    label: 'Resend FROM-Email',
    status: resendFrom ? (resendFrom.includes('resend.dev') ? 'warn' : 'ok') : 'warn',
    detail: resendFrom.includes('resend.dev')
      ? '🟡 Fallback-Domain aktiv (nur an Account-Owner-Mail). Verifiziere humatrix.cc in Resend.'
      : resendFrom || 'auto-fallback: onboarding@resend.dev',
  });

  // 6. DB checks
  let productCount = 0;
  let itemCount = 0;
  let archetypeCount = 0;
  let userCount = 0;
  let assessmentCount = 0;
  let reportCount = 0;

  try {
    const [prodRes, itemRes, archRes, userRes, axRes, reportRes] = await Promise.all([
      supabase.from('products').select('id', { count: 'exact', head: true }),
      supabase.from('items').select('id', { count: 'exact', head: true }),
      supabase.from('archetypes').select('id', { count: 'exact', head: true }),
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('assessments').select('id', { count: 'exact', head: true }),
      supabase.from('reports').select('id', { count: 'exact', head: true }),
    ]);
    productCount = prodRes.count ?? 0;
    itemCount = itemRes.count ?? 0;
    archetypeCount = archRes.count ?? 0;
    userCount = userRes.count ?? 0;
    assessmentCount = axRes.count ?? 0;
    reportCount = reportRes.count ?? 0;
  } catch {}

  checks.push({
    label: 'DB · Produkte',
    status: productCount >= 5 ? 'ok' : 'err',
    detail: `${productCount} von 5 erwartet`,
  });
  checks.push({
    label: 'DB · Archetypen',
    status: archetypeCount === 12 ? 'ok' : 'err',
    detail: `${archetypeCount} von 12 erwartet`,
  });
  checks.push({
    label: 'DB · Items (Self + Spieler + Pulse)',
    status: itemCount >= 65 ? 'ok' : itemCount >= 40 ? 'warn' : 'err',
    detail: `${itemCount} Items — erwartet ≥ 65 (nach allen Migrationen)`,
  });

  const colorClass = (s: CheckItem['status']) =>
    s === 'ok' ? 'bg-gold/20 text-gold-deep border-gold' :
    s === 'warn' ? 'bg-yellow-100 text-yellow-900 border-yellow-400' :
    'bg-red-100 text-red-900 border-red-400';

  const okCount = checks.filter(c => c.status === 'ok').length;
  const warnCount = checks.filter(c => c.status === 'warn').length;
  const errCount = checks.filter(c => c.status === 'err').length;

  return (
    <>
      <TopNav />
      <main className="max-w-4xl mx-auto px-4 md:px-8 py-16">
        <div className="font-mono text-xs uppercase tracking-[0.2em] text-gold-deep mb-4">
          Admin
        </div>
        <h1 className="font-display text-5xl tracking-[-0.03em] mb-3">Go-Live Checklist</h1>
        <p className="text-muted mb-10">
          Admin-Ansicht. Prüft Konfiguration, Integrationen und Datenbank-Zustand.
        </p>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          <div className="p-5 bg-bone-soft rounded-md border border-bone-line">
            <div className="font-mono text-xs uppercase tracking-[0.15em] text-gold-deep">OK</div>
            <div className="font-display text-4xl tracking-[-0.02em] text-gold-deep">{okCount}</div>
          </div>
          <div className="p-5 bg-yellow-50 rounded-md border border-yellow-200">
            <div className="font-mono text-xs uppercase tracking-[0.15em] text-yellow-800">Warnung</div>
            <div className="font-display text-4xl tracking-[-0.02em] text-yellow-900">{warnCount}</div>
          </div>
          <div className="p-5 bg-red-50 rounded-md border border-red-200">
            <div className="font-mono text-xs uppercase tracking-[0.15em] text-red-800">Fehler</div>
            <div className="font-display text-4xl tracking-[-0.02em] text-red-900">{errCount}</div>
          </div>
        </div>

        {/* Checks */}
        <h2 className="font-display text-2xl tracking-[-0.02em] mb-5">System-Checks</h2>
        <div className="space-y-2 mb-12">
          {checks.map((c, i) => (
            <div key={i} className="flex items-center gap-4 p-4 bg-bone border border-bone-line rounded-md">
              <span className={`font-mono text-[0.6rem] uppercase tracking-[0.14em] px-3 py-1 rounded-full border ${colorClass(c.status)}`}>
                {c.status === 'ok' ? '✓ OK' : c.status === 'warn' ? '⚠ WARN' : '✗ ERR'}
              </span>
              <div className="flex-grow">
                <div className="font-medium text-sm">{c.label}</div>
                <div className="font-mono text-xs text-muted mt-0.5 break-all">{c.detail}</div>
              </div>
            </div>
          ))}
        </div>

        {/* DB Stats */}
        <h2 className="font-display text-2xl tracking-[-0.02em] mb-5">Datenbank-Stand</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-12">
          <div className="p-4 bg-bone-soft rounded-md border border-bone-line">
            <div className="font-mono text-xs uppercase tracking-[0.15em] text-muted">Nutzer</div>
            <div className="font-display text-3xl text-gold-deep">{userCount}</div>
          </div>
          <div className="p-4 bg-bone-soft rounded-md border border-bone-line">
            <div className="font-mono text-xs uppercase tracking-[0.15em] text-muted">Assessments</div>
            <div className="font-display text-3xl text-gold-deep">{assessmentCount}</div>
          </div>
          <div className="p-4 bg-bone-soft rounded-md border border-bone-line">
            <div className="font-mono text-xs uppercase tracking-[0.15em] text-muted">Reports</div>
            <div className="font-display text-3xl text-gold-deep">{reportCount}</div>
          </div>
        </div>

        {/* Go-Live Guide */}
        <h2 className="font-display text-2xl tracking-[-0.02em] mb-5">Go-Live Anleitung</h2>
        <div className="space-y-4">
          <div className="p-5 bg-bone-soft rounded-md border border-bone-line">
            <div className="font-mono text-xs uppercase tracking-[0.15em] text-gold-deep mb-2">1. Resend-Domain verifizieren</div>
            <p className="text-sm">
              In Resend → Domains → Add Domain → <code>humatrix.cc</code> → DNS-Records (SPF, DKIM, DMARC) setzen.
              Danach in Vercel <code>RESEND_FROM_EMAIL</code> auf <code>&quot;Humatrix Coach &lt;noreply@humatrix.cc&gt;&quot;</code> setzen.
            </p>
          </div>
          <div className="p-5 bg-bone-soft rounded-md border border-bone-line">
            <div className="font-mono text-xs uppercase tracking-[0.15em] text-gold-deep mb-2">2. Stripe Live-Mode aktivieren</div>
            <p className="text-sm">
              Stripe Dashboard → rechts oben &quot;Testmodus&quot; deaktivieren → Live-Keys unter Entwickler → API-Keys kopieren.
              In Vercel: <code>STRIPE_SECRET_KEY</code> und <code>NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code> auf Live-Keys tauschen.
              Danach: neuen Webhook-Endpoint für Live-Mode anlegen (<code>https://coachcheck.humatrix.cc/api/stripe/webhook</code>) und dessen Secret in <code>STRIPE_WEBHOOK_SECRET</code> eintragen.
            </p>
          </div>
          <div className="p-5 bg-bone-soft rounded-md border border-bone-line">
            <div className="font-mono text-xs uppercase tracking-[0.15em] text-gold-deep mb-2">3. Impressum-Daten finalisieren</div>
            <p className="text-sm">
              In <code>app/legal/impressum/page.tsx</code> die echte Humatrix-Adresse, Firmenbuchnummer und UID eintragen.
              Danach committen &amp; pushen.
            </p>
          </div>
          <div className="p-5 bg-bone-soft rounded-md border border-bone-line">
            <div className="font-mono text-xs uppercase tracking-[0.15em] text-gold-deep mb-2">4. Datenschutz-Adresse</div>
            <p className="text-sm">
              Richte <code>privacy@humatrix.cc</code> als E-Mail-Alias ein (Catch-all oder Weiterleitung).
              DSGVO-Auskunftsanfragen landen dort.
            </p>
          </div>
          <div className="p-5 bg-bone-soft rounded-md border border-bone-line">
            <div className="font-mono text-xs uppercase tracking-[0.15em] text-gold-deep mb-2">5. Testkauf durchführen</div>
            <p className="text-sm">
              Schnelltest (9€) kaufen → Checkout durchführen → Assessment starten → PDF-Report generieren.
              Prüfen: Webhook geht durch, Storage-Bucket funktioniert, Mail kommt an.
            </p>
          </div>
        </div>

      </main>
      <Footer />
    </>
  );
}
