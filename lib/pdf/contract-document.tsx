/**
 * Vertragsdokument-PDF (@react-pdf/renderer) — der dauerhafte Datenträger zum
 * Kauf. Gerendert AUS dem eingefrorenen ContractSnapshot, enthält damit exakt
 * die zum Bestellzeitpunkt geltenden Texte und Daten:
 *   - Bestell-/Vertragsdaten + Anbieter,
 *   - Hauptmerkmale + § 4 FAGG-Vertragsbedingungen (Bereitstellung,
 *     Gewährleistung, Funktionalität/Kompatibilität, Nutzung/Haftung),
 *   - Wortlaut + Zeitstempel der vier Zustimmungen,
 *   - vollständige Widerrufsbelehrung + Muster-Widerrufsformular.
 *
 * Bewusst NUR eingebaute Fonts (Helvetica) — kein Font.register, kein Datei-IO.
 * Das Modul wird ausschließlich zur Laufzeit dynamisch importiert (nie zur
 * Build-Zeit ausgeführt), siehe lib/email/order-confirmation.ts.
 */
import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { ContractSnapshot } from '@/lib/legal/withdrawal';

const C = {
  ink: '#1A1917',
  muted: '#5F5D59',
  line: '#D8D4CD',
  gold: '#9A7B33',
  paper: '#FFFFFF',
  panel: '#F6F4EF',
};

const s = StyleSheet.create({
  page: { backgroundColor: C.paper, color: C.ink, paddingTop: 46, paddingBottom: 56, paddingHorizontal: 48, fontFamily: 'Helvetica', fontSize: 9.5, lineHeight: 1.5 },
  eyebrow: { fontFamily: 'Helvetica-Bold', fontSize: 7.5, letterSpacing: 1.4, color: C.gold, textTransform: 'uppercase', marginBottom: 6 },
  h1: { fontFamily: 'Helvetica-Bold', fontSize: 18, marginBottom: 4 },
  sub: { fontSize: 9, color: C.muted, marginBottom: 16 },
  sectionTitle: { fontFamily: 'Helvetica-Bold', fontSize: 8, letterSpacing: 1, color: C.muted, textTransform: 'uppercase', marginTop: 16, marginBottom: 6 },
  para: { marginBottom: 6 },
  panel: { backgroundColor: C.panel, borderRadius: 4, padding: 12, marginBottom: 4 },
  row: { flexDirection: 'row', marginBottom: 3 },
  rowLabel: { width: '38%', color: C.muted, fontSize: 8.5 },
  rowValue: { width: '62%', fontSize: 9 },
  termLabel: { fontFamily: 'Helvetica-Bold', fontSize: 9, marginTop: 8, marginBottom: 2 },
  consentBlock: { borderLeftWidth: 1.5, borderLeftColor: C.gold, paddingLeft: 8, marginBottom: 8 },
  consentHead: { fontFamily: 'Helvetica-Bold', fontSize: 9 },
  consentMeta: { fontSize: 7.5, color: C.muted, marginBottom: 2 },
  pre: { fontSize: 8.5, color: '#3A3835' },
  hr: { borderBottomWidth: 1, borderBottomColor: C.line, marginVertical: 12 },
  footer: { position: 'absolute', bottom: 26, left: 48, right: 48, fontSize: 7.5, color: C.muted, borderTopWidth: 1, borderTopColor: C.line, paddingTop: 8, flexDirection: 'row', justifyContent: 'space-between' },
});

const EUR = (cents: number, currency: string) =>
  new Intl.NumberFormat('de-AT', { style: 'currency', currency: (currency || 'eur').toUpperCase() }).format((cents ?? 0) / 100);

const DT = (iso: string) =>
  new Intl.DateTimeFormat('de-AT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Vienna' }).format(new Date(iso)) + ' Uhr';

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.row}>
      <Text style={s.rowLabel}>{label}</Text>
      <Text style={s.rowValue}>{value}</Text>
    </View>
  );
}

export function ContractDocument({ snapshot }: { snapshot: ContractSnapshot }) {
  const sn = snapshot;
  const widerruf = sn.consents.find((c) => c.type === 'widerruf_verzicht');
  return (
    <Document>
      <Page size="A4" style={s.page}>
        <Text style={s.eyebrow}>Bestell- und Vertragsbestaetigung</Text>
        <Text style={s.h1}>{sn.product.name}</Text>
        <Text style={s.sub}>
          Bestellnummer {sn.order.orderNumber} · {DT(sn.order.purchasedAt)} · Anbieter {sn.provider.legalName}
        </Text>

        <Text style={s.sectionTitle}>Vertragsdaten</Text>
        <View style={s.panel}>
          <Row label="Bestellnummer" value={sn.order.orderNumber} />
          <Row label="Bestelldatum" value={DT(sn.order.purchasedAt)} />
          <Row label="Produkt" value={sn.product.name} />
          <Row label="Bruttopreis" value={`${EUR(sn.product.priceCents, sn.product.currency)} — ${sn.vatNote}`} />
          <Row label="Zahlungsart" value="Kreditkarte (ueber Stripe)" />
          <Row label="Vertragsreferenz" value={sn.order.purchaseId} />
          <Row label="Massgebliche AGB-Fassung" value={`Stand ${sn.agbVersion}`} />
        </View>

        <Text style={s.sectionTitle}>Anbieter</Text>
        <View style={s.panel}>
          <Text>{sn.provider.legalName}</Text>
          <Text>{sn.provider.person}</Text>
          <Text>{sn.provider.address}</Text>
          <Text>Tel.: {sn.provider.phone} · {sn.provider.email}</Text>
        </View>

        <Text style={s.sectionTitle}>Leistung &amp; Vertragsbedingungen (§ 4 FAGG)</Text>
        <Text style={s.termLabel}>Hauptmerkmale der Leistung</Text>
        <Text style={s.para}>{sn.serviceTerms.leistungsbeschreibung}</Text>
        <Text style={s.termLabel}>Bereitstellung</Text>
        <Text style={s.para}>{sn.serviceTerms.bereitstellung}</Text>
        <Text style={s.termLabel}>Gewaehrleistung</Text>
        <Text style={s.para}>{sn.serviceTerms.gewaehrleistung}</Text>
        <Text style={s.termLabel}>Funktionalitaet, Kompatibilitaet &amp; Interoperabilitaet</Text>
        <Text style={s.para}>{sn.serviceTerms.funktionalitaet}</Text>
        <Text style={s.termLabel}>Nutzung, Verfuegbarkeit &amp; Haftung</Text>
        <Text style={s.para}>{sn.serviceTerms.nutzungHaftung}</Text>
      </Page>

      <Page size="A4" style={s.page}>
        <Text style={s.sectionTitle}>Dokumentierte Zustimmungen</Text>
        {sn.consents.map((c) => (
          <View key={c.type} style={s.consentBlock}>
            <Text style={s.consentHead}>{c.label}</Text>
            <Text style={s.consentMeta}>
              {c.acceptedAt ? `Angeklickt am ${DT(c.acceptedAt)}` : 'ohne Zeitstempel'}
              {sn.consentVersion ? ` · Fassung ${sn.consentVersion}` : ''}
            </Text>
            <Text style={s.pre}>{c.text}</Text>
          </View>
        ))}

        <View style={s.hr} />
        <Text style={s.sectionTitle}>Vorzeitiger Leistungsbeginn</Text>
        <Text style={s.para}>
          {widerruf?.text ?? sn.widerrufVerzichtText}
        </Text>

        <Text style={s.sectionTitle}>Widerrufsbelehrung</Text>
        <Text style={s.pre}>{sn.widerrufsbelehrung}</Text>

        <Text style={s.sectionTitle}>Muster-Widerrufsformular</Text>
        <Text style={s.pre}>{sn.musterWiderrufsformular}</Text>

        <View style={s.footer} fixed>
          <Text>{sn.provider.legalName} · {sn.provider.email}</Text>
          <Text>Vertragsbestaetigung {sn.order.orderNumber}</Text>
        </View>
      </Page>
    </Document>
  );
}

/**
 * Rendert das Vertragsdokument zum Buffer. Dynamischer renderToBuffer-Import,
 * damit nichts zur Build-Zeit ausgeführt wird. Wirft im Fehlerfall — der Aufrufer
 * fängt das ab und versendet die Bestätigung dann ohne Anhang (Inline-Inhalt
 * trägt die Pflichtangaben ohnehin).
 */
export async function renderContractDocument(snapshot: ContractSnapshot): Promise<Buffer> {
  const { renderToBuffer } = await import('@react-pdf/renderer');
  const element = React.createElement(ContractDocument, { snapshot });
  // @ts-expect-error - renderToBuffer akzeptiert das Document-Element
  return renderToBuffer(element);
}
