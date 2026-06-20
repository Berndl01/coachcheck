'use client';

import { useState } from 'react';
import { useT } from '@/components/i18n/locale-provider';

/**
 * Vier aktive Zustimmungen, bevor der Checkout starten darf (AGB, Datenschutz,
 * KI-Auswertung, FAGG-Widerrufsverzicht). Das Formular POSTet auf
 * /checkout/[slug]/start; dort wird serverseitig erneut geprüft und versioniert
 * gespeichert, bevor die Stripe-Session erzeugt wird. Ohne alle vier Haken: kein Checkout.
 *
 * HINWEIS i18n/Recht: Die deutsche Fassung ist die rechtlich operative. Die englischen
 * Einwilligungs-/Widerrufsformulierungen sind eine Verständnishilfe (Entwurf) und müssen
 * vor dem EN-Markt anwaltlich freigegeben werden — wie die Rechtsseiten.
 */
export function CheckoutConsent({ slug }: { slug: string }) {
  const t = useT();
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
            {t('consent.agbBefore')}{' '}
            <a href="/legal/agb" target="_blank" rel="noreferrer" className="text-gold-deep underline">{t('consent.agbLink')}</a>{t('consent.agbAfter')}
          </>
        }
      />
      <Checkbox
        name="datenschutz"
        checked={datenschutz}
        onChange={setDatenschutz}
        label={
          <>
            {t('consent.privacyBefore')}{' '}
            <a href="/legal/datenschutz" target="_blank" rel="noreferrer" className="text-gold-deep underline">{t('consent.privacyLink')}</a>{t('consent.privacyAfter')}
          </>
        }
      />
      <Checkbox
        name="ki_verarbeitung"
        checked={ki}
        onChange={setKi}
        label={t('consent.ai')}
      />
      <Checkbox
        name="widerruf_verzicht"
        checked={widerruf}
        onChange={setWiderruf}
        label={t('consent.withdrawal')}
      />

      <input type="hidden" name="confirm" value="1" />

      <button
        type="submit"
        disabled={!allChecked}
        className="mt-3 inline-flex items-center gap-2 px-7 py-4 bg-ink text-bone rounded-full font-semibold hover:bg-gold hover:text-ink transition disabled:opacity-40 disabled:cursor-not-allowed w-fit"
      >
        {t('consent.submit')} <span className="font-mono">→</span>
      </button>

      <p className="font-mono text-[0.62rem] uppercase tracking-[0.12em] text-muted mt-2 max-w-[58ch]">
        {t('consent.note')}
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
