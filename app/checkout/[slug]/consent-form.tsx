'use client';

import { useState } from 'react';

/**
 * Vier aktive Zustimmungen, bevor der Checkout starten darf:
 *   - AGB
 *   - Datenschutzerklärung (zur Kenntnis genommen)
 *   - Verständnis der KI-gestützten / automatisierten Auswertung
 *   - Ausdrücklicher Wunsch nach vorzeitigem Leistungsbeginn + Kenntnis des
 *     Widerrufsrecht-Verlusts (FAGG, digitale Inhalte)
 *
 * Das Formular POSTet auf /checkout/[slug]/start. Dort wird die Zustimmung
 * serverseitig erneut geprüft und versioniert gespeichert, bevor die
 * Stripe-Session erzeugt wird. Ohne alle vier Haken: kein Checkout.
 */
export function CheckoutConsent({ slug }: { slug: string }) {
  const [agb, setAgb] = useState(false);
  const [datenschutz, setDatenschutz] = useState(false);
  const [ki, setKi] = useState(false);
  const [widerruf, setWiderruf] = useState(false);

  const allChecked = agb && datenschutz && ki && widerruf;

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
            zur Kenntnis genommen.
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
      <Checkbox
        name="widerruf_verzicht"
        checked={widerruf}
        onChange={setWiderruf}
        label={
          <>
            Ich verlange ausdrücklich, dass CoachCheck schon vor Ablauf der 14-tägigen
            Widerrufsfrist mit der Bereitstellung des digitalen Inhalts beginnt. Mir ist
            bekannt, dass ich dadurch mit Beginn der Ausführung mein Widerrufsrecht verliere.
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
