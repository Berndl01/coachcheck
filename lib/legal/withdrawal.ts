/**
 * Kanonische Widerrufs- und Zustimmungstexte — EINE Quelle.
 *
 * Diese Texte erscheinen wortgleich an drei Stellen, die nicht auseinanderlaufen
 * dürfen:
 *   1. AGB-Seite (§ 7 Widerrufsrecht + Muster-Widerrufsformular),
 *   2. Bestell-/Vertragsbestätigung (dauerhafter Datenträger nach dem Kauf),
 *   3. unveränderbarer Vertrags-Snapshot, der beim Kauf gespeichert wird.
 *
 * So ist die zum Kaufzeitpunkt geltende Fassung dauerhaft beweisbar — ein bloßer
 * Versionsname plus Link auf eine später veränderbare Seite genügt dafür nicht.
 *
 * WICHTIG: Der konkrete Wortlaut ist anwaltlich zu prüfen, bevor breit an
 * Verbraucher verkauft wird. Dieser Code stellt den Mechanismus bereit
 * (kanonischer Text + dauerhafte Speicherung), nicht das Rechtsurteil.
 */
import { PROVIDER, providerAddressLine, VAT_NOTE, AGB_VERSION } from '@/lib/legal/provider';

/** Der exakte Wortlaut der Widerruf-Verzicht-Checkbox aus dem Checkout. */
export const WIDERRUF_CONSENT_TEXT =
  'Ich verlange ausdrücklich, dass CoachCheck schon vor Ablauf der 14-tägigen ' +
  'Widerrufsfrist mit der Bereitstellung des digitalen Inhalts beginnt. Mir ist ' +
  'bekannt, dass ich dadurch mit Beginn der Ausführung mein Widerrufsrecht verliere.';

/**
 * Wortlaut ALLER vier Checkout-Zustimmungen, indexiert nach consent_type.
 * Muss mit app/checkout/[slug]/consent-form.tsx übereinstimmen.
 */
export const CONSENT_TEXTS: Record<string, string> = {
  agb: 'Ich akzeptiere die AGB.',
  datenschutz: 'Ich habe die Datenschutzerklärung zur Kenntnis genommen.',
  ki_verarbeitung:
    'Mir ist bewusst, dass die Auswertung KI-gestützt erfolgt und der Bericht ' +
    'automatisiert auf Basis meiner Antworten erstellt wird. Das Ergebnis ist eine ' +
    'Coaching-Einordnung, keine medizinische oder psychologische Diagnose.',
  widerruf_verzicht: WIDERRUF_CONSENT_TEXT,
};

/** Lesbares Label je consent_type für Beleg/Snapshot. */
export const CONSENT_LABELS: Record<string, string> = {
  agb: 'AGB akzeptiert',
  datenschutz: 'Datenschutzerklärung zur Kenntnis genommen',
  ki_verarbeitung: 'KI-gestützte/automatisierte Auswertung verstanden',
  widerruf_verzicht: 'Vorzeitiger Leistungsbeginn ausdrücklich verlangt',
};

/**
 * Widerrufsbelehrung (wortgleich zu § 7 AGB), als Klartext für E-Mail + Snapshot.
 */
export const WIDERRUFSBELEHRUNG = [
  'Widerrufsbelehrung',
  '',
  'Verbraucher haben nach dem Fern- und Auswärtsgeschäfte-Gesetz (FAGG) das Recht, binnen 14 Tagen ohne Angabe von Gründen zu widerrufen. Die Frist beginnt mit Vertragsschluss. Zur Ausübung genügt eine eindeutige Erklärung (z. B. per E-Mail an ' + PROVIDER.email + ' oder über die Online-Widerrufsfunktion). Zur Fristwahrung reicht die rechtzeitige Absendung.',
  '',
  '(1) Digitale Inhalte (Schnelltest, Selbsttest, 360° Spiegel): Der Kunde verlangt ausdrücklich, dass mit der Ausführung vor Ablauf der Widerrufsfrist begonnen wird, und nimmt zur Kenntnis, dass er sein Widerrufsrecht damit verliert, sobald die Ausführung begonnen hat (Start des Assessments bzw. Erstellung des Reports) — § 18 Abs 1 Z 11 FAGG.',
  '',
  '(2) Dienstleistungen (TeamCheck, Saison & Beratung): Beginnt die Beratungsleistung auf ausdrücklichen Wunsch des Kunden vor Ablauf der Widerrufsfrist, schuldet der Kunde bei Widerruf einen anteiligen Betrag für die bereits erbrachte Leistung (§ 16 FAGG). Nach vollständiger Erbringung erlischt das Widerrufsrecht (§ 18 Abs 1 Z 1 FAGG).',
  '',
  '(3) Wird mit der Ausführung noch nicht begonnen, kann der Vertrag binnen 14 Tagen widerrufen werden; bereits geleistete Zahlungen werden unverzüglich erstattet.',
].join('\n');

/**
 * Muster-Widerrufsformular (wortgleich zur AGB), als Klartext-Vorlage.
 */
export const MUSTER_WIDERRUFSFORMULAR = [
  'Muster-Widerrufsformular',
  '(Wenn Sie den Vertrag widerrufen wollen, füllen Sie dieses Formular aus und senden Sie es an ' + PROVIDER.email + '.)',
  '',
  'An ' + PROVIDER.legalName + ', ' + providerAddressLine() + ', ' + PROVIDER.email + ':',
  'Hiermit widerrufe(n) ich/wir den von mir/uns abgeschlossenen Vertrag über folgendes Produkt: ____________',
  'Bestellt am / erhalten am: ____________',
  'Name des/der Verbraucher(s): ____________',
  'Anschrift: ____________',
  'Datum / Unterschrift (nur bei Mitteilung auf Papier): ____________',
].join('\n');

export type ConsentSnapshotEntry = {
  type: string;
  label: string;
  text: string;
  acceptedAt: string | null;
};

export type ContractSnapshot = {
  schema: 'coachcheck.contract.v1';
  capturedAt: string;
  agbVersion: string;
  consentVersion: string | null;
  provider: {
    legalName: string;
    person: string;
    address: string;
    phone: string;
    email: string;
  };
  product: { name: string; priceCents: number; currency: string };
  order: { orderNumber: string; purchaseId: string; purchasedAt: string };
  vatNote: string;
  consents: ConsentSnapshotEntry[];
  widerrufVerzichtText: string;
  widerrufsbelehrung: string;
  musterWiderrufsformular: string;
};

/**
 * Baut den unveränderbaren Vertrags-Snapshot, der beim Kauf gespeichert wird.
 * Er friert alle zum Bestellzeitpunkt geltenden Texte und Daten ein.
 */
export function buildContractSnapshot(input: {
  productName: string;
  priceCents: number;
  currency: string;
  orderNumber: string;
  purchaseId: string;
  purchasedAt: Date;
  consentVersion: string | null;
  consents: Array<{ type: string; acceptedAt: string | null }>;
}): ContractSnapshot {
  const consents: ConsentSnapshotEntry[] = ['agb', 'datenschutz', 'ki_verarbeitung', 'widerruf_verzicht'].map(
    (type) => {
      const match = input.consents.find((c) => c.type === type) ?? null;
      return {
        type,
        label: CONSENT_LABELS[type] ?? type,
        text: CONSENT_TEXTS[type] ?? '',
        acceptedAt: match?.acceptedAt ?? null,
      };
    },
  );

  return {
    schema: 'coachcheck.contract.v1',
    capturedAt: new Date().toISOString(),
    agbVersion: AGB_VERSION,
    consentVersion: input.consentVersion,
    provider: {
      legalName: PROVIDER.legalName,
      person: PROVIDER.person,
      address: providerAddressLine(),
      phone: PROVIDER.phone,
      email: PROVIDER.email,
    },
    product: { name: input.productName, priceCents: input.priceCents, currency: input.currency },
    order: {
      orderNumber: input.orderNumber,
      purchaseId: input.purchaseId,
      purchasedAt: input.purchasedAt.toISOString(),
    },
    vatNote: VAT_NOTE,
    consents,
    widerrufVerzichtText: WIDERRUF_CONSENT_TEXT,
    widerrufsbelehrung: WIDERRUFSBELEHRUNG,
    musterWiderrufsformular: MUSTER_WIDERRUFSFORMULAR,
  };
}

/**
 * Flacht die vier Zustimmungstexte zu einem speicherbaren Klartext ab
 * (purchases.consent_text_snapshot) — für schnellen rechtlichen Export ohne
 * JSON-Parsing.
 */
export function flattenConsentText(snapshot: ContractSnapshot): string {
  return snapshot.consents
    .map((c) => `[${c.acceptedAt ?? 'ohne Zeitstempel'}] ${c.label}: ${c.text}`)
    .join('\n');
}
