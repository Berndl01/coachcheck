/**
 * CoachCheck – Report PDF document (@react-pdf/renderer).
 */
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
import { existsSync } from 'node:fs';
import { join as pathJoin, dirname as pathDirname } from 'node:path';
import type { AxisScores } from '@/lib/scoring';
import type { ReportOutput } from '@/lib/ai/report-prompt';

// ============== FONTS ==============
// TTF files from @expo-google-fonts — bundled locally, no CDN dependency.
// node:fs/node:path werden als statische ESM-Importe geladen; das Modul wird
// ausschließlich zur Laufzeit (node runtime) dynamisch importiert, nie zur
// Build-Zeit ausgeführt — daher ist der Node-IO hier unkritisch.
let fontsRegistered = false;
let fontsAvailable = false;
function registerFonts(): boolean {
  if (fontsRegistered) return fontsAvailable;
  fontsRegistered = true;

  try {
    // Walk up from CWD to find node_modules
    const findNodeModules = (): string => {
      let dir = process.cwd();
      for (let i = 0; i < 6; i++) {
        const candidate = pathJoin(dir, 'node_modules');
        if (existsSync(candidate)) return candidate;
        dir = pathDirname(dir);
      }
      return pathJoin(process.cwd(), 'node_modules');
    };

    const nm = findNodeModules();
    const fraunces = pathJoin(nm, '@expo-google-fonts', 'fraunces');
    const manrope = pathJoin(nm, '@expo-google-fonts', 'manrope');

    // Return path only if file exists
    const safePath = (p: string): string | null => (existsSync(p) ? p : null);

    const f300 = safePath(pathJoin(fraunces, '300Light/Fraunces_300Light.ttf'));
    const f400 = safePath(pathJoin(fraunces, '400Regular/Fraunces_400Regular.ttf'));
    const f500 = safePath(pathJoin(fraunces, '500Medium/Fraunces_500Medium.ttf'));
    const f300i = safePath(pathJoin(fraunces, '300Light_Italic/Fraunces_300Light_Italic.ttf'));
    const f400i = safePath(pathJoin(fraunces, '400Regular_Italic/Fraunces_400Regular_Italic.ttf'));
    const f500i = safePath(pathJoin(fraunces, '500Medium_Italic/Fraunces_500Medium_Italic.ttf'));

    const m400 = safePath(pathJoin(manrope, '400Regular/Manrope_400Regular.ttf'));
    const m500 = safePath(pathJoin(manrope, '500Medium/Manrope_500Medium.ttf'));
    const m600 = safePath(pathJoin(manrope, '600SemiBold/Manrope_600SemiBold.ttf'));
    const m700 = safePath(pathJoin(manrope, '700Bold/Manrope_700Bold.ttf'));

    if (f400 && f400i && m400) {
      Font.register({
        family: 'Fraunces',
        fonts: [
          ...(f300 ? [{ src: f300, fontWeight: 300 as const, fontStyle: 'normal' as const }] : []),
          { src: f400, fontWeight: 400, fontStyle: 'normal' as const },
          ...(f500 ? [{ src: f500, fontWeight: 500 as const, fontStyle: 'normal' as const }] : []),
          ...(f300i ? [{ src: f300i, fontWeight: 300 as const, fontStyle: 'italic' as const }] : []),
          { src: f400i, fontWeight: 400, fontStyle: 'italic' as const },
          ...(f500i ? [{ src: f500i, fontWeight: 500 as const, fontStyle: 'italic' as const }] : []),
        ],
      });

      Font.register({
        family: 'Manrope',
        fonts: [
          { src: m400, fontWeight: 400, fontStyle: 'normal' as const },
          ...(m500 ? [{ src: m500, fontWeight: 500 as const, fontStyle: 'normal' as const }] : []),
          ...(m600 ? [{ src: m600, fontWeight: 600 as const, fontStyle: 'normal' as const }] : []),
          ...(m700 ? [{ src: m700, fontWeight: 700 as const, fontStyle: 'normal' as const }] : []),
          // Manrope has no true italic in this package — reuse regular glyphs
          { src: m400, fontWeight: 400, fontStyle: 'italic' as const },
          ...(m500 ? [{ src: m500, fontWeight: 500 as const, fontStyle: 'italic' as const }] : []),
        ],
      });
      fontsAvailable = true;
    } else {
      console.warn('[PDF] Custom fonts not found, using built-in fallbacks');
    }
  } catch (err) {
    console.warn('[PDF] Font registration failed:', err instanceof Error ? err.message : err);
    fontsAvailable = false;
  }
  return fontsAvailable;
}


// Marken-Typografie wird aktiv, sobald die TTFs registriert werden konnten;
// andernfalls sichere Standard-PDF-Fonts (verhindert Produktionsabbrüche,
// falls die Font-Dateien im Server-Bundle fehlen oder nicht lesbar sind).
const FONTS_OK = registerFonts();
const PDF_SANS = FONTS_OK ? 'Manrope' : 'Helvetica';
const PDF_DISPLAY = FONTS_OK ? 'Fraunces' : 'Helvetica';

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
    fontFamily: PDF_SANS,
    fontSize: 10,
    color: COLORS.ink,
    paddingTop: 60,
    paddingBottom: 60,
    paddingHorizontal: 50,
    backgroundColor: COLORS.bone,
    lineHeight: 1.5,
  },
  pageDark: {
    fontFamily: PDF_SANS,
    fontSize: 10,
    color: COLORS.bone,
    padding: 0,
    backgroundColor: COLORS.ink,
  },
  pagePetrol: {
    fontFamily: PDF_SANS,
    fontSize: 10,
    color: COLORS.bone,
    paddingTop: 60,
    paddingBottom: 60,
    paddingHorizontal: 50,
    backgroundColor: COLORS.petrol,
  },

  // Typography
  kicker: {
    fontFamily: PDF_SANS,
    fontSize: 8,
    color: COLORS.muted,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 14,
  },
  kickerDark: {
    fontFamily: PDF_SANS,
    fontSize: 8,
    color: COLORS.gold,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 14,
  },
  h1: {
    fontFamily: PDF_DISPLAY,
    fontSize: 36,
    fontWeight: 400,
    letterSpacing: -0.8,
    lineHeight: 1.05,
    marginBottom: 14,
  },
  h2: {
    fontFamily: PDF_DISPLAY,
    fontSize: 22,
    fontWeight: 400,
    letterSpacing: -0.4,
    marginBottom: 10,
    marginTop: 20,
  },
  h3: {
    fontFamily: PDF_DISPLAY,
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
    fontFamily: PDF_DISPLAY,
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 1.5,
    color: COLORS.ink,
    marginBottom: 9,
  },
  quoteLight: {
    fontFamily: PDF_DISPLAY,
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

  // 2x2 Positionsmatrix
  matrixBlock: { marginTop: 18, marginBottom: 6, alignItems: 'center' },
  matrixTitle: {
    fontFamily: PDF_SANS, fontSize: 8, letterSpacing: 1.5, textTransform: 'uppercase',
    color: COLORS.goldDeep, marginBottom: 6, textAlign: 'center',
  },
  matrixPole: {
    fontFamily: PDF_SANS, fontSize: 7.5, letterSpacing: 0.8, textTransform: 'uppercase',
    color: COLORS.muted, textAlign: 'center', marginVertical: 3,
  },
  matrixPoleSide: {
    fontFamily: PDF_SANS, fontSize: 7.5, letterSpacing: 0.4, textTransform: 'uppercase',
    color: COLORS.muted, width: 84,
  },
  matrixQuad: {
    position: 'absolute', fontFamily: PDF_SANS, fontSize: 6.5, color: COLORS.mutedDark,
    maxWidth: 70,
  },
  matrixCaption: {
    fontFamily: PDF_SANS, fontSize: 8, color: COLORS.muted, textAlign: 'center', marginTop: 6,
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
    fontFamily: PDF_SANS,
    fontSize: 11,
    letterSpacing: 4.5,
    color: COLORS.bone,
    fontWeight: 400,
    textTransform: 'uppercase',
  },
  coverTitle: {
    fontFamily: PDF_DISPLAY,
    fontSize: 52,
    color: COLORS.bone,
    letterSpacing: -1.2,
    lineHeight: 1,
    fontWeight: 400,
  },
  coverTitleGold: {
    color: COLORS.gold,
    fontStyle: 'italic',
  },
  coverSubtitle: {
    fontFamily: PDF_DISPLAY,
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
    fontFamily: PDF_DISPLAY,
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
    fontFamily: PDF_DISPLAY,
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
    fontFamily: PDF_DISPLAY,
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
    fontFamily: PDF_DISPLAY,
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
    alignItems: 'flex-start',
    marginBottom: 5,
  },
  bulletMark: {
    width: 12,
    paddingTop: 4,
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
    fontFamily: PDF_DISPLAY,
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
  // NaN-Guard: ungültige Werte → 50 % (Mittelpunkt), damit SVG nie crasht
  const safe = Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0.5;
  const pct = Math.round(safe * 100);
  return (
    <View style={styles.axisRow}>
      <View style={styles.axisLabels}>
        <Text style={styles.axisLabelLeft}>{labels.low}</Text>
        <Text style={styles.axisValue}>{pct} %</Text>
        <Text style={styles.axisLabelRight}>{labels.high}</Text>
      </View>
      <Svg height={8} width="100%">
        <Rect x={0} y={3} width="100%" height={2} fill={COLORS.boneLine} rx={1} />
        <Circle cx={`${pct}%`} cy={4} r={3.5} fill={COLORS.gold} />
      </Svg>
    </View>
  );
}

/**
 * 2×2-Positionsmatrix: plottet den Trainer als Punkt zwischen zwei Achsenpolen.
 * Macht die Positionierung sichtbar statt nur beschreibend (Consulting-Stil).
 * NaN-sicher: ungültige Werte → Mittelpunkt.
 */
function PositionMatrix({
  title, xAxis, yAxis, xValue, yValue, quadrants,
}: {
  title: string;
  xAxis: keyof AxisScores;
  yAxis: keyof AxisScores;
  xValue: number;
  yValue: number;
  quadrants: [string, string, string, string]; // [oben-links, oben-rechts, unten-rechts, unten-links]
}) {
  const SIZE = 158;
  const clamp = (v: number) => (Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : 0.5);
  const xv = clamp(xValue);
  const yv = clamp(yValue);
  const dotX = xv * SIZE;
  const dotY = (1 - yv) * SIZE; // hoher Wert = oben
  const xL = AXIS_LABELS[xAxis];
  const yL = AXIS_LABELS[yAxis];
  return (
    <View style={styles.matrixBlock}>
      <Text style={styles.matrixTitle}>{title}</Text>
      <Text style={styles.matrixPole}>{yL.high}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text style={[styles.matrixPoleSide, { textAlign: 'right' }]}>{xL.low}</Text>
        <View style={{ position: 'relative', width: SIZE, height: SIZE, marginHorizontal: 6 }}>
          <Svg width={SIZE} height={SIZE} style={{ position: 'absolute', top: 0, left: 0 }}>
            <Rect x={0.5} y={0.5} width={SIZE - 1} height={SIZE - 1} fill={COLORS.boneSoft} stroke={COLORS.boneLine} strokeWidth={1} rx={3} />
            <Line x1={SIZE / 2} y1={6} x2={SIZE / 2} y2={SIZE - 6} stroke={COLORS.boneLine} strokeWidth={0.75} />
            <Line x1={6} y1={SIZE / 2} x2={SIZE - 6} y2={SIZE / 2} stroke={COLORS.boneLine} strokeWidth={0.75} />
            <Circle cx={dotX} cy={dotY} r={10} fill={COLORS.gold} opacity={0.16} />
            <Circle cx={dotX} cy={dotY} r={4.5} fill={COLORS.gold} stroke={COLORS.bone} strokeWidth={1.2} />
          </Svg>
          <Text style={[styles.matrixQuad, { top: 5, left: 5, textAlign: 'left' }]}>{quadrants[0]}</Text>
          <Text style={[styles.matrixQuad, { top: 5, right: 5, textAlign: 'right' }]}>{quadrants[1]}</Text>
          <Text style={[styles.matrixQuad, { bottom: 5, right: 5, textAlign: 'right' }]}>{quadrants[2]}</Text>
          <Text style={[styles.matrixQuad, { bottom: 5, left: 5, textAlign: 'left' }]}>{quadrants[3]}</Text>
        </View>
        <Text style={styles.matrixPoleSide}>{xL.high}</Text>
      </View>
      <Text style={styles.matrixPole}>{yL.low}</Text>
      <Text style={styles.matrixCaption}>
        Deine Position: {Math.round(xv * 100)}% {xL.high} · {Math.round(yv * 100)}% {yL.high}
      </Text>
    </View>
  );
}


function safePct(value: number | null | undefined): string {
  const v = typeof value === 'number' && Number.isFinite(value) ? value : 0.5;
  const clamped = Math.max(0, Math.min(1, v));
  return `${Math.round(clamped * 100)}%`;
}

function PageFooter({ productName }: { pageNum?: number; productName: string }) {
  return (
    <View style={styles.pageFooter} fixed>
      <Text>Humatrix · {productName}</Text>
      <Text render={({ pageNumber, totalPages }) => `Seite ${pageNumber} / ${totalPages}`} />
    </View>
  );
}

/**
 * Font-unabhängiger Aufzählungspunkt. Statt eines Pfeil-Glyphs (→), der je
 * nach eingebettetem Font fehlen kann, wird ein kleines gezeichnetes Quadrat
 * gerendert — rendert in jeder Schrift sauber.
 */
function Bullet({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <View style={styles.bullet}>
      <View style={styles.bulletMark}>
        <Svg width={5} height={5}>
          <Rect x={0} y={0} width={5} height={5} fill={COLORS.gold} rx={1} />
        </Svg>
      </View>
      <Text style={[styles.bulletText, dark ? { color: COLORS.bone } : {}]}>{children}</Text>
    </View>
  );
}

/** Kleiner gezeichneter Marker für die Selbst-/Fremd-Legende (ersetzt ○ / ●). */
function LegendDot({ filled }: { filled: boolean }) {
  return (
    <Svg width={7} height={7} style={{ marginRight: 3 }}>
      <Circle
        cx={3.5}
        cy={3.5}
        r={2.8}
        fill={filled ? COLORS.gold : COLORS.bone}
        stroke={COLORS.ink}
        strokeWidth={filled ? 0 : 1}
      />
    </Svg>
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
  /** Mischprofil-Einordnung (Bestcase §9): 'mixed' → PDF nennt es Mischprofil. */
  profileType?: 'dominant' | 'mixed' | null;
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
  /** Achtsamkeitshinweise — anonym aggregiert, nicht-diagnostisch (lib/safety/care-triggers.ts). */
  teamcheckCareHints?: { topic: string; text: string }[] | null;

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

  // Antwortqualität (#6) — Callout nur, wenn nicht 'gut'.
  dataQuality?: {
    band: 'gut' | 'eingeschraenkt' | 'nicht_interpretierbar';
    confidence: 'hoch' | 'mittel' | 'niedrig';
    note: string;
  } | null;
};

export function ReportDocument(props: ReportProps) {
  registerFonts();

  const {
    traineeName, sport, productName, productTier, date,
    primaryArchetype, secondaryArchetype, profileType, axisScores, texts,
    fremdbildScores, discrepancies, fremdbildResponseCount,
    teamcheckScores, teamcheckResponseCount, teamcheckCareHints,
    maturityScores, context,
    dataQuality,
  } = props;

  const showAllModules = productTier >= 2;
  const isMixedProfile = profileType === 'mixed';
  const has360 = !!(fremdbildScores && discrepancies && discrepancies.length > 0);
  const hasTeamcheck = !!teamcheckScores;
  const hasPremium = productTier >= 2 && (texts.coach_signature_portrait || texts.paradoxien);
  const hasMaturity = !!maturityScores && !!texts.fuehrungsreife_interpretation;

  // Leere Premium-Seiten verhindern (P0 #5): die "Wirkung je Kontext"-Seite
  // nur rendern, wenn mindestens ein Kontexttext echten Inhalt hat.
  const hasContextEffect =
    !!texts.wirkung_je_kontext &&
    Object.values(texts.wirkung_je_kontext).some((v) => typeof v === 'string' && v.trim().length > 0);

  const MATURITY_LABELS_PDF: Record<string, string> = {
    selbstregulation: 'Selbstregulation',
    perspektivflexibilitaet: 'Perspektivflexibilität',
    konfliktreife: 'Konfliktreife',
    druckreife: 'Druckreife',
    verantwortungsklarheit: 'Verantwortungsklarheit',
    integrationsfaehigkeit: 'Integrationsfähigkeit',
  };

  // Entwicklungsindikatoren sind KEIN normiertes Reifemaß → neutrale Tendenz
  // statt wertendem Prozent-Verdikt.
  const pdfTendency = (v: number): string => {
    const n = Number.isFinite(v) ? v : 0.5;
    if (n >= 0.66) return 'deutlich ausgeprägt';
    if (n >= 0.33) return 'mittlerer Bereich';
    return 'wenig ausgeprägt';
  };

  return (
    <Document
      title={`CoachCheck Assessment — ${traineeName}`}
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
              <Text style={{ ...styles.kicker, color: COLORS.gold }}>Premium Coaching-Analyse</Text>
              <Text style={styles.coverTitle}>
                Dein{'\n'}
                <Text style={styles.coverTitleGold}>Führungs-</Text>{'\n'}
                profil.
              </Text>
              <Text style={styles.coverSubtitle}>
                Ein hybrides Premium-Assessment für Führungsarchitektur, Coach-Wirkung und Teamdynamik im Sport.
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
              <Text>Made in Tyrol, Austria</Text>
            </View>
          </View>
        </View>
      </Page>

      {/* EXECUTIVE SUMMARY */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.kicker}>01 — Überblick</Text>
        <Text style={styles.h1}>Die Kernbotschaft{'\n'}auf einen Blick.</Text>
        <View style={styles.dividerGold} />
        <Text style={styles.quote}>{texts.executive_summary}</Text>
        {dataQuality && dataQuality.band !== 'gut' && (
          <View style={{ marginTop: 18, padding: 12, backgroundColor: '#F0EEEA', borderLeftWidth: 3, borderLeftColor: '#B38E45' }}>
            <Text style={styles.mono}>
              Datenqualität: {dataQuality.band === 'nicht_interpretierbar' ? 'nicht interpretierbar' : 'eingeschränkt'} · Konfidenz: {dataQuality.confidence}
            </Text>
            <Text style={styles.bodyMuted}>{dataQuality.note}</Text>
          </View>
        )}
        <View style={{ marginTop: 28 }}>
          <Text style={styles.mono}>{isMixedProfile ? 'Dein Profil · Mischprofil' : 'Primärer Archetyp'}</Text>
          <Text style={styles.h3}>{primaryArchetype.name_de}</Text>
          <Text style={styles.bodyMuted}>{primaryArchetype.short_trait}</Text>

          <View style={{ marginTop: 14 }}>
            <Text style={styles.mono}>{isMixedProfile ? 'Gleich starke Zweittendenz' : 'Sekundärer Archetyp'}</Text>
            <Text style={{ ...styles.h3, fontSize: 13 }}>{secondaryArchetype.name_de}</Text>
            <Text style={styles.bodyMuted}>{secondaryArchetype.short_trait}</Text>
          </View>
          {isMixedProfile && (
            <Text style={{ ...styles.bodyMuted, marginTop: 12 }}>
              Dein Ergebnis ist ein Mischprofil aus {primaryArchetype.name_de} und {secondaryArchetype.name_de}. Beide Muster sind aktuell etwa gleich stark ausgeprägt; die folgenden Stärken und Hinweise gelten für beide Tendenzen.
            </Text>
          )}
        </View>
        <PageFooter pageNum={2} productName={productName} />
      </Page>

      {/* ARCHETYPE HERO */}
      <Page size="A4" style={styles.pagePetrol}>
        <Text style={styles.archetypeLabel}>{isMixedProfile ? 'Dein Mischprofil' : 'Dein Primärer Archetyp'}</Text>
        <Text style={styles.archetypeName}>{primaryArchetype.name_de}</Text>
        <Text style={styles.archetypeTrait}>{primaryArchetype.short_trait}</Text>
        <Text style={styles.archetypeKernmuster}>{primaryArchetype.kernmuster}</Text>

        <View style={styles.secondarySection}>
          <Text style={styles.secondaryLabel}>{isMixedProfile ? 'Gleich starke Zweittendenz' : 'Sekundärer Archetyp'}</Text>
          <Text style={styles.secondaryName}>{secondaryArchetype.name_de}</Text>
          <Text style={styles.secondaryTrait}>{secondaryArchetype.short_trait}</Text>
        </View>

        <View style={{ marginTop: 50 }}>
          <Text style={styles.secondaryLabel}>Interpretation</Text>
          <Text style={{ ...styles.bodyLight, marginTop: 10, fontFamily: PDF_DISPLAY, fontStyle: 'italic', fontSize: 12, lineHeight: 1.55, opacity: 0.92 }}>
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

      {/* Positionierung — grafische Matrizen */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.kicker}>02 — Positionierung</Text>
        <Text style={styles.h1}>Deine Führungsmatrix.</Text>
        <View style={styles.dividerGold} />
        <Text style={styles.body}>
          Zahlen allein sagen wenig. Die beiden Matrizen zeigen, wo du als Trainer stehst — der
          goldene Punkt ist deine Position, kein Urteil. Lies ihn wie eine Landkarte: Wo der Punkt
          liegt, liegt deine natürliche Komfortzone. Wohin du dich bewegen willst, ist deine
          Entwicklungsrichtung. Kein Quadrant ist „besser“ — entscheidend ist die Passung zu deiner
          Mannschaft und zur aktuellen Phase.
        </Text>
        <PositionMatrix
          title="Wie du führst"
          xAxis="struktur_intuition"
          yAxis="leistung_beziehung"
          xValue={axisScores.struktur_intuition}
          yValue={axisScores.leistung_beziehung}
          quadrants={['Intuitiver Antrieb', 'Strukturierte Leistung', 'Geordnete Nähe', 'Spürbare Nähe']}
        />
        <PositionMatrix
          title="Wie du steuerst"
          xAxis="autoritaet_beteiligung"
          yAxis="stabilisierung_aktivierung"
          xValue={axisScores.autoritaet_beteiligung}
          yValue={axisScores.stabilisierung_aktivierung}
          quadrants={['Mitreißend & offen', 'Treibend & führend', 'Ordnend & ruhend', 'Tragend & ruhig']}
        />
        <PageFooter productName={productName} />
      </Page>

      {/* ============ PREMIUM INTELLIGENCE LAYER ============ */}

      {/* COACH SIGNATURE PORTRAIT (essayistic) */}
      {hasPremium && texts.coach_signature_portrait && (
        <Page size="A4" style={styles.pagePetrol}>
          <Text style={{ ...styles.kickerDark, color: COLORS.gold }}>Premium · Signature Portrait</Text>
          <Text style={{ ...styles.h1, color: COLORS.bone }}>
            Coach{'\n'}
            <Text style={{ fontFamily: PDF_DISPLAY, fontStyle: 'italic', color: COLORS.gold }}>Signature.</Text>
          </Text>
          <View style={{ ...styles.dividerGold, backgroundColor: COLORS.gold }} />
          <Text style={{ ...styles.bodyLight, fontFamily: PDF_DISPLAY, fontStyle: 'italic', fontSize: 13, lineHeight: 1.55 }}>
            {texts.coach_signature_portrait}
          </Text>
          {texts.fuehrungsenergie && (
            <View style={{ marginTop: 30, paddingTop: 18, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' }}>
              <Text style={{ fontSize: 8, letterSpacing: 2, color: COLORS.goldLight, textTransform: 'uppercase', marginBottom: 6 }}>
                Führungsenergie
              </Text>
              <Text style={{ fontSize: 14, color: COLORS.bone, fontFamily: PDF_DISPLAY, fontStyle: 'italic' }}>
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
                  <Text style={{ position: 'absolute', left: 0, top: 0, color: COLORS.gold, fontFamily: PDF_SANS, fontSize: 10 }}>
                    {String(i + 1).padStart(2, '0')}
                  </Text>
                  <Text style={{ ...styles.body, fontFamily: PDF_DISPLAY, fontStyle: 'italic', fontSize: 12 }}>
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
      {hasPremium && hasContextEffect && (
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

      {/* ENTWICKLUNGSINDIKATOREN (kein normiertes Reifemaß) */}
      {hasMaturity && maturityScores && (
        <Page size="A4" style={styles.page}>
          <Text style={styles.kicker}>Premium · Entwicklungsindikatoren</Text>
          <Text style={styles.h1}>
            Stil ist das eine.{'\n'}
            <Text style={{ fontFamily: PDF_DISPLAY, fontStyle: 'italic' }}>Entwicklung</Text> ist das andere.
          </Text>
          <View style={styles.dividerGold} />
          <Text style={styles.body}>{texts.fuehrungsreife_interpretation}</Text>

          <View style={{ marginTop: 22 }}>
            {Object.entries(maturityScores).map(([key, val]) => (
              <View key={key} style={{ marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={{ fontFamily: PDF_SANS, fontSize: 10, fontWeight: 600, color: COLORS.ink }}>
                    {MATURITY_LABELS_PDF[key] ?? key}
                  </Text>
                  <Text style={{ fontFamily: PDF_SANS, fontSize: 9, color: COLORS.goldDeep, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {pdfTendency(Number(val))}
                  </Text>
                </View>
                <Svg height={8} width="100%">
                  <Rect x={0} y={3} width="100%" height={2} fill={COLORS.boneLine} rx={1} />
                  <Circle cx={safePct(val)} cy={4} r={4} fill={COLORS.gold} />
                </Svg>
              </View>
            ))}
          </View>

          <Text style={{ fontFamily: PDF_SANS, fontSize: 8, color: COLORS.muted, marginTop: 16, lineHeight: 1.5 }}>
            Hinweis: Diese Indikatoren sind ein Reflexionsraster aus den eigenen Antworten —
            kein normiertes, validiertes Reifemaß und keine endgültige Einstufung der Führung.
          </Text>
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
            <Text style={{ fontFamily: PDF_DISPLAY, fontStyle: 'italic' }}>nicht</Text> tun solltest.
          </Text>
          <View style={styles.dividerGold} />
          <Text style={{ ...styles.body, fontStyle: 'italic', color: COLORS.muted, marginBottom: 18 }}>
            Keine Moral, sondern Praxis. Basierend auf deinem Profil sind dies die typischen Fehler,
            die dein Stil unter Druck produziert — und die du kennen solltest.
          </Text>

          {texts.no_go_warnungen.map((warn, i) => (
            <View key={i} style={{ marginBottom: 12, paddingLeft: 24, position: 'relative' }}>
              <Text style={{ position: 'absolute', left: 0, top: 1, color: COLORS.gold, fontFamily: PDF_SANS, fontSize: 12, fontWeight: 700 }}>
                ×
              </Text>
              <Text style={{ ...styles.body, fontSize: 10.5 }}>{warn}</Text>
            </View>
          ))}

          {texts.beratungswuerdigkeit && (
            <View style={{ marginTop: 28, paddingTop: 14, borderTopWidth: 1, borderTopColor: COLORS.boneLine }}>
              <Text style={{ fontSize: 8, letterSpacing: 2, color: COLORS.muted, textTransform: 'uppercase', marginBottom: 4 }}>
                Beratungswürdigkeit dieses Profils
              </Text>
              <Text style={{ fontFamily: PDF_DISPLAY, fontSize: 18, color: COLORS.goldDeep, textTransform: 'uppercase', letterSpacing: 2 }}>
                {texts.beratungswuerdigkeit}
              </Text>
              <Text style={{ ...styles.bodyMuted, marginTop: 6 }}>
                Gemeint ist, wie viel zusätzliche Begleitung dein Profil sinnvoll machen kann — kein Urteil über dich, sondern ein Hinweis auf den möglichen Hebel einer vertieften Arbeit.
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
            <Text style={{ fontFamily: PDF_DISPLAY, fontStyle: 'italic', color: COLORS.gold }}>dich wirklich</Text>{'\n'}
            erlebt.
          </Text>
          <View style={{ ...styles.dividerGold, backgroundColor: COLORS.gold }} />
          <Text style={{ ...styles.bodyLight, opacity: 0.92, fontFamily: PDF_DISPLAY, fontStyle: 'italic', fontSize: 12 }}>
            {texts.fremdbild_summary}
          </Text>

          <View style={{ marginTop: 28, paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' }}>
            <Text style={{ fontSize: 8, letterSpacing: 2, color: COLORS.goldLight, textTransform: 'uppercase', marginBottom: 6 }}>
              Datenbasis
            </Text>
            <Text style={{ fontSize: 11, color: COLORS.bone }}>
              {fremdbildResponseCount ?? 0} eingegangene Fremdeinschätzungen · anonymisiert und ausschließlich aggregiert ausgewertet
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
                    <Circle cx={safePct(d.selfValue)} cy={7} r={4} fill={COLORS.bone} stroke={COLORS.ink} strokeWidth={1.5} />
                    {/* Fremd marker (filled gold) */}
                    <Circle cx={safePct(d.fremdValue)} cy={7} r={4} fill={COLORS.gold} />
                  </Svg>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 3, fontSize: 7.5, color: COLORS.muted }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <LegendDot filled={false} /><Text>Selbst {selfPct}%</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <LegendDot filled={true} /><Text>Fremd {fremdPct}%</Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>

          <View style={{ ...styles.calloutGold, marginTop: 20 }}>
            <Text style={styles.calloutLabel}>Blinde Flecken</Text>
            <Text style={styles.body}>{texts.blind_spots ?? 'Keine signifikanten blinden Flecken erkennbar.'}</Text>
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
                    {labels.low} / {labels.high}
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
        <Text style={styles.h1}>Wie du führst, wenn{'\''}s{'\n'}wirklich zählt.</Text>
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
            <Text style={{ fontFamily: PDF_DISPLAY, fontStyle: 'italic', color: COLORS.gold }}>Team</Text>{'\n'}
            wirklich erlebt.
          </Text>
          <View style={{ ...styles.dividerGold, backgroundColor: COLORS.gold }} />
          <Text style={{ ...styles.bodyLight, opacity: 0.92, fontFamily: PDF_DISPLAY, fontStyle: 'italic', fontSize: 12 }}>
            {texts.teamcheck_summary}
          </Text>

          <View style={{ marginTop: 28, paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' }}>
            <Text style={{ fontSize: 8, letterSpacing: 2, color: COLORS.goldLight, textTransform: 'uppercase', marginBottom: 6 }}>
              Datenbasis
            </Text>
            <Text style={{ fontSize: 11, color: COLORS.bone }}>
              {teamcheckResponseCount ?? 0} eingegangene Spielerantworten · anonymisiert und ausschließlich aggregiert · Schwelle für Auswertung: 5
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
              ['coach_impact', teamcheckScores.coachImpact, 'Coach-Wirkung', 'Negativ', 'Positiv'],
              ['psy_safety', teamcheckScores.psySafety, 'Psychologische Sicherheit', 'Unsicher', 'Sicher'],
              ['team_klima', teamcheckScores.teamKlima, 'Teamklima', 'Schwach', 'Stark'],
              ['leistungsdr', teamcheckScores.leistungsdruck, 'Leistungsklima', 'Erdrückend', 'Inspirierend'],
              ['klarheit', teamcheckScores.klarheit, 'Rollenklarheit', 'Unklar', 'Klar'],
            ] as const).map(([key, val, title, low, high]) => (
              <View key={key} style={{ marginBottom: 18 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={{ fontFamily: PDF_SANS, fontSize: 10, fontWeight: 600, color: COLORS.ink }}>{title}</Text>
                  <Text style={{ fontFamily: PDF_SANS, fontSize: 10, fontWeight: 600, color: COLORS.goldDeep }}>{Math.round(val * 100)} %</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4, fontSize: 8, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 1.4 }}>
                  <Text>{low}</Text>
                  <Text>{high}</Text>
                </View>
                <Svg height={8} width="100%">
                  <Rect x={0} y={3} width="100%" height={2} fill={COLORS.boneLine} rx={1} />
                  <Circle cx={safePct(val)} cy={4} r={4} fill={COLORS.gold} />
                </Svg>
              </View>
            ))}
          </View>

          <View style={{ ...styles.calloutGold, marginTop: 14 }}>
            <Text style={styles.calloutLabel}>Team-Dynamiken</Text>
            <Text style={styles.body}>{texts.team_dynamics}</Text>
          </View>

          {teamcheckCareHints && teamcheckCareHints.length > 0 && (
            <View style={{ marginTop: 14, padding: 12, borderWidth: 1, borderColor: COLORS.boneLine, borderRadius: 4 }}>
              <Text style={{ fontSize: 7.5, letterSpacing: 1.6, color: COLORS.muted, textTransform: 'uppercase', marginBottom: 6 }}>
                Achtsamkeitshinweise · anonym aggregiert · kein Befund über einzelne Personen
              </Text>
              {teamcheckCareHints.map((h, i) => (
                <Text key={i} style={{ ...styles.body, fontSize: 9.5, marginBottom: i === teamcheckCareHints.length - 1 ? 0 : 5 }}>
                  <Text style={{ fontWeight: 600 }}>{h.topic}: </Text>
                  {h.text}
                </Text>
              ))}
            </View>
          )}
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
                  <Text style={{ ...styles.moduleCode, fontFamily: PDF_DISPLAY, fontSize: 20, color: COLORS.gold, letterSpacing: 0 }}>
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
      {showAllModules && texts.modul_interpretationen && Object.keys(texts.modul_interpretationen).length > 0 && (
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

      {showAllModules && texts.modul_interpretationen && Object.keys(texts.modul_interpretationen).length > 4 && (
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
          <Bullet key={i}>{s}</Bullet>
        ))}

        <Text style={styles.h3}>Typische Risiken</Text>
        {primaryArchetype.risiken.map((r, i) => (
          <Bullet key={i}>{r}</Bullet>
        ))}

        <Text style={styles.h3}>Entwicklungshebel</Text>
        {primaryArchetype.entwicklungshebel.map((h, i) => (
          <Bullet key={i}>{h}</Bullet>
        ))}

        <View style={styles.calloutGold}>
          <Text style={styles.calloutLabel}>Entwicklungspfad</Text>
          <Text style={styles.body}>{texts.entwicklungspfad}</Text>
        </View>
        <PageFooter pageNum={8} productName={productName} />
      </Page>

      {/* DISCUSSION GUIDE */}
      {productTier >= 2 && texts.gespraechsleitfaden && texts.gespraechsleitfaden.length > 0 && (
        <Page size="A4" style={styles.page}>
          <Text style={styles.kicker}>06 — Gesprächsleitfaden</Text>
          <Text style={styles.h1}>Fragen, die zu deinem{'\n'}Profil passen.</Text>
          <View style={styles.dividerGold} />
          <Text style={styles.bodyMuted}>
            {texts.gespraechsleitfaden.length} offene {texts.gespraechsleitfaden.length === 1 ? 'Frage' : 'Fragen'} zur Selbstreflexion oder für Einzelgespräche mit Spielern.
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

      {/* WIRKUNG JE SPIELERTYP */}
      {productTier >= 2 && texts.wirkung_je_spielertyp && texts.wirkung_je_spielertyp.length > 0 && (
        <Page size="A4" style={styles.page}>
          <Text style={styles.kicker}>06b — Wirkung je Spielertyp</Text>
          <Text style={styles.h1}>Derselbe Stil,{'\n'}vier Wirkungen.</Text>
          <View style={styles.dividerGold} />
          <Text style={styles.bodyMuted}>
            Dein Stil kommt nicht bei allen gleich an. So wirkt er auf vier typische Spielertypen — und was du je Typ konkret anpassen kannst.
          </Text>
          <View style={{ marginTop: 18, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
            {texts.wirkung_je_spielertyp.map((p, i) => (
              <View key={i} style={{ ...styles.moduleCard, width: '48%' }} wrap={false}>
                <Text style={{ fontSize: 10.5, fontFamily: PDF_DISPLAY, color: COLORS.ink, marginBottom: 5 }}>
                  {p.spielertyp}
                </Text>
                <Text style={{ ...styles.body, marginBottom: 6 }}>{p.wirkung}</Text>
                <Text style={{ fontSize: 8, color: COLORS.gold, letterSpacing: 2, marginBottom: 2 }}>ANPASSUNG</Text>
                <Text style={styles.quote}>{p.anpassung}</Text>
              </View>
            ))}
          </View>
          <PageFooter pageNum={9} productName={productName} />
        </Page>
      )}

      {/* BEDIENUNGSANLEITUNG */}
      {productTier >= 2 && texts.bedienungsanleitung && texts.bedienungsanleitung.kernsatz && (
        <Page size="A4" style={styles.page}>
          <Text style={styles.kicker}>06c — Deine Bedienungsanleitung</Text>
          <Text style={styles.h1}>So arbeitet man{'\n'}am besten mit dir.</Text>
          <View style={styles.dividerGold} />
          <Text style={styles.bodyMuted}>
            Eine kompakte Anleitung zum Weitergeben — an Spieler, Co-Trainer oder dein Umfeld. Sie macht aus deinem Profil ein gemeinsames Verständnis.
          </Text>
          <View style={{ marginTop: 18 }}>
            <Text style={{ fontSize: 18, fontFamily: PDF_DISPLAY, color: COLORS.ink, marginBottom: 4 }}>
              {texts.bedienungsanleitung.ueberschrift}
            </Text>
            <Text style={{ ...styles.quote, marginBottom: 16 }}>{texts.bedienungsanleitung.kernsatz}</Text>

            {texts.bedienungsanleitung.staerken && texts.bedienungsanleitung.staerken.length > 0 && (
              <View style={{ marginBottom: 14 }}>
                <Text style={{ fontSize: 8, color: COLORS.gold, letterSpacing: 2, marginBottom: 4 }}>KERNSTÄRKEN</Text>
                <Text style={styles.body}>{texts.bedienungsanleitung.staerken.join('  ·  ')}</Text>
              </View>
            )}

            <View style={styles.moduleCard} wrap={false}>
              <Text style={{ fontSize: 8, color: COLORS.gold, letterSpacing: 2, marginBottom: 3 }}>SO ERREICHST DU MICH</Text>
              <Text style={styles.body}>{texts.bedienungsanleitung.soErreichstDuMich}</Text>
            </View>
            <View style={styles.moduleCard} wrap={false}>
              <Text style={{ fontSize: 8, color: COLORS.gold, letterSpacing: 2, marginBottom: 3 }}>SO GIBST DU MIR FEEDBACK</Text>
              <Text style={styles.body}>{texts.bedienungsanleitung.soGibstDuFeedback}</Text>
            </View>
            <View style={styles.moduleCard} wrap={false}>
              <Text style={{ fontSize: 8, color: COLORS.gold, letterSpacing: 2, marginBottom: 3 }}>UNTER DRUCK</Text>
              <Text style={styles.body}>{texts.bedienungsanleitung.unterDruck}</Text>
            </View>
            <View style={styles.moduleCard} wrap={false}>
              <Text style={{ fontSize: 8, color: COLORS.gold, letterSpacing: 2, marginBottom: 3 }}>BITTE VERMEIDEN</Text>
              <Text style={styles.body}>{texts.bedienungsanleitung.vermeide}</Text>
            </View>
          </View>
          <PageFooter pageNum={9} productName={productName} />
        </Page>
      )}

      {/* 30 DAYS */}
      {productTier >= 2 && texts.naechste_30_tage && texts.naechste_30_tage.length > 0 && (
        <Page size="A4" style={styles.page}>
          <Text style={styles.kicker}>07 — Die Nächsten 30 Tage</Text>
          <Text style={styles.h1}>Konkrete Schritte,{'\n'}kein Warten.</Text>
          <View style={styles.dividerGold} />
          <View style={{ marginTop: 16 }}>
            {texts.naechste_30_tage.map((step, i) => (
              <View key={i} style={styles.moduleCard}>
                <View style={styles.moduleHeader}>
                  <Text style={{ ...styles.moduleCode, fontFamily: PDF_DISPLAY, fontSize: 20, color: COLORS.gold, letterSpacing: 0 }}>
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

      {/* ENTWICKLUNGSPROGRAMM (evidenzbasiert) */}
      {productTier >= 2 && texts.entwicklungsprogramm && (
        <Page size="A4" style={styles.page}>
          <Text style={styles.kicker}>08 — Entwicklungsprogramm</Text>
          <Text style={styles.h1}>Was du konkret{'\n'}entwickeln kannst.</Text>
          <View style={styles.dividerGold} />
          {texts.entwicklungsprogramm.kernfokus ? (
            <Text style={styles.body}>{texts.entwicklungsprogramm.kernfokus}</Text>
          ) : null}

          {texts.entwicklungsprogramm.vierzehn_tage && texts.entwicklungsprogramm.vierzehn_tage.length > 0 && (
            <View>
              <Text style={styles.h2}>14 Tage — Sofort</Text>
              {texts.entwicklungsprogramm.vierzehn_tage.map((s, i) => (
                <Bullet key={`v${i}`}>{s}</Bullet>
              ))}
            </View>
          )}

          {texts.entwicklungsprogramm.dreissig_tage && texts.entwicklungsprogramm.dreissig_tage.length > 0 && (
            <View>
              <Text style={styles.h2}>30 Tage — Routinen</Text>
              {texts.entwicklungsprogramm.dreissig_tage.map((s, i) => (
                <Bullet key={`d${i}`}>{s}</Bullet>
              ))}
            </View>
          )}

          {texts.entwicklungsprogramm.neunzig_tage && texts.entwicklungsprogramm.neunzig_tage.length > 0 && (
            <View>
              <Text style={styles.h2}>90 Tage — Struktur</Text>
              {texts.entwicklungsprogramm.neunzig_tage.map((s, i) => (
                <Bullet key={`n${i}`}>{s}</Bullet>
              ))}
            </View>
          )}

          {texts.entwicklungsprogramm.wissenschaftlicher_hinweis ? (
            <View style={styles.calloutGold}>
              <Text style={styles.calloutLabel}>EINORDNUNG</Text>
              <Text style={styles.bodyMuted}>{texts.entwicklungsprogramm.wissenschaftlicher_hinweis}</Text>
            </View>
          ) : null}

          <PageFooter pageNum={11} productName={productName} />
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
          <View style={{ flexDirection: 'column', gap: 4 }}>
            <Text style={{ fontSize: 7.5, color: COLORS.muted, letterSpacing: 1.5, textTransform: 'uppercase' }}>
              © Humatrix · The Mind Club Company
            </Text>
            <Text style={{ fontSize: 7.5, color: COLORS.muted, letterSpacing: 1.5, textTransform: 'uppercase' }}>
              Made in Tyrol, Austria · coachcheck.humatrix.cc
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
