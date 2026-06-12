'use client';

import { useEffect, useRef, useState } from 'react';

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

type Props = {
  defaultPlan?: string;
};

export function ContactForm({ defaultPlan }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [club, setClub] = useState('');
  const [plan, setPlan] = useState(defaultPlan ?? '');
  const [message, setMessage] = useState('');
  const [website, setWebsite] = useState(''); // Honeypot — bleibt leer bei Menschen.
  const [turnstileToken, setTurnstileToken] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const turnstileRef = useRef<HTMLDivElement>(null);

  // Cloudflare Turnstile nur laden/rendern, wenn ein Site-Key konfiguriert ist.
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
    setSending(true);
    setError(null);
    try {
      const res = await fetch('/api/kontakt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, club, plan, message, website, turnstileToken }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Fehler');
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
        <h2 className="font-display text-3xl tracking-[-0.02em] mb-3">Danke für deine Nachricht.</h2>
        <p className="font-editorial italic text-lg text-muted leading-[1.5] max-w-[45ch] mx-auto">
          Wir melden uns innerhalb von 24 Stunden bei dir. Wenn&apos;s dringend ist, erreichst du uns auch unter{' '}
          <a href="mailto:office@humatrix.cc" className="text-gold-deep hover:underline">office@humatrix.cc</a>.
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
            type="text" required value={name} onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 bg-bone border border-bone-line rounded-md focus:border-gold focus:outline-none"
          />
        </div>
        <div>
          <label className="block font-mono text-xs uppercase tracking-[0.12em] text-muted mb-2">E-Mail *</label>
          <input
            type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 bg-bone border border-bone-line rounded-md focus:border-gold focus:outline-none"
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block font-mono text-xs uppercase tracking-[0.12em] text-muted mb-2">Telefon</label>
          <input
            type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
            className="w-full px-4 py-3 bg-bone border border-bone-line rounded-md focus:border-gold focus:outline-none"
          />
        </div>
        <div>
          <label className="block font-mono text-xs uppercase tracking-[0.12em] text-muted mb-2">Verein / Team</label>
          <input
            type="text" value={club} onChange={(e) => setClub(e.target.value)}
            className="w-full px-4 py-3 bg-bone border border-bone-line rounded-md focus:border-gold focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label className="block font-mono text-xs uppercase tracking-[0.12em] text-muted mb-2">Interessantes Paket</label>
        <select
          value={plan} onChange={(e) => setPlan(e.target.value)}
          className="w-full px-4 py-3 bg-bone border border-bone-line rounded-md focus:border-gold focus:outline-none"
        >
          <option value="">— nicht sicher —</option>
          <option value="schnelltest">Schnelltest (19 €)</option>
          <option value="selbsttest">Selbsttest (79 €)</option>
          <option value="spiegel_360">360° Spiegel (199 €)</option>
          <option value="teamcheck">TeamCheck (ab 890 €)</option>
          <option value="saison_beratung">Saison &amp; Beratung (ab 3.900 €)</option>
          <option value="custom">Custom / Individuell</option>
        </select>
      </div>

      <div>
        <label className="block font-mono text-xs uppercase tracking-[0.12em] text-muted mb-2">Nachricht *</label>
        <textarea
          required value={message} onChange={(e) => setMessage(e.target.value)}
          rows={5}
          placeholder="Kurz: In welchem Kontext bist du unterwegs? Welche Fragestellung treibt dich gerade?"
          className="w-full px-4 py-3 bg-bone border border-bone-line rounded-md focus:border-gold focus:outline-none leading-[1.5]"
        />
      </div>

      <p className="text-xs text-muted leading-[1.5]">
        Mit dem Absenden erlaubst du uns, dir per E-Mail zu antworten. Weitere Infos in unserer{' '}
        <a href="/legal/datenschutz" className="text-gold-deep hover:underline">Datenschutzerklärung</a>.
      </p>

      {error && <div className="text-red-600 font-mono text-sm">{error}</div>}

      {/* Honeypot: für Menschen unsichtbar; nur Bots füllen es aus. */}
      <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, overflow: 'hidden' }}>
        <label>
          Website (bitte leer lassen)
          <input
            type="text" tabIndex={-1} autoComplete="off"
            value={website} onChange={(e) => setWebsite(e.target.value)}
          />
        </label>
      </div>

      {/* Cloudflare Turnstile — rendert nur, wenn NEXT_PUBLIC_TURNSTILE_SITE_KEY gesetzt ist. */}
      {TURNSTILE_SITE_KEY && <div ref={turnstileRef} className="my-1" />}

      <button
        type="submit" disabled={sending}
        className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-ink text-bone rounded-full font-semibold hover:bg-gold hover:text-ink disabled:opacity-50 transition"
      >
        {sending ? 'Sendet …' : 'Nachricht senden'} <span className="font-mono">→</span>
      </button>
    </form>
  );
}
