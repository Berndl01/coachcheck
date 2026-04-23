'use client';

import { useState } from 'react';

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
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setError(null);
    try {
      const res = await fetch('/api/kontakt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, club, plan, message }),
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
          <a href="mailto:hello@humatrix.cc" className="text-gold-deep hover:underline">hello@humatrix.cc</a>.
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
          <option value="schnelltest">Schnelltest (9 €)</option>
          <option value="selbsttest_premium">Selbsttest Premium (29 €)</option>
          <option value="spiegel_360">360° Spiegel (99 €)</option>
          <option value="teamcheck">TeamCheck (ab 299 €)</option>
          <option value="saison_begleitung">Saison & Beratung (ab 1.490 €)</option>
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

      <button
        type="submit" disabled={sending}
        className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-ink text-bone rounded-full font-semibold hover:bg-gold hover:text-ink disabled:opacity-50 transition"
      >
        {sending ? 'Sendet …' : 'Nachricht senden'} <span className="font-mono">→</span>
      </button>
    </form>
  );
}
