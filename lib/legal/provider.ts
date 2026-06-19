/**
 * Zentrale Anbieter- und Vertragsinformationen für rechtlich relevante
 * Dokumente (Bestell-/Vertragsbestätigung, künftige Rechnungen). Eine Quelle,
 * damit Impressum, AGB und Beleg nicht auseinanderlaufen. Inhalte stammen aus
 * dem Impressum.
 *
 * Diese Angaben erscheinen NUR auf rechtlich erforderlichen Dokumenten
 * (Impressum, AGB, Vertragsbestätigung) — nicht auf Marketing-Seiten.
 */
export const PROVIDER = {
  legalName: 'Humatrix by Bernhard Lampl',
  person: 'Mag. Bernhard Lampl, PhD, BSc, MBA, LL.M., MBA',
  street: 'Ried 80',
  zip: '6363',
  city: 'Westendorf',
  region: 'Tirol',
  country: 'Österreich',
  phone: '+43 676 916 60 20',
  email: 'office@humatrix.cc',
} as const;

export function providerAddressLine(): string {
  return `${PROVIDER.street}, ${PROVIDER.zip} ${PROVIDER.city}, ${PROVIDER.region}, ${PROVIDER.country}`;
}

/**
 * Umsatzsteuer-Hinweis für den Beleg.
 *
 * WICHTIG (vom Steuerberater bestätigen lassen, bevor B2C breit verkauft wird):
 * Setze INVOICE_VAT_NOTE auf die korrekte Formulierung deines Steuerstatus —
 * entweder den Kleinunternehmer-Hinweis (z. B. „Umsatzsteuerbefreit gemäß
 * Kleinunternehmerregelung, § 6 Abs. 1 Z 27 UStG — kein USt-Ausweis.") ODER den
 * USt-Ausweis inkl. Satz und UID (z. B. „Bruttobetrag inkl. 20 % USt · UID: ATU…").
 *
 * Default behauptet bewusst KEINEN Steuersatz und KEINEN Kleinunternehmer-Status
 * (das wäre eine erfundene Steuerangabe). Er nennt nur die wahre Tatsache, dass
 * der gezahlte Betrag der Endpreis in Euro ist.
 */
export const VAT_NOTE =
  process.env.INVOICE_VAT_NOTE ?? 'Alle Beträge sind Bruttoendpreise in Euro.';

/** Maßgebliche AGB-Fassung (Stand der AGB-Seite). Bei jeder inhaltlichen
 *  Änderung hochzählen — die Fassung wird beweisrelevant im Vertrags-Snapshot
 *  eingefroren. */
export const AGB_VERSION = '18. Juni 2026';
