'use client';

import { useState } from 'react';

/**
 * Drei aktive Zustimmungen, bevor der Checkout starten darf (P0 #4):
 *   - AGB
 *   - Datenschutzerklärung
 *   - Verständnis der KI-gestützten / automatisierten Auswertung
 *
 * Das Formular POSTet auf /checkout/[slug]/start. Dort wird die Zustimmung
 * serverseitig erneut geprüft und versioniert gespeichert, bevor die
 * Stripe-Session erzeugt wird. Ohne alle drei Haken: kein Checkout.
 */
export function CheckoutConsent({ slug }: { slug: string }) {
  const [agb, setAgb] = useState(false);
  const [datenschutz, setDatenschutz] = useState(false);
  const [ki, setKi] = useState(false);

  const allChecked = agb && datenschutz && ki;

  return (
    <form method="post" action={`/checkout/${slug}/start`} className="grid gap-5">
      <Checkbox
        name="agb"
        checked={agb}
        onChange={setAgb}
        label={
          <>
            Ich akzeptiere die{' '}
            <a href="/legal/agb" target="_blank" rel="noreferrer" className="text-gold-deep underline">AGB</a>.
          </>
        }
      />
      <Checkbox
        name="datenschutz"
        checked={datenschutz}
        onChange={setDatenschutz}
        label={
          <>
            Ich habe die{' '}
            <a href="/legal/datenschutz" target="_blank" rel="noreferrer" className="text-gold-deep underline">Datenschutzerklärung</a>{' '}
            gelesen und akzeptiere sie.
          </>
        }
      />
      <Checkbox
        name="ki_verarbeitung"
        checked={ki}
        onChange={setKi}
        label={
          <>
            Mir ist bewusst, dass die Auswertung KI-gestützt erfolgt und der Bericht
            automatisiert auf Basis meiner Antworten erstellt wird. Das Ergebnis ist eine
            Coaching-Einordnung, keine medizinische oder psychologische Diagnose.
          </>
        }
      />

      <input type="hidden" name="confirm" value="1" />

      <button
        type="submit"
        disabled={!allChecked}
        className="mt-3 inline-flex items-center gap-2 px-7 py-4 bg-ink text-bone rounded-full font-semibold hover:bg-gold hover:text-ink transition disabled:opacity-40 disabled:cursor-not-allowed w-fit"
      >
        Weiter zur sicheren Zahlung <span className="font-mono">→</span>
      </button>

      <p className="font-mono text-[0.62rem] uppercase tracking-[0.12em] text-muted mt-2 max-w-[58ch]">
        Die Zahlung wird sicher über Stripe abgewickelt. Deine Zustimmung wird mit Zeitstempel
        und Version dokumentiert (DSGVO Art. 7).
      </p>
    </form>
  );
}

function Checkbox({
  name,
  checked,
  onChange,
  label,
}: {
  name: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  label: React.ReactNode;
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer group">
      <input
        type="checkbox"
        name={name}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        required
        className="mt-1 h-5 w-5 shrink-0 rounded border-2 border-bone-line accent-gold cursor-pointer"
      />
      <span className="text-[0.95rem] leading-[1.5] text-ink">{label}</span>
    </label>
  );
}
