'use client';

import { useEffect, useRef, useState } from 'react';

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

export function WiderrufForm({ defaultRef }: { defaultRef?: string }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [orderRef, setOrderRef] = useState(defaultRef ?? '');
  const [productHint, setProductHint] = useState('');
  const [declaration, setDeclaration] = useState('');
  const [confirm, setConfirm] = useState(false);
  const [website, setWebsite] = useState(''); // Honeypot — bleibt leer bei Menschen.
  const [turnstileToken, setTurnstileToken] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [ref, setRef] = useState<string | null>(null);
  const [emailConfirmed, setEmailConfirmed] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const turnstileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!TURNSTILE_SITE_KEY || !turnstileRef.current) return;
    const renderWidget = () => {
      const ts = (window as any).turnstile;
      if (!ts || !turnstileRef.current || turnstileRef.current.childElementCount > 0) return;
      ts.render(turnstileRef.current, {
        sitekey: TURNSTILE_SITE_KEY,
        callback: (token: string) => setTurnstileToken(token),
        'error-callback': () => setTurnstileToken(''),
        'expired-callback': () => setTurnstileToken(''),
      });
    };
    if ((window as any).turnstile) {
      renderWidget();
    } else {
      const id = 'cf-turnstile-script';
      if (!document.getElementById(id)) {
        const s = document.createElement('script');
        s.id = id;
        s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
        s.async = true;
        s.defer = true;
        s.onload = renderWidget;
        document.head.appendChild(s);
      } else {
        const t = setInterval(() => {
          if ((window as any).turnstile) { renderWidget(); clearInterval(t); }
        }, 200);
        return () => clearInterval(t);
      }
    }
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Vertragsidentifikation: mindestens Bestellnummer ODER Produkt.
    if (!orderRef.trim() && !productHint.trim()) {
      setError('Bitte gib zur Identifizierung deines Vertrags mindestens deine Bestellnummer oder das gekaufte Produkt an.');
      return;
    }

    setSending(true);
    try {
      const res = await fetch('/api/widerruf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName,
          email,
          order_ref: orderRef,
          product_hint: productHint,
          declaration,
          confirm,
          website,
          turnstileToken,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Fehler');
      setRef(data.ref ?? null);
      setEmailConfirmed(data.confirmationEmailSent !== false);
      setSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler');
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <div className="text-center py-16">
        <div className="font-mono text-xs uppercase tracking-[0.2em] text-gold-deep mb-4">✓ Eingegangen</div>
        <h2 className="font-display text-3xl tracking-[-0.02em] mb-3">Dein Widerruf ist eingegangen.</h2>
        <p className="font-editorial italic text-lg text-muted leading-[1.5] max-w-[48ch] mx-auto">
          {emailConfirmed ? (
            <>
              Wir haben dir eine Eingangsbestätigung per E-Mail geschickt{ref ? ` (Vorgang ${ref})` : ''}. Wir
              prüfen deinen Widerruf und melden uns zeitnah bei dir.
            </>
          ) : (
            <>
              Dein Eingang ist fristwahrend protokolliert{ref ? ` (Vorgang ${ref})` : ''}. Die
              Eingangsbestätigung per E-Mail folgt in Kürze automatisch — bitte prüfe auch deinen
              Spam-Ordner. Wir prüfen deinen Widerruf und melden uns zeitnah bei dir.
            </>
          )}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block font-mono text-xs uppercase tracking-[0.12em] text-muted mb-2">Name *</label>
          <input
            type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)}
            className="w-full px-4 py-3 bg-bone border border-bone-line rounded-md focus:border-gold focus:outline-none"
          />
        </div>
        <div>
          <label className="block font-mono text-xs uppercase tracking-[0.12em] text-muted mb-2">E-Mail *</label>
          <input
            type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 bg-bone border border-bone-line rounded-md focus:border-gold focus:outline-none"
          />
          <p className="text-xs text-muted mt-1">An diese Adresse senden wir die Eingangsbestätigung.</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block font-mono text-xs uppercase tracking-[0.12em] text-muted mb-2">Bestellnummer</label>
          <input
            type="text" value={orderRef} onChange={(e) => setOrderRef(e.target.value)}
            placeholder="z. B. CC-1042"
            className="w-full px-4 py-3 bg-bone border border-bone-line rounded-md focus:border-gold focus:outline-none"
          />
          <p className="text-xs text-muted mt-1">Findest du in deiner Bestellbestätigung.</p>
        </div>
        <div>
          <label className="block font-mono text-xs uppercase tracking-[0.12em] text-muted mb-2">Produkt</label>
          <input
            type="text" value={productHint} onChange={(e) => setProductHint(e.target.value)}
            placeholder="z. B. 360° Spiegel"
            className="w-full px-4 py-3 bg-bone border border-bone-line rounded-md focus:border-gold focus:outline-none"
          />
          <p className="text-xs text-muted mt-1">Falls du die Bestellnummer nicht zur Hand hast.</p>
        </div>
      </div>

      <p className="text-xs text-muted leading-[1.5] -mt-1">
        Zur Identifizierung deines Vertrags ist mindestens eines der beiden Felder
        (Bestellnummer oder Produkt) erforderlich.
      </p>

      <div>
        <label className="block font-mono text-xs uppercase tracking-[0.12em] text-muted mb-2">Anmerkung (optional)</label>
        <textarea
          value={declaration} onChange={(e) => setDeclaration(e.target.value)}
          rows={4}
          placeholder="Optional: weitere Angaben zu deinem Widerruf."
          className="w-full px-4 py-3 bg-bone border border-bone-line rounded-md focus:border-gold focus:outline-none leading-[1.5]"
        />
      </div>

      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox" required checked={confirm} onChange={(e) => setConfirm(e.target.checked)}
          className="mt-1 h-5 w-5 shrink-0 rounded border-2 border-bone-line accent-gold cursor-pointer"
        />
        <span className="text-[0.95rem] leading-[1.5] text-ink">
          Hiermit widerrufe ich den von mir abgeschlossenen Vertrag über das oben genannte Produkt.
        </span>
      </label>

      <p className="text-xs text-muted leading-[1.5]">
        Hinweis: Bei digitalen Inhalten kann das 14-tägige Widerrufsrecht bereits erloschen sein, wenn die
        Ausführung mit deiner ausdrücklichen Zustimmung begonnen hat (FAGG). Wir prüfen deinen Fall
        individuell. Mehr dazu in den{' '}
        <a href="/legal/agb" className="text-gold-deep hover:underline">AGB (§ 7)</a>.
      </p>

      {error && <div className="text-red-600 font-mono text-sm">{error}</div>}

      {/* Honeypot */}
      <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, overflow: 'hidden' }}>
        <label>
          Website (bitte leer lassen)
          <input
            type="text" tabIndex={-1} autoComplete="off"
            value={website} onChange={(e) => setWebsite(e.target.value)}
          />
        </label>
      </div>

      {TURNSTILE_SITE_KEY && <div ref={turnstileRef} className="my-1" />}

      <button
        type="submit" disabled={sending}
        className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-ink text-bone rounded-full font-semibold hover:bg-gold hover:text-ink disabled:opacity-50 transition w-fit"
      >
        {sending ? 'Sendet …' : 'Widerruf bestätigen'} <span className="font-mono">→</span>
      </button>
    </form>
  );
}
