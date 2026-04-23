/* eslint-disable jsx-a11y/alt-text */
import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  Svg,
  Rect,
  Line,
  Circle,
} from '@react-pdf/renderer';
import type { AxisScores } from '@/lib/scoring';
import type { ReportOutput } from '@/lib/ai/report-prompt';

// Register fonts (using Google Fonts CDN - React-PDF supports TTF)
Font.register({
  family: 'Fraunces',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/fraunces/v31/6NUh8FyLNQOQZAnv9ZwNjucMHVn85Ni7emAe9lKqZTnVD1AvKg.ttf', fontWeight: 300 },
    { src: 'https://fonts.gstatic.com/s/fraunces/v31/6NUh8FyLNQOQZAnv9ZwNjucMHVn85Ni7emAe9lKqZTnVG1QvKg.ttf', fontWeight: 400 },
    { src: 'https://fonts.gstatic.com/s/fraunces/v31/6NUh8FyLNQOQZAnv9ZwNjucMHVn85Ni7emAe9lKqZTnVF1IvKg.ttf', fontWeight: 500 },
  ],
});

Font.register({
  family: 'Manrope',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/manrope/v15/xn7gYHE41ni1AdIRggexSg.ttf', fontWeight: 400 },
    { src: 'https://fonts.gstatic.com/s/manrope/v15/xn7gYHE41ni1AdIRggOxSg.ttf', fontWeight: 500 },
    { src: 'https://fonts.gstatic.com/s/manrope/v15/xn7gYHE41ni1AdIRggKxSg.ttf', fontWeight: 600 },
    { src: 'https://fonts.gstatic.com/s/manrope/v15/xn7gYHE41ni1AdIRggaxSg.ttf', fontWeight: 700 },
  ],
});

// ============== COLOR SYSTEM ==============
const COLORS = {
  ink: '#1B1C1E',
  inkSoft: '#26272A',
  bone: '#FAFAF8',
  boneSoft: '#F0EEEA',
  boneLine: '#DBD8D1',
  petrol: '#143F3A',
  gold: '#B38E45',
  goldLight: '#CDB072',
  goldDeep: '#8A6A2E',
  muted: '#767471',
  mutedDark: '#9A9793',
};

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Manrope',
    fontSize: 10,
    color: COLORS.ink,
    paddingTop: 60,
    paddingBottom: 60,
    paddingHorizontal: 50,
    backgroundColor: COLORS.bone,
    lineHeight: 1.5,
  },
  pageDark: {
    fontFamily: 'Manrope',
    fontSize: 10,
    color: COLORS.bone,
    padding: 0,
    backgroundColor: COLORS.ink,
  },
  pagePetrol: {
    fontFamily: 'Manrope',
    fontSize: 10,
    color: COLORS.bone,
    paddingTop: 60,
    paddingBottom: 60,
    paddingHorizontal: 50,
    backgroundColor: COLORS.petrol,
  },

  // Typography
  kicker: {
    fontFamily: 'Manrope',
    fontSize: 8,
    color: COLORS.muted,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 14,
  },
  kickerDark: {
    fontFamily: 'Manrope',
    fontSize: 8,
    color: COLORS.gold,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 14,
  },
  h1: {
    fontFamily: 'Fraunces',
    fontSize: 36,
    fontWeight: 300,
    letterSpacing: -0.8,
    lineHeight: 1.05,
    marginBottom: 14,
  },
  h2: {
    fontFamily: 'Fraunces',
    fontSize: 22,
    fontWeight: 400,
    letterSpacing: -0.4,
    marginBottom: 10,
    marginTop: 20,
  },
  h3: {
    fontFamily: 'Fraunces',
    fontSize: 16,
    fontWeight: 500,
    letterSpacing: -0.3,
    marginBottom: 8,
    marginTop: 14,
  },
  body: {
    fontSize: 10.5,
    lineHeight: 1.55,
    marginBottom: 9,
    color: COLORS.ink,
  },
  bodyLight: {
    fontSize: 10.5,
    lineHeight: 1.55,
    marginBottom: 9,
    color: COLORS.bone,
  },
  bodyMuted: {
    fontSize: 9.5,
    lineHeight: 1.5,
    color: COLORS.muted,
  },
  quote: {
    fontFamily: 'Fraunces',
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 1.5,
    color: COLORS.ink,
    marginBottom: 9,
  },
  quoteLight: {
    fontFamily: 'Fraunces',
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 1.5,
    color: COLORS.bone,
    marginBottom: 9,
  },
  mono: {
    fontSize: 8,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: COLORS.muted,
  },

  // Layouts
  divider: {
    height: 1,
    backgroundColor: COLORS.boneLine,
    marginVertical: 14,
  },
  dividerDark: {
    height: 1,
    backgroundColor: COLORS.inkSoft,
    marginVertical: 14,
  },
  dividerGold: {
    height: 2,
    backgroundColor: COLORS.gold,
    marginVertical: 14,
    width: 48,
  },

  // Cover
  coverContainer: {
    flex: 1,
    padding: 60,
    justifyContent: 'space-between',
    backgroundColor: COLORS.ink,
  },
  coverHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.inkSoft,
  },
  coverLogo: {
    fontFamily: 'Manrope',
    fontSize: 11,
    letterSpacing: 4.5,
    color: COLORS.bone,
    fontWeight: 300,
    textTransform: 'uppercase',
  },
  coverTitle: {
    fontFamily: 'Fraunces',
    fontSize: 52,
    color: COLORS.bone,
    letterSpacing: -1.2,
    lineHeight: 1,
    fontWeight: 300,
  },
  coverTitleGold: {
    color: COLORS.gold,
    fontStyle: 'italic',
  },
  coverSubtitle: {
    fontFamily: 'Fraunces',
    fontSize: 20,
    color: COLORS.mutedDark,
    fontStyle: 'italic',
    lineHeight: 1.3,
    marginTop: 16,
    maxWidth: '80%',
  },
  coverMeta: {
    marginTop: 40,
  },
  coverMetaLabel: {
    fontSize: 8,
    color: COLORS.muted,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 5,
  },
  coverMetaValue: {
    fontFamily: 'Fraunces',
    fontSize: 14,
    color: COLORS.bone,
    marginBottom: 16,
  },
  coverFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    fontSize: 8,
    color: COLORS.muted,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },

  // Archetype Hero
  archetypeHero: {
    flex: 1,
    padding: 60,
    backgroundColor: COLORS.petrol,
    justifyContent: 'center',
  },
  archetypeLabel: {
    fontSize: 8,
    letterSpacing: 3,
    color: COLORS.goldLight,
    textTransform: 'uppercase',
    marginBottom: 16,
  },
  archetypeName: {
    fontFamily: 'Fraunces',
    fontSize: 42,
    color: COLORS.bone,
    letterSpacing: -0.8,
    lineHeight: 1.05,
    fontWeight: 400,
    marginBottom: 12,
  },
  archetypeTrait: {
    fontSize: 10,
    letterSpacing: 2,
    color: COLORS.bone,
    textTransform: 'uppercase',
    opacity: 0.7,
    marginBottom: 24,
  },
  archetypeKernmuster: {
    fontFamily: 'Fraunces',
    fontSize: 15,
    color: COLORS.bone,
    fontStyle: 'italic',
    lineHeight: 1.45,
    maxWidth: '85%',
    opacity: 0.92,
  },
  secondarySection: {
    marginTop: 32,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.inkSoft,
  },
  secondaryLabel: {
    fontSize: 8,
    letterSpacing: 2.5,
    color: COLORS.goldLight,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  secondaryName: {
    fontFamily: 'Fraunces',
    fontSize: 18,
    color: COLORS.bone,
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  secondaryTrait: {
    fontSize: 9,
    letterSpacing: 1.8,
    color: COLORS.bone,
    textTransform: 'uppercase',
    opacity: 0.6,
  },

  // Axis
  axisRow: {
    marginBottom: 14,
  },
  axisLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
    fontSize: 8,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
  },
  axisLabelLeft: { color: COLORS.muted },
  axisLabelRight: { color: COLORS.muted, textAlign: 'right' },
  axisValue: { color: COLORS.goldDeep, fontWeight: 600 },

  // List
  bullet: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  bulletArrow: {
    width: 14,
    fontSize: 9,
    color: COLORS.gold,
    fontWeight: 700,
  },
  bulletText: {
    flex: 1,
    fontSize: 10,
    lineHeight: 1.5,
    color: COLORS.ink,
  },

  // Callouts
  calloutGold: {
    backgroundColor: COLORS.boneSoft,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.gold,
    padding: 14,
    marginVertical: 10,
  },
  calloutLabel: {
    fontSize: 8,
    letterSpacing: 2,
    color: COLORS.goldDeep,
    textTransform: 'uppercase',
    marginBottom: 5,
  },

  // Module card
  moduleCard: {
    marginBottom: 18,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.boneLine,
  },
  moduleHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  moduleCode: {
    fontSize: 8,
    letterSpacing: 2,
    color: COLORS.gold,
    textTransform: 'uppercase',
    marginRight: 12,
  },
  moduleTitle: {
    fontFamily: 'Fraunces',
    fontSize: 15,
    fontWeight: 500,
    color: COLORS.ink,
  },

  // Footer
  pageFooter: {
    position: 'absolute',
    bottom: 30,
    left: 50,
    right: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 7,
    color: COLORS.muted,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },

  // Chip
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 6,
    gap: 5,
  },
  chip: {
    borderWidth: 1,
    borderColor: COLORS.boneLine,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    fontSize: 7.5,
    color: COLORS.muted,
    marginRight: 4,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
});

// ============== HELPERS ==============

const AXIS_LABELS: Record<keyof AxisScores, { low: string; high: string }> = {
  struktur_intuition: { low: 'Intuitiv', high: 'Strukturiert' },
  autoritaet_beteiligung: { low: 'Beteiligend', high: 'Autoritär' },
  leistung_beziehung: { low: 'Beziehungsorientiert', high: 'Leistungsorientiert' },
  stabilisierung_aktivierung: { low: 'Stabilisierend', high: 'Aktivierend' },
  reflexion_direktheit: { low: 'Direkt', high: 'Reflektiert' },
  standardisierung_anpassung: { low: 'Anpassend', high: 'Standardisierend' },
};

const AXIS_ORDER: (keyof AxisScores)[] = [
  'struktur_intuition',
  'autoritaet_beteiligung',
  'leistung_beziehung',
  'stabilisierung_aktivierung',
  'reflexion_direktheit',
  'standardisierung_anpassung',
];

const MODULE_TITLES: Record<string, string> = {
  A: 'Führungsidentität',
  B: 'Kommunikationsarchitektur',
  C: 'Entscheidung & Priorität',
  D: 'Fehler- & Lernkultur',
  E: 'Führung unter Druck',
  F: 'Motivation & Aktivierung',
  G: 'Beziehung & Vertrauen',
};

function AxisBar({ axis, value }: { axis: keyof AxisScores; value: number }) {
  const labels = AXIS_LABELS[axis];
  const pct = Math.round(value * 100);
  return (
    <View style={styles.axisRow}>
      <View style={styles.axisLabels}>
        <Text style={styles.axisLabelLeft}>{labels.low}</Text>
        <Text style={styles.axisValue}>{pct} %</Text>
        <Text style={styles.axisLabelRight}>{labels.high}</Text>
      </View>
      <Svg height={8} width="100%">
        <Rect x={0} y={3} width="100%" height={2} fill={COLORS.boneLine} rx={1} />
        <Circle cx={`${value * 100}%`} cy={4} r={3.5} fill={COLORS.gold} />
      </Svg>
    </View>
  );
}

function PageFooter({ pageNum, productName }: { pageNum: number; productName: string }) {
  return (
    <View style={styles.pageFooter} fixed>
      <Text>Humatrix · {productName}</Text>
      <Text>Seite {pageNum}</Text>
    </View>
  );
}

// ============== REPORT DOC ==============

export type ReportProps = {
  traineeName: string;
  sport: string;
  productName: string;
  productTier: number;
  date: string;
  primaryArchetype: {
    name_de: string;
    short_trait: string;
    kernmuster: string;
    staerken: string[];
    risiken: string[];
    entwicklungshebel: string[];
  };
  secondaryArchetype: {
    name_de: string;
    short_trait: string;
  };
  axisScores: AxisScores;
  texts: ReportOutput;
  // Optional 360° data
  fremdbildScores?: AxisScores | null;
  discrepancies?: Array<{
    axis: keyof AxisScores;
    selfValue: number;
    fremdValue: number;
    delta: number;
    magnitude: 'gering' | 'moderat' | 'hoch';
  }> | null;
  fremdbildResponseCount?: number;
  // Optional TeamCheck data
  teamcheckScores?: {
    coachImpact: number;
    psySafety: number;
    teamKlima: number;
    leistungsdruck: number;
    klarheit: number;
  } | null;
  teamcheckResponseCount?: number;

  // Premium Intelligence Layer (Phase 8)
  maturityScores?: {
    selbstregulation: number;
    perspektivflexibilitaet: number;
    konfliktreife: number;
    druckreife: number;
    verantwortungsklarheit: number;
    integrationsfaehigkeit: number;
  } | null;
  context?: {
    seasonPhase?: string | null;
    teamMaturity?: string | null;
    conflictState?: string | null;
    ageRange?: string | null;
    notes?: string | null;
  } | null;
};

export function ReportDocument(props: ReportProps) {
  const {
    traineeName, sport, productName, productTier, date,
    primaryArchetype, secondaryArchetype, axisScores, texts,
    fremdbildScores, discrepancies, fremdbildResponseCount,
    teamcheckScores, teamcheckResponseCount,
    maturityScores, context,
  } = props;

  const showAllModules = productTier >= 2;
  const has360 = !!(fremdbildScores && discrepancies && discrepancies.length > 0);
  const hasTeamcheck = !!teamcheckScores;
  const hasPremium = productTier >= 2 && (texts.coach_signature_portrait || texts.paradoxien);
  const hasMaturity = !!maturityScores && !!texts.fuehrungsreife_interpretation;

  const MATURITY_LABELS_PDF: Record<string, string> = {
    selbstregulation: 'Selbstregulation',
    perspektivflexibilitaet: 'Perspektivflexibilität',
    konfliktreife: 'Konfliktreife',
    druckreife: 'Druckreife',
    verantwortungsklarheit: 'Verantwortungsklarheit',
    integrationsfaehigkeit: 'Integrationsfähigkeit',
  };

  return (
    <Document
      title={`Humatrix Coach Assessment — ${traineeName}`}
      author="Humatrix — The Mind Club Company"
    >
      {/* COVER */}
      <Page size="A4" style={styles.pageDark}>
        <View style={styles.coverContainer}>
          <View>
            <View style={styles.coverHeader}>
              <Text style={styles.coverLogo}>HUMATRIX</Text>
              <Text style={{ fontSize: 8, color: COLORS.muted, letterSpacing: 2, textTransform: 'uppercase' }}>
                Coach Assessment
              </Text>
            </View>
            <View style={{ marginTop: 80 }}>
              <Text style={{ ...styles.kicker, color: COLORS.gold }}>Premium Diagnostik</Text>
              <Text style={styles.coverTitle}>
                Dein{'\n'}
                <Text style={styles.coverTitleGold}>Führungs-</Text>{'\n'}
                profil.
              </Text>
              <Text style={styles.coverSubtitle}>
                Ein hybrides Premium-Assessment für Führungsarchitektur, Coach Impact und Teamdynamik im Sport.
              </Text>
            </View>
          </View>

          <View>
            <View style={styles.coverMeta}>
              <Text style={styles.coverMetaLabel}>Für</Text>
              <Text style={styles.coverMetaValue}>{traineeName || 'Trainer:in'}</Text>
              {sport && (
                <>
                  <Text style={styles.coverMetaLabel}>Sport</Text>
                  <Text style={styles.coverMetaValue}>{sport}</Text>
                </>
              )}
              <Text style={styles.coverMetaLabel}>Paket</Text>
              <Text style={styles.coverMetaValue}>{productName}</Text>
              <Text style={styles.coverMetaLabel}>Erstellt</Text>
              <Text style={styles.coverMetaValue}>{date}</Text>
            </View>
            <View style={[styles.coverFooter, { marginTop: 60 }]}>
              <Text>© Humatrix · The Mind Club Company</Text>
              <Text>Vienna · Austria</Text>
            </View>
          </View>
        </View>
      </Page>

      {/* EXECUTIVE SUMMARY */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.kicker}>01 — Executive Summary</Text>
        <Text style={styles.h1}>Die Kernbotschaft{'\n'}auf einen Blick.</Text>
        <View style={styles.dividerGold} />
        <Text style={styles.quote}>{texts.executive_summary}</Text>
        <View style={{ marginTop: 28 }}>
          <Text style={styles.mono}>Primärer Archetyp</Text>
          <Text style={styles.h3}>{primaryArchetype.name_de}</Text>
          <Text style={styles.bodyMuted}>{primaryArchetype.short_trait}</Text>

          <View style={{ marginTop: 14 }}>
            <Text style={styles.mono}>Sekundärer Archetyp</Text>
            <Text style={{ ...styles.h3, fontSize: 13 }}>{secondaryArchetype.name_de}</Text>
            <Text style={styles.bodyMuted}>{secondaryArchetype.short_trait}</Text>
          </View>
        </View>
        <PageFooter pageNum={2} productName={productName} />
      </Page>

      {/* ARCHETYPE HERO */}
      <Page size="A4" style={styles.pagePetrol}>
        <Text style={styles.archetypeLabel}>Dein Primärer Archetyp</Text>
        <Text style={styles.archetypeName}>{primaryArchetype.name_de}</Text>
        <Text style={styles.archetypeTrait}>{primaryArchetype.short_trait}</Text>
        <Text style={styles.archetypeKernmuster}>{primaryArchetype.kernmuster}</Text>

        <View style={styles.secondarySection}>
          <Text style={styles.secondaryLabel}>Sekundärer Archetyp</Text>
          <Text style={styles.secondaryName}>{secondaryArchetype.name_de}</Text>
          <Text style={styles.secondaryTrait}>{secondaryArchetype.short_trait}</Text>
        </View>

        <View style={{ marginTop: 50 }}>
          <Text style={styles.secondaryLabel}>Interpretation</Text>
          <Text style={{ ...styles.bodyLight, marginTop: 10, fontFamily: 'Fraunces', fontStyle: 'italic', fontSize: 12, lineHeight: 1.55, opacity: 0.92 }}>
            {texts.archetyp_interpretation}
          </Text>
        </View>
      </Page>

      {/* AXIS PROFILE */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.kicker}>02 — Funktionale Signatur</Text>
        <Text style={styles.h1}>Deine 6 Kernachsen.</Text>
        <View style={styles.dividerGold} />
        <Text style={styles.body}>{texts.signature_narrative}</Text>

        <View style={{ marginTop: 24 }}>
          {AXIS_ORDER.map((axis) => (
            <AxisBar key={axis} axis={axis} value={axisScores[axis]} />
          ))}
        </View>
        <PageFooter pageNum={4} productName={productName} />
      </Page>

      {/* ============ PREMIUM INTELLIGENCE LAYER ============ */}

      {/* COACH SIGNATURE PORTRAIT (essayistic) */}
      {hasPremium && texts.coach_signature_portrait && (
        <Page size="A4" style={styles.pagePetrol}>
          <Text style={{ ...styles.kickerDark, color: COLORS.gold }}>Premium · Signature Portrait</Text>
          <Text style={{ ...styles.h1, color: COLORS.bone }}>
            Coach{'\n'}
            <Text style={{ fontFamily: 'Fraunces', fontStyle: 'italic', color: COLORS.gold }}>Signature.</Text>
          </Text>
          <View style={{ ...styles.dividerGold, backgroundColor: COLORS.gold }} />
          <Text style={{ ...styles.bodyLight, fontFamily: 'Fraunces', fontStyle: 'italic', fontSize: 13, lineHeight: 1.55 }}>
            {texts.coach_signature_portrait}
          </Text>
          {texts.fuehrungsenergie && (
            <View style={{ marginTop: 30, paddingTop: 18, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' }}>
              <Text style={{ fontSize: 8, letterSpacing: 2, color: COLORS.goldLight, textTransform: 'uppercase', marginBottom: 6 }}>
                Führungsenergie
              </Text>
              <Text style={{ fontSize: 14, color: COLORS.bone, fontFamily: 'Fraunces', fontStyle: 'italic' }}>
                {texts.fuehrungsenergie}
              </Text>
            </View>
          )}
        </Page>
      )}

      {/* PARADOXIEN + SHADOW PATTERN */}
      {hasPremium && (texts.paradoxien || texts.shadow_pattern) && (
        <Page size="A4" style={styles.page}>
          <Text style={styles.kicker}>Premium · Paradoxien & Kippmuster</Text>
          <Text style={styles.h1}>Die Spannungen,{'\n'}in denen du führst.</Text>
          <View style={styles.dividerGold} />

          {texts.paradoxien && texts.paradoxien.length > 0 && (
            <View style={{ marginTop: 18 }}>
              <Text style={{ fontSize: 8, letterSpacing: 2, color: COLORS.goldDeep, textTransform: 'uppercase', marginBottom: 10 }}>
                Trainer-Paradoxien
              </Text>
              {texts.paradoxien.map((p, i) => (
                <View key={i} style={{ marginBottom: 10, paddingLeft: 18, position: 'relative' }}>
                  <Text style={{ position: 'absolute', left: 0, top: 0, color: COLORS.gold, fontFamily: 'Manrope', fontSize: 10 }}>
                    {String(i + 1).padStart(2, '0')}
                  </Text>
                  <Text style={{ ...styles.body, fontFamily: 'Fraunces', fontStyle: 'italic', fontSize: 12 }}>
                    {p}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {texts.shadow_pattern && (
            <View style={{ ...styles.calloutGold, marginTop: 24 }}>
              <Text style={styles.calloutLabel}>Shadow Pattern · Kippmuster</Text>
              <Text style={styles.body}>{texts.shadow_pattern}</Text>
            </View>
          )}
        </Page>
      )}

      {/* WIRKUNG JE KONTEXT */}
      {hasPremium && texts.wirkung_je_kontext && (
        <Page size="A4" style={styles.page}>
          <Text style={styles.kicker}>Premium · Wirkung je Kontext</Text>
          <Text style={styles.h1}>Du wirkst nicht{'\n'}überall gleich.</Text>
          <View style={styles.dividerGold} />

          <View style={{ marginTop: 16 }}>
            {([
              ['trainingsalltag', 'Trainingsalltag'],
              ['spieltag', 'Spieltag'],
              ['niederlage', 'Niederlage'],
              ['konflikt', 'Konflikt'],
              ['krise', 'Krise / Akute Phase'],
            ] as const).map(([key, title]) => {
              const text = texts.wirkung_je_kontext?.[key];
              if (!text) return null;
              return (
                <View key={key} style={styles.moduleCard}>
                  <View style={styles.moduleHeader}>
                    <Text style={styles.moduleCode}>{title}</Text>
                  </View>
                  <Text style={{ ...styles.body, fontSize: 9.5 }}>{text}</Text>
                </View>
              );
            })}
          </View>
        </Page>
      )}

      {/* FÜHRUNGSREIFE */}
      {hasMaturity && maturityScores && (
        <Page size="A4" style={styles.page}>
          <Text style={styles.kicker}>Premium · Führungsreife</Text>
          <Text style={styles.h1}>
            Stil ist das eine.{'\n'}
            <Text style={{ fontFamily: 'Fraunces', fontStyle: 'italic' }}>Reife</Text> ist etwas anderes.
          </Text>
          <View style={styles.dividerGold} />
          <Text style={styles.body}>{texts.fuehrungsreife_interpretation}</Text>

          <View style={{ marginTop: 22 }}>
            {Object.entries(maturityScores).map(([key, val]) => (
              <View key={key} style={{ marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={{ fontFamily: 'Manrope', fontSize: 10, fontWeight: 600, color: COLORS.ink }}>
                    {MATURITY_LABELS_PDF[key] ?? key}
                  </Text>
                  <Text style={{ fontFamily: 'Manrope', fontSize: 10, fontWeight: 600, color: COLORS.goldDeep }}>
                    {Math.round(val * 100)} %
                  </Text>
                </View>
                <Svg height={8} width="100%">
                  <Rect x={0} y={3} width="100%" height={2} fill={COLORS.boneLine} rx={1} />
                  <Circle cx={`${val * 100}%`} cy={4} r={4} fill={COLORS.gold} />
                </Svg>
              </View>
            ))}
          </View>
        </Page>
      )}

      {/* SAISONPHASE & COACH-TO-TEAM-FIT */}
      {hasPremium && (texts.saisonphase_interpretation || texts.coach_to_team_fit) && (
        <Page size="A4" style={styles.page}>
          <Text style={styles.kicker}>Premium · Kontext-Fit</Text>
          <Text style={styles.h1}>Stil × Phase × Team.</Text>
          <View style={styles.dividerGold} />

          {texts.saisonphase_interpretation && (
            <View style={{ marginTop: 14 }}>
              <Text style={{ fontSize: 8, letterSpacing: 2, color: COLORS.goldDeep, textTransform: 'uppercase', marginBottom: 8 }}>
                Wirkung in aktueller Saisonphase
              </Text>
              <Text style={styles.body}>{texts.saisonphase_interpretation}</Text>
            </View>
          )}

          {texts.coach_to_team_fit && (
            <View style={{ marginTop: 18 }}>
              <Text style={{ fontSize: 8, letterSpacing: 2, color: COLORS.goldDeep, textTransform: 'uppercase', marginBottom: 8 }}>
                Coach-to-Team Fit
              </Text>
              <Text style={styles.body}>{texts.coach_to_team_fit}</Text>
            </View>
          )}

          {texts.spielerbedarf && (
            <View style={{ ...styles.calloutGold, marginTop: 18 }}>
              <Text style={styles.calloutLabel}>Was Spieler von diesem Stil brauchen</Text>
              <Text style={styles.body}>{texts.spielerbedarf}</Text>
            </View>
          )}
        </Page>
      )}

      {/* NO-GO WARNUNGEN */}
      {hasPremium && texts.no_go_warnungen && texts.no_go_warnungen.length > 0 && (
        <Page size="A4" style={styles.page}>
          <Text style={styles.kicker}>Premium · Warnhinweise</Text>
          <Text style={styles.h1}>
            Was du{'\n'}
            <Text style={{ fontFamily: 'Fraunces', fontStyle: 'italic' }}>nicht</Text> tun solltest.
          </Text>
          <View style={styles.dividerGold} />
          <Text style={{ ...styles.body, fontStyle: 'italic', color: COLORS.muted, marginBottom: 18 }}>
            Keine Moral, sondern Praxis. Basierend auf deinem Profil sind dies die typischen Fehler,
            die dein Stil unter Druck produziert — und die du kennen solltest.
          </Text>

          {texts.no_go_warnungen.map((warn, i) => (
            <View key={i} style={{ marginBottom: 12, paddingLeft: 24, position: 'relative' }}>
              <Text style={{ position: 'absolute', left: 0, top: 1, color: COLORS.gold, fontFamily: 'Manrope', fontSize: 11, fontWeight: 700 }}>
                ⌀
              </Text>
              <Text style={{ ...styles.body, fontSize: 10.5 }}>{warn}</Text>
            </View>
          ))}

          {texts.beratungswuerdigkeit && (
            <View style={{ marginTop: 28, paddingTop: 14, borderTopWidth: 1, borderTopColor: COLORS.boneLine }}>
              <Text style={{ fontSize: 8, letterSpacing: 2, color: COLORS.muted, textTransform: 'uppercase', marginBottom: 4 }}>
                Beratungswürdigkeit dieses Profils
              </Text>
              <Text style={{ fontFamily: 'Fraunces', fontSize: 18, color: COLORS.goldDeep, textTransform: 'uppercase', letterSpacing: 2 }}>
                {texts.beratungswuerdigkeit}
              </Text>
            </View>
          )}
        </Page>
      )}

      {/* 360° SPIEGEL — INTRO + COMPARISON (only if data available) */}
      {has360 && (
        <Page size="A4" style={styles.pagePetrol}>
          <Text style={{ ...styles.kickerDark, color: COLORS.gold }}>03 — 360° Spiegel</Text>
          <Text style={{ ...styles.h1, color: COLORS.bone }}>
            Wie dein Team{'\n'}
            <Text style={{ fontFamily: 'Fraunces', fontStyle: 'italic', color: COLORS.gold }}>dich wirklich</Text>{'\n'}
            erlebt.
          </Text>
          <View style={{ ...styles.dividerGold, backgroundColor: COLORS.gold }} />
          <Text style={{ ...styles.bodyLight, opacity: 0.92, fontFamily: 'Fraunces', fontStyle: 'italic', fontSize: 12 }}>
            {texts.fremdbild_summary}
          </Text>

          <View style={{ marginTop: 28, paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' }}>
            <Text style={{ fontSize: 8, letterSpacing: 2, color: COLORS.goldLight, textTransform: 'uppercase', marginBottom: 6 }}>
              Datenbasis
            </Text>
            <Text style={{ fontSize: 11, color: COLORS.bone }}>
              {fremdbildResponseCount ?? 0} eingegangene Fremdeinschätzungen · vollständig anonym aggregiert
            </Text>
          </View>
        </Page>
      )}

      {has360 && (
        <Page size="A4" style={styles.page}>
          <Text style={styles.kicker}>03 — Selbst- vs. Fremdbild</Text>
          <Text style={styles.h1}>Übereinstimmung,{'\n'}Spannung, Hebel.</Text>
          <View style={styles.dividerGold} />
          <Text style={styles.body}>{texts.spiegel_narrative}</Text>

          <View style={{ marginTop: 22 }}>
            {discrepancies!.map((d) => {
              const labels = AXIS_LABELS[d.axis];
              const selfPct = Math.round(d.selfValue * 100);
              const fremdPct = Math.round(d.fremdValue * 100);
              const deltaPct = Math.round(d.delta * 100);
              const magColor =
                d.magnitude === 'hoch' ? COLORS.gold :
                d.magnitude === 'moderat' ? COLORS.goldDeep :
                COLORS.muted;
              return (
                <View key={d.axis} style={{ marginBottom: 14 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4, fontSize: 8, textTransform: 'uppercase', letterSpacing: 1.4 }}>
                    <Text style={{ color: COLORS.muted }}>{labels.low}</Text>
                    <Text style={{ color: magColor, fontWeight: 700 }}>
                      Δ {deltaPct >= 0 ? '+' : ''}{deltaPct}% · {d.magnitude}
                    </Text>
                    <Text style={{ color: COLORS.muted }}>{labels.high}</Text>
                  </View>
                  <Svg height={14} width="100%">
                    <Rect x={0} y={6} width="100%" height={2} fill={COLORS.boneLine} rx={1} />
                    {/* Self marker (open circle) */}
                    <Circle cx={`${d.selfValue * 100}%`} cy={7} r={4} fill={COLORS.bone} stroke={COLORS.ink} strokeWidth={1.5} />
                    {/* Fremd marker (filled gold) */}
                    <Circle cx={`${d.fremdValue * 100}%`} cy={7} r={4} fill={COLORS.gold} />
                  </Svg>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 3, fontSize: 7.5, color: COLORS.muted }}>
                    <Text>○ Selbst {selfPct}%</Text>
                    <Text>● Fremd {fremdPct}%</Text>
                  </View>
                </View>
              );
            })}
          </View>

          <View style={{ ...styles.calloutGold, marginTop: 20 }}>
            <Text style={styles.calloutLabel}>Blind Spots</Text>
            <Text style={styles.body}>{texts.blind_spots ?? 'Keine signifikanten Blind Spots erkennbar.'}</Text>
          </View>
        </Page>
      )}

      {has360 && texts.diskrepanz_interpretationen && (
        <Page size="A4" style={styles.page}>
          <Text style={styles.kicker}>03 — Diskrepanz pro Achse</Text>
          <Text style={styles.h1}>Was die Lücken{'\n'}konkret bedeuten.</Text>
          <View style={styles.dividerGold} />

          {AXIS_ORDER.map((axis) => {
            const interp = texts.diskrepanz_interpretationen?.[axis];
            const d = discrepancies!.find((x) => x.axis === axis);
            if (!interp || !d) return null;
            const labels = AXIS_LABELS[axis];
            return (
              <View key={axis} style={styles.moduleCard}>
                <View style={styles.moduleHeader}>
                  <Text style={styles.moduleCode}>
                    {labels.low} ↔ {labels.high}
                  </Text>
                  <Text style={{ ...styles.moduleTitle, fontSize: 12, color: d.magnitude === 'hoch' ? COLORS.gold : COLORS.ink }}>
                    Δ {Math.round(d.delta * 100) >= 0 ? '+' : ''}{Math.round(d.delta * 100)}%
                  </Text>
                </View>
                <Text style={{ ...styles.body, fontSize: 9.5 }}>{interp}</Text>
              </View>
            );
          })}
        </Page>
      )}

      {/* PRESSURE PROFILE */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.kicker}>{has360 ? '04' : '03'} — Druckprofil</Text>
        <Text style={styles.h1}>Wie du führst, wenn's{'\n'}wirklich zählt.</Text>
        <View style={styles.dividerGold} />
        <Text style={styles.body}>{texts.druckprofil}</Text>

        <View style={styles.calloutGold}>
          <Text style={styles.calloutLabel}>Hauptrisiken</Text>
          <Text style={styles.body}>{texts.hauptrisiken}</Text>
        </View>
        <PageFooter pageNum={5} productName={productName} />
      </Page>

      {/* TEAMCHECK PAGES (nur Tier 4+) */}
      {hasTeamcheck && (
        <Page size="A4" style={styles.pagePetrol}>
          <Text style={{ ...styles.kickerDark, color: COLORS.gold }}>05 — TeamCheck</Text>
          <Text style={{ ...styles.h1, color: COLORS.bone }}>
            Was dein{'\n'}
            <Text style={{ fontFamily: 'Fraunces', fontStyle: 'italic', color: COLORS.gold }}>Team</Text>{'\n'}
            wirklich erlebt.
          </Text>
          <View style={{ ...styles.dividerGold, backgroundColor: COLORS.gold }} />
          <Text style={{ ...styles.bodyLight, opacity: 0.92, fontFamily: 'Fraunces', fontStyle: 'italic', fontSize: 12 }}>
            {texts.teamcheck_summary}
          </Text>

          <View style={{ marginTop: 28, paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' }}>
            <Text style={{ fontSize: 8, letterSpacing: 2, color: COLORS.goldLight, textTransform: 'uppercase', marginBottom: 6 }}>
              Datenbasis
            </Text>
            <Text style={{ fontSize: 11, color: COLORS.bone }}>
              {teamcheckResponseCount ?? 0} eingegangene Spielerantworten · vollständig anonym aggregiert · Schwelle für Auswertung: 5
            </Text>
          </View>
        </Page>
      )}

      {hasTeamcheck && teamcheckScores && (
        <Page size="A4" style={styles.page}>
          <Text style={styles.kicker}>05 — Team-Scores</Text>
          <Text style={styles.h1}>Fünf Dimensionen{'\n'}der Team-Realität.</Text>
          <View style={styles.dividerGold} />
          <Text style={styles.body}>{texts.teamcheck_narrative}</Text>

          <View style={{ marginTop: 22 }}>
            {([
              ['coach_impact', teamcheckScores.coachImpact, 'Coach Impact', 'Negativ', 'Positiv'],
              ['psy_safety', teamcheckScores.psySafety, 'Psychologische Sicherheit', 'Unsicher', 'Sicher'],
              ['team_klima', teamcheckScores.teamKlima, 'Teamklima', 'Schwach', 'Stark'],
              ['leistungsdr', teamcheckScores.leistungsdruck, 'Leistungsklima', 'Erdrückend', 'Inspirierend'],
              ['klarheit', teamcheckScores.klarheit, 'Rollenklarheit', 'Unklar', 'Klar'],
            ] as const).map(([key, val, title, low, high]) => (
              <View key={key} style={{ marginBottom: 18 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={{ fontFamily: 'Manrope', fontSize: 10, fontWeight: 600, color: COLORS.ink }}>{title}</Text>
                  <Text style={{ fontFamily: 'Manrope', fontSize: 10, fontWeight: 600, color: COLORS.goldDeep }}>{Math.round(val * 100)} %</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4, fontSize: 8, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 1.4 }}>
                  <Text>{low}</Text>
                  <Text>{high}</Text>
                </View>
                <Svg height={8} width="100%">
                  <Rect x={0} y={3} width="100%" height={2} fill={COLORS.boneLine} rx={1} />
                  <Circle cx={`${val * 100}%`} cy={4} r={4} fill={COLORS.gold} />
                </Svg>
              </View>
            ))}
          </View>

          <View style={{ ...styles.calloutGold, marginTop: 14 }}>
            <Text style={styles.calloutLabel}>Team-Dynamiken</Text>
            <Text style={styles.body}>{texts.team_dynamics}</Text>
          </View>
        </Page>
      )}

      {hasTeamcheck && texts.team_handlungsempfehlungen && texts.team_handlungsempfehlungen.length > 0 && (
        <Page size="A4" style={styles.page}>
          <Text style={styles.kicker}>05 — Sofort-Maßnahmen</Text>
          <Text style={styles.h1}>14 Tage.{'\n'}Konkrete Schritte.</Text>
          <View style={styles.dividerGold} />
          <View style={{ marginTop: 16 }}>
            {texts.team_handlungsempfehlungen.map((step, i) => (
              <View key={i} style={styles.moduleCard}>
                <View style={styles.moduleHeader}>
                  <Text style={{ ...styles.moduleCode, fontFamily: 'Fraunces', fontSize: 20, color: COLORS.gold, letterSpacing: 0 }}>
                    {String(i + 1).padStart(2, '0')}
                  </Text>
                </View>
                <Text style={styles.body}>{step}</Text>
              </View>
            ))}
          </View>
        </Page>
      )}

      {/* MODULE INTERPRETATIONS */}
      {showAllModules && (
        <Page size="A4" style={styles.page}>
          <Text style={styles.kicker}>04 — Deine Sieben Module</Text>
          <Text style={styles.h1}>Die Architektur deiner Führung.</Text>
          <View style={styles.dividerGold} />

          {Object.entries(texts.modul_interpretationen).slice(0, 4).map(([code, text]) => (
            <View key={code} style={styles.moduleCard}>
              <View style={styles.moduleHeader}>
                <Text style={styles.moduleCode}>Modul {code}</Text>
                <Text style={styles.moduleTitle}>{MODULE_TITLES[code] ?? code}</Text>
              </View>
              <Text style={styles.body}>{text}</Text>
            </View>
          ))}
          <PageFooter pageNum={6} productName={productName} />
        </Page>
      )}

      {showAllModules && (
        <Page size="A4" style={styles.page}>
          <Text style={styles.kicker}>04 — Deine Sieben Module (Fortsetzung)</Text>
          <View style={styles.dividerGold} />

          {Object.entries(texts.modul_interpretationen).slice(4).map(([code, text]) => (
            <View key={code} style={styles.moduleCard}>
              <View style={styles.moduleHeader}>
                <Text style={styles.moduleCode}>Modul {code}</Text>
                <Text style={styles.moduleTitle}>{MODULE_TITLES[code] ?? code}</Text>
              </View>
              <Text style={styles.body}>{text}</Text>
            </View>
          ))}
          <PageFooter pageNum={7} productName={productName} />
        </Page>
      )}

      {/* STRENGTHS / RISKS / LEVERS */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.kicker}>05 — Stärken · Risiken · Hebel</Text>
        <Text style={styles.h1}>Wo du stark bist{'\n'}und wo du drehst.</Text>
        <View style={styles.dividerGold} />

        <Text style={styles.h3}>Deine Stärken</Text>
        {primaryArchetype.staerken.map((s, i) => (
          <View key={i} style={styles.bullet}>
            <Text style={styles.bulletArrow}>→</Text>
            <Text style={styles.bulletText}>{s}</Text>
          </View>
        ))}

        <Text style={styles.h3}>Typische Risiken</Text>
        {primaryArchetype.risiken.map((r, i) => (
          <View key={i} style={styles.bullet}>
            <Text style={styles.bulletArrow}>→</Text>
            <Text style={styles.bulletText}>{r}</Text>
          </View>
        ))}

        <Text style={styles.h3}>Entwicklungshebel</Text>
        {primaryArchetype.entwicklungshebel.map((h, i) => (
          <View key={i} style={styles.bullet}>
            <Text style={styles.bulletArrow}>→</Text>
            <Text style={styles.bulletText}>{h}</Text>
          </View>
        ))}

        <View style={styles.calloutGold}>
          <Text style={styles.calloutLabel}>Entwicklungspfad</Text>
          <Text style={styles.body}>{texts.entwicklungspfad}</Text>
        </View>
        <PageFooter pageNum={8} productName={productName} />
      </Page>

      {/* DISCUSSION GUIDE */}
      {productTier >= 2 && (
        <Page size="A4" style={styles.page}>
          <Text style={styles.kicker}>06 — Gesprächsleitfaden</Text>
          <Text style={styles.h1}>Fragen, die zu deinem{'\n'}Profil passen.</Text>
          <View style={styles.dividerGold} />
          <Text style={styles.bodyMuted}>
            Fünf offene Fragen zur Selbstreflexion oder für Einzelgespräche mit Spielern.
            Formuliert speziell für dein Profil und seine Spannungen.
          </Text>
          <View style={{ marginTop: 20 }}>
            {texts.gespraechsleitfaden.map((q, i) => (
              <View key={i} style={{ marginBottom: 14 }}>
                <Text style={{ fontSize: 8, color: COLORS.gold, letterSpacing: 2, marginBottom: 3 }}>
                  FRAGE {String(i + 1).padStart(2, '0')}
                </Text>
                <Text style={styles.quote}>{q}</Text>
              </View>
            ))}
          </View>
          <PageFooter pageNum={9} productName={productName} />
        </Page>
      )}

      {/* 30 DAYS */}
      {productTier >= 2 && (
        <Page size="A4" style={styles.page}>
          <Text style={styles.kicker}>07 — Die Nächsten 30 Tage</Text>
          <Text style={styles.h1}>Konkrete Schritte,{'\n'}kein Warten.</Text>
          <View style={styles.dividerGold} />
          <View style={{ marginTop: 16 }}>
            {texts.naechste_30_tage.map((step, i) => (
              <View key={i} style={styles.moduleCard}>
                <View style={styles.moduleHeader}>
                  <Text style={{ ...styles.moduleCode, fontFamily: 'Fraunces', fontSize: 20, color: COLORS.gold, letterSpacing: 0 }}>
                    {String(i + 1).padStart(2, '0')}
                  </Text>
                </View>
                <Text style={styles.body}>{step}</Text>
              </View>
            ))}
          </View>
          <PageFooter pageNum={10} productName={productName} />
        </Page>
      )}

      {/* CLOSING */}
      <Page size="A4" style={styles.pageDark}>
        <View style={{ flex: 1, padding: 60, justifyContent: 'space-between' }}>
          <Text style={{ ...styles.coverLogo, color: COLORS.bone }}>HUMATRIX</Text>
          <View>
            <Text style={{ ...styles.kickerDark, marginBottom: 20 }}>Ende des Berichts</Text>
            <Text style={{ ...styles.coverTitle, fontSize: 36, lineHeight: 1.05 }}>
              Ein Profil{'\n'}
              <Text style={styles.coverTitleGold}>ist der Anfang.</Text>{'\n'}
              Nicht das Ziel.
            </Text>
            <Text style={{ ...styles.coverSubtitle, maxWidth: '75%', marginTop: 20, color: COLORS.bone, opacity: 0.8 }}>
              Wenn du mit deinem Team den nächsten Schritt gehen willst — wir haben dafür das 360° Spiegel, den TeamCheck und die Saisonbegleitung.
            </Text>
          </View>
          <View style={styles.coverFooter}>
            <Text>© Humatrix · The Mind Club Company · Vienna</Text>
            <Text>coachcheck.humatrix.cc</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
