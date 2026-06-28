// lib/pdf/report-document.tsx
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
  Circle
} from "@react-pdf/renderer";
import { existsSync } from "node:fs";
import { join as pathJoin, dirname as pathDirname } from "node:path";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
var fontsRegistered = false;
var fontsAvailable = false;
function registerFonts() {
  if (fontsRegistered) return fontsAvailable;
  fontsRegistered = true;
  try {
    const findNodeModules = () => {
      let dir = process.cwd();
      for (let i = 0; i < 6; i++) {
        const candidate = pathJoin(dir, "node_modules");
        if (existsSync(candidate)) return candidate;
        dir = pathDirname(dir);
      }
      return pathJoin(process.cwd(), "node_modules");
    };
    const nm = findNodeModules();
    const fraunces = pathJoin(nm, "@expo-google-fonts", "fraunces");
    const manrope = pathJoin(nm, "@expo-google-fonts", "manrope");
    const safePath = (p) => existsSync(p) ? p : null;
    const f300 = safePath(pathJoin(fraunces, "300Light/Fraunces_300Light.ttf"));
    const f400 = safePath(pathJoin(fraunces, "400Regular/Fraunces_400Regular.ttf"));
    const f500 = safePath(pathJoin(fraunces, "500Medium/Fraunces_500Medium.ttf"));
    const f300i = safePath(pathJoin(fraunces, "300Light_Italic/Fraunces_300Light_Italic.ttf"));
    const f400i = safePath(pathJoin(fraunces, "400Regular_Italic/Fraunces_400Regular_Italic.ttf"));
    const f500i = safePath(pathJoin(fraunces, "500Medium_Italic/Fraunces_500Medium_Italic.ttf"));
    const m400 = safePath(pathJoin(manrope, "400Regular/Manrope_400Regular.ttf"));
    const m500 = safePath(pathJoin(manrope, "500Medium/Manrope_500Medium.ttf"));
    const m600 = safePath(pathJoin(manrope, "600SemiBold/Manrope_600SemiBold.ttf"));
    const m700 = safePath(pathJoin(manrope, "700Bold/Manrope_700Bold.ttf"));
    if (f400 && f400i && m400) {
      Font.register({
        family: "Fraunces",
        fonts: [
          ...f300 ? [{ src: f300, fontWeight: 300, fontStyle: "normal" }] : [],
          { src: f400, fontWeight: 400, fontStyle: "normal" },
          ...f500 ? [{ src: f500, fontWeight: 500, fontStyle: "normal" }] : [],
          ...f300i ? [{ src: f300i, fontWeight: 300, fontStyle: "italic" }] : [],
          { src: f400i, fontWeight: 400, fontStyle: "italic" },
          ...f500i ? [{ src: f500i, fontWeight: 500, fontStyle: "italic" }] : []
        ]
      });
      Font.register({
        family: "Manrope",
        fonts: [
          { src: m400, fontWeight: 400, fontStyle: "normal" },
          ...m500 ? [{ src: m500, fontWeight: 500, fontStyle: "normal" }] : [],
          ...m600 ? [{ src: m600, fontWeight: 600, fontStyle: "normal" }] : [],
          ...m700 ? [{ src: m700, fontWeight: 700, fontStyle: "normal" }] : [],
          // Manrope has no true italic in this package — reuse regular glyphs
          { src: m400, fontWeight: 400, fontStyle: "italic" },
          ...m500 ? [{ src: m500, fontWeight: 500, fontStyle: "italic" }] : []
        ]
      });
      fontsAvailable = true;
    } else {
      console.warn("[PDF] Custom fonts not found, using built-in fallbacks");
    }
  } catch (err) {
    console.warn("[PDF] Font registration failed:", err instanceof Error ? err.message : err);
    fontsAvailable = false;
  }
  return fontsAvailable;
}
var FONTS_OK = registerFonts();
var PDF_SANS = FONTS_OK ? "Manrope" : "Helvetica";
var PDF_DISPLAY = FONTS_OK ? "Fraunces" : "Helvetica";
var COLORS = {
  ink: "#1B1C1E",
  inkSoft: "#26272A",
  bone: "#FAFAF8",
  boneSoft: "#F0EEEA",
  boneLine: "#DBD8D1",
  petrol: "#143F3A",
  gold: "#B38E45",
  goldLight: "#CDB072",
  goldDeep: "#8A6A2E",
  muted: "#767471",
  mutedDark: "#9A9793"
};
var styles = StyleSheet.create({
  page: {
    fontFamily: PDF_SANS,
    fontSize: 10,
    color: COLORS.ink,
    paddingTop: 60,
    paddingBottom: 60,
    paddingHorizontal: 50,
    backgroundColor: COLORS.bone,
    lineHeight: 1.5
  },
  pageDark: {
    fontFamily: PDF_SANS,
    fontSize: 10,
    color: COLORS.bone,
    padding: 0,
    backgroundColor: COLORS.ink
  },
  pagePetrol: {
    fontFamily: PDF_SANS,
    fontSize: 10,
    color: COLORS.bone,
    paddingTop: 60,
    paddingBottom: 60,
    paddingHorizontal: 50,
    backgroundColor: COLORS.petrol
  },
  // Typography
  kicker: {
    fontFamily: PDF_SANS,
    fontSize: 8,
    color: COLORS.muted,
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 14
  },
  kickerDark: {
    fontFamily: PDF_SANS,
    fontSize: 8,
    color: COLORS.gold,
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 14
  },
  h1: {
    fontFamily: PDF_DISPLAY,
    fontSize: 36,
    fontWeight: 400,
    letterSpacing: -0.8,
    lineHeight: 1.05,
    marginBottom: 14
  },
  h2: {
    fontFamily: PDF_DISPLAY,
    fontSize: 22,
    fontWeight: 400,
    letterSpacing: -0.4,
    marginBottom: 10,
    marginTop: 20
  },
  h3: {
    fontFamily: PDF_DISPLAY,
    fontSize: 16,
    fontWeight: 500,
    letterSpacing: -0.3,
    marginBottom: 8,
    marginTop: 14
  },
  body: {
    fontSize: 10.5,
    lineHeight: 1.55,
    marginBottom: 9,
    color: COLORS.ink
  },
  bodyLight: {
    fontSize: 10.5,
    lineHeight: 1.55,
    marginBottom: 9,
    color: COLORS.bone
  },
  bodyMuted: {
    fontSize: 9.5,
    lineHeight: 1.5,
    color: COLORS.muted
  },
  quote: {
    fontFamily: PDF_DISPLAY,
    fontSize: 13,
    fontStyle: "italic",
    lineHeight: 1.5,
    color: COLORS.ink,
    marginBottom: 9
  },
  quoteLight: {
    fontFamily: PDF_DISPLAY,
    fontSize: 13,
    fontStyle: "italic",
    lineHeight: 1.5,
    color: COLORS.bone,
    marginBottom: 9
  },
  mono: {
    fontSize: 8,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: COLORS.muted
  },
  // Layouts
  divider: {
    height: 1,
    backgroundColor: COLORS.boneLine,
    marginVertical: 14
  },
  dividerDark: {
    height: 1,
    backgroundColor: COLORS.inkSoft,
    marginVertical: 14
  },
  dividerGold: {
    height: 2,
    backgroundColor: COLORS.gold,
    marginVertical: 14,
    width: 48
  },
  // 2x2 Positionsmatrix
  matrixBlock: { marginTop: 18, marginBottom: 6, alignItems: "center" },
  matrixTitle: {
    fontFamily: PDF_SANS,
    fontSize: 8,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: COLORS.goldDeep,
    marginBottom: 6,
    textAlign: "center"
  },
  matrixPole: {
    fontFamily: PDF_SANS,
    fontSize: 7.5,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: COLORS.muted,
    textAlign: "center",
    marginVertical: 3
  },
  matrixPoleSide: {
    fontFamily: PDF_SANS,
    fontSize: 7.5,
    letterSpacing: 0.4,
    textTransform: "uppercase",
    color: COLORS.muted,
    width: 84
  },
  matrixQuad: {
    position: "absolute",
    fontFamily: PDF_SANS,
    fontSize: 6.5,
    color: COLORS.mutedDark,
    maxWidth: 70
  },
  matrixCaption: {
    fontFamily: PDF_SANS,
    fontSize: 8,
    color: COLORS.muted,
    textAlign: "center",
    marginTop: 6
  },
  // Cover
  coverContainer: {
    flex: 1,
    padding: 60,
    justifyContent: "space-between",
    backgroundColor: COLORS.ink
  },
  coverHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.inkSoft
  },
  coverLogo: {
    fontFamily: PDF_SANS,
    fontSize: 11,
    letterSpacing: 4.5,
    color: COLORS.bone,
    fontWeight: 400,
    textTransform: "uppercase"
  },
  coverTitle: {
    fontFamily: PDF_DISPLAY,
    fontSize: 52,
    color: COLORS.bone,
    letterSpacing: -1.2,
    lineHeight: 1,
    fontWeight: 400
  },
  coverTitleGold: {
    color: COLORS.gold,
    fontStyle: "italic"
  },
  coverSubtitle: {
    fontFamily: PDF_DISPLAY,
    fontSize: 20,
    color: COLORS.mutedDark,
    fontStyle: "italic",
    lineHeight: 1.3,
    marginTop: 16,
    maxWidth: "80%"
  },
  coverMeta: {
    marginTop: 40
  },
  coverMetaLabel: {
    fontSize: 8,
    color: COLORS.muted,
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 5
  },
  coverMetaValue: {
    fontFamily: PDF_DISPLAY,
    fontSize: 14,
    color: COLORS.bone,
    marginBottom: 16
  },
  coverFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    fontSize: 8,
    color: COLORS.muted,
    letterSpacing: 1.5,
    textTransform: "uppercase"
  },
  // Archetype Hero
  archetypeHero: {
    flex: 1,
    padding: 60,
    backgroundColor: COLORS.petrol,
    justifyContent: "center"
  },
  archetypeLabel: {
    fontSize: 8,
    letterSpacing: 3,
    color: COLORS.goldLight,
    textTransform: "uppercase",
    marginBottom: 16
  },
  archetypeName: {
    fontFamily: PDF_DISPLAY,
    fontSize: 42,
    color: COLORS.bone,
    letterSpacing: -0.8,
    lineHeight: 1.05,
    fontWeight: 400,
    marginBottom: 12
  },
  archetypeTrait: {
    fontSize: 10,
    letterSpacing: 2,
    color: COLORS.bone,
    textTransform: "uppercase",
    opacity: 0.7,
    marginBottom: 24
  },
  archetypeKernmuster: {
    fontFamily: PDF_DISPLAY,
    fontSize: 15,
    color: COLORS.bone,
    fontStyle: "italic",
    lineHeight: 1.45,
    maxWidth: "85%",
    opacity: 0.92
  },
  secondarySection: {
    marginTop: 32,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.inkSoft
  },
  secondaryLabel: {
    fontSize: 8,
    letterSpacing: 2.5,
    color: COLORS.goldLight,
    textTransform: "uppercase",
    marginBottom: 6
  },
  secondaryName: {
    fontFamily: PDF_DISPLAY,
    fontSize: 18,
    color: COLORS.bone,
    letterSpacing: -0.3,
    marginBottom: 4
  },
  secondaryTrait: {
    fontSize: 9,
    letterSpacing: 1.8,
    color: COLORS.bone,
    textTransform: "uppercase",
    opacity: 0.6
  },
  // Axis
  axisRow: {
    marginBottom: 14
  },
  axisLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
    fontSize: 8,
    textTransform: "uppercase",
    letterSpacing: 1.4
  },
  axisLabelLeft: { color: COLORS.muted },
  axisLabelRight: { color: COLORS.muted, textAlign: "right" },
  axisValue: { color: COLORS.goldDeep, fontWeight: 600 },
  // List
  bullet: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 5
  },
  bulletMark: {
    width: 12,
    paddingTop: 4
  },
  bulletText: {
    flex: 1,
    fontSize: 10,
    lineHeight: 1.5,
    color: COLORS.ink
  },
  // Callouts
  calloutGold: {
    backgroundColor: COLORS.boneSoft,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.gold,
    padding: 14,
    marginVertical: 10
  },
  calloutLabel: {
    fontSize: 8,
    letterSpacing: 2,
    color: COLORS.goldDeep,
    textTransform: "uppercase",
    marginBottom: 5
  },
  // Module card
  moduleCard: {
    marginBottom: 18,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.boneLine
  },
  moduleHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 8
  },
  moduleCode: {
    fontSize: 8,
    letterSpacing: 2,
    color: COLORS.gold,
    textTransform: "uppercase",
    marginRight: 12
  },
  moduleTitle: {
    fontFamily: PDF_DISPLAY,
    fontSize: 15,
    fontWeight: 500,
    color: COLORS.ink
  },
  // Footer
  pageFooter: {
    position: "absolute",
    bottom: 30,
    left: 50,
    right: 50,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 7,
    color: COLORS.muted,
    letterSpacing: 1.5,
    textTransform: "uppercase"
  },
  // Chip
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 6,
    gap: 5
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
    textTransform: "uppercase",
    letterSpacing: 1.2
  }
});
var AXIS_LABELS = {
  struktur_intuition: { low: "Intuitiv", high: "Strukturiert" },
  autoritaet_beteiligung: { low: "Beteiligend", high: "Autorit\xE4r" },
  leistung_beziehung: { low: "Beziehungsorientiert", high: "Leistungsorientiert" },
  stabilisierung_aktivierung: { low: "Stabilisierend", high: "Aktivierend" },
  reflexion_direktheit: { low: "Direkt", high: "Reflektiert" },
  standardisierung_anpassung: { low: "Anpassend", high: "Standardisierend" }
};
var AXIS_ORDER = [
  "struktur_intuition",
  "autoritaet_beteiligung",
  "leistung_beziehung",
  "stabilisierung_aktivierung",
  "reflexion_direktheit",
  "standardisierung_anpassung"
];
var MODULE_TITLES = {
  A: "F\xFChrungsidentit\xE4t",
  B: "Kommunikationsarchitektur",
  C: "Entscheidung & Priorit\xE4t",
  D: "Fehler- & Lernkultur",
  E: "F\xFChrung unter Druck",
  F: "Motivation & Aktivierung",
  G: "Beziehung & Vertrauen"
};
function AxisBar({ axis, value }) {
  const labels = AXIS_LABELS[axis];
  const safe = Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0.5;
  const pct = Math.round(safe * 100);
  return /* @__PURE__ */ jsxs(View, { style: styles.axisRow, children: [
    /* @__PURE__ */ jsxs(View, { style: styles.axisLabels, children: [
      /* @__PURE__ */ jsx(Text, { style: styles.axisLabelLeft, children: labels.low }),
      /* @__PURE__ */ jsxs(Text, { style: styles.axisValue, children: [
        pct,
        " %"
      ] }),
      /* @__PURE__ */ jsx(Text, { style: styles.axisLabelRight, children: labels.high })
    ] }),
    /* @__PURE__ */ jsxs(Svg, { height: 8, width: "100%", children: [
      /* @__PURE__ */ jsx(Rect, { x: 0, y: 3, width: "100%", height: 2, fill: COLORS.boneLine, rx: 1 }),
      /* @__PURE__ */ jsx(Circle, { cx: `${pct}%`, cy: 4, r: 3.5, fill: COLORS.gold })
    ] })
  ] });
}
function PositionMatrix({
  title,
  xAxis,
  yAxis,
  xValue,
  yValue,
  quadrants
}) {
  const SIZE = 158;
  const clamp = (v) => Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : 0.5;
  const xv = clamp(xValue);
  const yv = clamp(yValue);
  const dotX = xv * SIZE;
  const dotY = (1 - yv) * SIZE;
  const xL = AXIS_LABELS[xAxis];
  const yL = AXIS_LABELS[yAxis];
  return /* @__PURE__ */ jsxs(View, { style: styles.matrixBlock, children: [
    /* @__PURE__ */ jsx(Text, { style: styles.matrixTitle, children: title }),
    /* @__PURE__ */ jsx(Text, { style: styles.matrixPole, children: yL.high }),
    /* @__PURE__ */ jsxs(View, { style: { flexDirection: "row", alignItems: "center" }, children: [
      /* @__PURE__ */ jsx(Text, { style: [styles.matrixPoleSide, { textAlign: "right" }], children: xL.low }),
      /* @__PURE__ */ jsxs(View, { style: { position: "relative", width: SIZE, height: SIZE, marginHorizontal: 6 }, children: [
        /* @__PURE__ */ jsxs(Svg, { width: SIZE, height: SIZE, style: { position: "absolute", top: 0, left: 0 }, children: [
          /* @__PURE__ */ jsx(Rect, { x: 0.5, y: 0.5, width: SIZE - 1, height: SIZE - 1, fill: COLORS.boneSoft, stroke: COLORS.boneLine, strokeWidth: 1, rx: 3 }),
          /* @__PURE__ */ jsx(Line, { x1: SIZE / 2, y1: 6, x2: SIZE / 2, y2: SIZE - 6, stroke: COLORS.boneLine, strokeWidth: 0.75 }),
          /* @__PURE__ */ jsx(Line, { x1: 6, y1: SIZE / 2, x2: SIZE - 6, y2: SIZE / 2, stroke: COLORS.boneLine, strokeWidth: 0.75 }),
          /* @__PURE__ */ jsx(Circle, { cx: dotX, cy: dotY, r: 10, fill: COLORS.gold, opacity: 0.16 }),
          /* @__PURE__ */ jsx(Circle, { cx: dotX, cy: dotY, r: 4.5, fill: COLORS.gold, stroke: COLORS.bone, strokeWidth: 1.2 })
        ] }),
        /* @__PURE__ */ jsx(Text, { style: [styles.matrixQuad, { top: 5, left: 5, textAlign: "left" }], children: quadrants[0] }),
        /* @__PURE__ */ jsx(Text, { style: [styles.matrixQuad, { top: 5, right: 5, textAlign: "right" }], children: quadrants[1] }),
        /* @__PURE__ */ jsx(Text, { style: [styles.matrixQuad, { bottom: 5, right: 5, textAlign: "right" }], children: quadrants[2] }),
        /* @__PURE__ */ jsx(Text, { style: [styles.matrixQuad, { bottom: 5, left: 5, textAlign: "left" }], children: quadrants[3] })
      ] }),
      /* @__PURE__ */ jsx(Text, { style: styles.matrixPoleSide, children: xL.high })
    ] }),
    /* @__PURE__ */ jsx(Text, { style: styles.matrixPole, children: yL.low }),
    /* @__PURE__ */ jsxs(Text, { style: styles.matrixCaption, children: [
      "Deine Position: ",
      Math.round(xv * 100),
      "% ",
      xL.high,
      " \xB7 ",
      Math.round(yv * 100),
      "% ",
      yL.high
    ] })
  ] });
}
function safePct(value) {
  const v = typeof value === "number" && Number.isFinite(value) ? value : 0.5;
  const clamped = Math.max(0, Math.min(1, v));
  return `${Math.round(clamped * 100)}%`;
}
function PageFooter({ productName }) {
  return /* @__PURE__ */ jsxs(View, { style: styles.pageFooter, fixed: true, children: [
    /* @__PURE__ */ jsxs(Text, { children: [
      "Humatrix \xB7 ",
      productName
    ] }),
    /* @__PURE__ */ jsx(Text, { render: ({ pageNumber, totalPages }) => `Seite ${pageNumber} / ${totalPages}` })
  ] });
}
function Bullet({ children, dark = false }) {
  return /* @__PURE__ */ jsxs(View, { style: styles.bullet, children: [
    /* @__PURE__ */ jsx(View, { style: styles.bulletMark, children: /* @__PURE__ */ jsx(Svg, { width: 5, height: 5, children: /* @__PURE__ */ jsx(Rect, { x: 0, y: 0, width: 5, height: 5, fill: COLORS.gold, rx: 1 }) }) }),
    /* @__PURE__ */ jsx(Text, { style: [styles.bulletText, dark ? { color: COLORS.bone } : {}], children })
  ] });
}
function LegendDot({ filled }) {
  return /* @__PURE__ */ jsx(Svg, { width: 7, height: 7, style: { marginRight: 3 }, children: /* @__PURE__ */ jsx(
    Circle,
    {
      cx: 3.5,
      cy: 3.5,
      r: 2.8,
      fill: filled ? COLORS.gold : COLORS.bone,
      stroke: COLORS.ink,
      strokeWidth: filled ? 0 : 1
    }
  ) });
}
function ReportDocument(props) {
  registerFonts();
  const {
    traineeName,
    sport,
    productName,
    productTier,
    date,
    primaryArchetype,
    secondaryArchetype,
    profileType,
    axisScores,
    texts,
    fremdbildScores,
    discrepancies,
    fremdbildResponseCount,
    teamcheckScores,
    teamcheckResponseCount,
    teamcheckCareHints,
    maturityScores,
    context,
    dataQuality
  } = props;
  const showAllModules = productTier >= 2;
  const isMixedProfile = profileType === "mixed";
  const has360 = !!(fremdbildScores && discrepancies && discrepancies.length > 0);
  const hasTeamcheck = !!teamcheckScores;
  const hasPremium = productTier >= 2 && (texts.coach_signature_portrait || texts.paradoxien);
  const hasMaturity = !!maturityScores && !!texts.fuehrungsreife_interpretation;
  const hasContextEffect = !!texts.wirkung_je_kontext && Object.values(texts.wirkung_je_kontext).some((v) => typeof v === "string" && v.trim().length > 0);
  const MATURITY_LABELS_PDF = {
    selbstregulation: "Selbstregulation",
    perspektivflexibilitaet: "Perspektivflexibilit\xE4t",
    konfliktreife: "Konfliktreife",
    druckreife: "Druckreife",
    verantwortungsklarheit: "Verantwortungsklarheit",
    integrationsfaehigkeit: "Integrationsf\xE4higkeit"
  };
  const pdfTendency = (v) => {
    const n = Number.isFinite(v) ? v : 0.5;
    if (n >= 0.66) return "deutlich ausgepr\xE4gt";
    if (n >= 0.33) return "mittlerer Bereich";
    return "wenig ausgepr\xE4gt";
  };
  return /* @__PURE__ */ jsxs(
    Document,
    {
      title: `CoachCheck Assessment \u2014 ${traineeName}`,
      author: "Humatrix \u2014 The Mind Club Company",
      children: [
        /* @__PURE__ */ jsx(Page, { size: "A4", style: styles.pageDark, children: /* @__PURE__ */ jsxs(View, { style: styles.coverContainer, children: [
          /* @__PURE__ */ jsxs(View, { children: [
            /* @__PURE__ */ jsxs(View, { style: styles.coverHeader, children: [
              /* @__PURE__ */ jsx(Text, { style: styles.coverLogo, children: "HUMATRIX" }),
              /* @__PURE__ */ jsx(Text, { style: { fontSize: 8, color: COLORS.muted, letterSpacing: 2, textTransform: "uppercase" }, children: "Coach Assessment" })
            ] }),
            /* @__PURE__ */ jsxs(View, { style: { marginTop: 80 }, children: [
              /* @__PURE__ */ jsx(Text, { style: { ...styles.kicker, color: COLORS.gold }, children: "Premium Coaching-Analyse" }),
              /* @__PURE__ */ jsxs(Text, { style: styles.coverTitle, children: [
                "Dein",
                "\n",
                /* @__PURE__ */ jsx(Text, { style: styles.coverTitleGold, children: "F\xFChrungs-" }),
                "\n",
                "profil."
              ] }),
              /* @__PURE__ */ jsx(Text, { style: styles.coverSubtitle, children: "Ein hybrides Premium-Assessment f\xFCr F\xFChrungsarchitektur, Coach-Wirkung und Teamdynamik im Sport." })
            ] })
          ] }),
          /* @__PURE__ */ jsxs(View, { children: [
            /* @__PURE__ */ jsxs(View, { style: styles.coverMeta, children: [
              /* @__PURE__ */ jsx(Text, { style: styles.coverMetaLabel, children: "F\xFCr" }),
              /* @__PURE__ */ jsx(Text, { style: styles.coverMetaValue, children: traineeName || "Trainer:in" }),
              sport && /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx(Text, { style: styles.coverMetaLabel, children: "Sport" }),
                /* @__PURE__ */ jsx(Text, { style: styles.coverMetaValue, children: sport })
              ] }),
              /* @__PURE__ */ jsx(Text, { style: styles.coverMetaLabel, children: "Paket" }),
              /* @__PURE__ */ jsx(Text, { style: styles.coverMetaValue, children: productName }),
              /* @__PURE__ */ jsx(Text, { style: styles.coverMetaLabel, children: "Erstellt" }),
              /* @__PURE__ */ jsx(Text, { style: styles.coverMetaValue, children: date })
            ] }),
            /* @__PURE__ */ jsxs(View, { style: [styles.coverFooter, { marginTop: 60 }], children: [
              /* @__PURE__ */ jsx(Text, { children: "\xA9 Humatrix \xB7 The Mind Club Company" }),
              /* @__PURE__ */ jsx(Text, { children: "Made in Tyrol, Austria" })
            ] })
          ] })
        ] }) }),
        /* @__PURE__ */ jsxs(Page, { size: "A4", style: styles.page, children: [
          /* @__PURE__ */ jsx(Text, { style: styles.kicker, children: "01 \u2014 \xDCberblick" }),
          /* @__PURE__ */ jsxs(Text, { style: styles.h1, children: [
            "Die Kernbotschaft",
            "\n",
            "auf einen Blick."
          ] }),
          /* @__PURE__ */ jsx(View, { style: styles.dividerGold }),
          /* @__PURE__ */ jsx(Text, { style: styles.quote, children: texts.executive_summary }),
          dataQuality && dataQuality.band !== "gut" && /* @__PURE__ */ jsxs(View, { style: { marginTop: 18, padding: 12, backgroundColor: "#F0EEEA", borderLeftWidth: 3, borderLeftColor: "#B38E45" }, children: [
            /* @__PURE__ */ jsxs(Text, { style: styles.mono, children: [
              "Datenqualit\xE4t: ",
              dataQuality.band === "nicht_interpretierbar" ? "nicht interpretierbar" : "eingeschr\xE4nkt",
              " \xB7 Konfidenz: ",
              dataQuality.confidence
            ] }),
            /* @__PURE__ */ jsx(Text, { style: styles.bodyMuted, children: dataQuality.note })
          ] }),
          /* @__PURE__ */ jsxs(View, { style: { marginTop: 28 }, children: [
            /* @__PURE__ */ jsx(Text, { style: styles.mono, children: isMixedProfile ? "Dein Profil \xB7 Mischprofil" : "Prim\xE4rer Archetyp" }),
            /* @__PURE__ */ jsx(Text, { style: styles.h3, children: primaryArchetype.name_de }),
            /* @__PURE__ */ jsx(Text, { style: styles.bodyMuted, children: primaryArchetype.short_trait }),
            /* @__PURE__ */ jsxs(View, { style: { marginTop: 14 }, children: [
              /* @__PURE__ */ jsx(Text, { style: styles.mono, children: isMixedProfile ? "Gleich starke Zweittendenz" : "Sekund\xE4rer Archetyp" }),
              /* @__PURE__ */ jsx(Text, { style: { ...styles.h3, fontSize: 13 }, children: secondaryArchetype.name_de }),
              /* @__PURE__ */ jsx(Text, { style: styles.bodyMuted, children: secondaryArchetype.short_trait })
            ] }),
            isMixedProfile && /* @__PURE__ */ jsxs(Text, { style: { ...styles.bodyMuted, marginTop: 12 }, children: [
              "Dein Ergebnis ist ein Mischprofil aus ",
              primaryArchetype.name_de,
              " und ",
              secondaryArchetype.name_de,
              ". Beide Muster sind aktuell etwa gleich stark ausgepr\xE4gt; die folgenden St\xE4rken und Hinweise gelten f\xFCr beide Tendenzen."
            ] })
          ] }),
          /* @__PURE__ */ jsx(PageFooter, { pageNum: 2, productName })
        ] }),
        /* @__PURE__ */ jsxs(Page, { size: "A4", style: styles.pagePetrol, children: [
          /* @__PURE__ */ jsx(Text, { style: styles.archetypeLabel, children: isMixedProfile ? "Dein Mischprofil" : "Dein Prim\xE4rer Archetyp" }),
          /* @__PURE__ */ jsx(Text, { style: styles.archetypeName, children: primaryArchetype.name_de }),
          /* @__PURE__ */ jsx(Text, { style: styles.archetypeTrait, children: primaryArchetype.short_trait }),
          /* @__PURE__ */ jsx(Text, { style: styles.archetypeKernmuster, children: primaryArchetype.kernmuster }),
          /* @__PURE__ */ jsxs(View, { style: styles.secondarySection, children: [
            /* @__PURE__ */ jsx(Text, { style: styles.secondaryLabel, children: isMixedProfile ? "Gleich starke Zweittendenz" : "Sekund\xE4rer Archetyp" }),
            /* @__PURE__ */ jsx(Text, { style: styles.secondaryName, children: secondaryArchetype.name_de }),
            /* @__PURE__ */ jsx(Text, { style: styles.secondaryTrait, children: secondaryArchetype.short_trait })
          ] }),
          /* @__PURE__ */ jsxs(View, { style: { marginTop: 50 }, children: [
            /* @__PURE__ */ jsx(Text, { style: styles.secondaryLabel, children: "Interpretation" }),
            /* @__PURE__ */ jsx(Text, { style: { ...styles.bodyLight, marginTop: 10, fontFamily: PDF_DISPLAY, fontStyle: "italic", fontSize: 12, lineHeight: 1.55, opacity: 0.92 }, children: texts.archetyp_interpretation })
          ] })
        ] }),
        /* @__PURE__ */ jsxs(Page, { size: "A4", style: styles.page, children: [
          /* @__PURE__ */ jsx(Text, { style: styles.kicker, children: "02 \u2014 Funktionale Signatur" }),
          /* @__PURE__ */ jsx(Text, { style: styles.h1, children: "Deine 6 Kernachsen." }),
          /* @__PURE__ */ jsx(View, { style: styles.dividerGold }),
          /* @__PURE__ */ jsx(Text, { style: styles.body, children: texts.signature_narrative }),
          /* @__PURE__ */ jsx(View, { style: { marginTop: 24 }, children: AXIS_ORDER.map((axis) => /* @__PURE__ */ jsx(AxisBar, { axis, value: axisScores[axis] }, axis)) }),
          /* @__PURE__ */ jsx(PageFooter, { pageNum: 4, productName })
        ] }),
        /* @__PURE__ */ jsxs(Page, { size: "A4", style: styles.page, children: [
          /* @__PURE__ */ jsx(Text, { style: styles.kicker, children: "02 \u2014 Positionierung" }),
          /* @__PURE__ */ jsx(Text, { style: styles.h1, children: "Deine F\xFChrungsmatrix." }),
          /* @__PURE__ */ jsx(View, { style: styles.dividerGold }),
          /* @__PURE__ */ jsx(Text, { style: styles.body, children: "Zahlen allein sagen wenig. Die beiden Matrizen zeigen, wo du als Trainer stehst \u2014 der goldene Punkt ist deine Position, kein Urteil. Lies ihn wie eine Landkarte: Wo der Punkt liegt, liegt deine nat\xFCrliche Komfortzone. Wohin du dich bewegen willst, ist deine Entwicklungsrichtung. Kein Quadrant ist \u201Ebesser\u201C \u2014 entscheidend ist die Passung zu deiner Mannschaft und zur aktuellen Phase." }),
          /* @__PURE__ */ jsx(
            PositionMatrix,
            {
              title: "Wie du f\xFChrst",
              xAxis: "struktur_intuition",
              yAxis: "leistung_beziehung",
              xValue: axisScores.struktur_intuition,
              yValue: axisScores.leistung_beziehung,
              quadrants: ["Intuitiver Antrieb", "Strukturierte Leistung", "Geordnete N\xE4he", "Sp\xFCrbare N\xE4he"]
            }
          ),
          /* @__PURE__ */ jsx(
            PositionMatrix,
            {
              title: "Wie du steuerst",
              xAxis: "autoritaet_beteiligung",
              yAxis: "stabilisierung_aktivierung",
              xValue: axisScores.autoritaet_beteiligung,
              yValue: axisScores.stabilisierung_aktivierung,
              quadrants: ["Mitrei\xDFend & offen", "Treibend & f\xFChrend", "Ordnend & ruhend", "Tragend & ruhig"]
            }
          ),
          /* @__PURE__ */ jsx(PageFooter, { productName })
        ] }),
        hasPremium && texts.coach_signature_portrait && /* @__PURE__ */ jsxs(Page, { size: "A4", style: styles.pagePetrol, children: [
          /* @__PURE__ */ jsx(Text, { style: { ...styles.kickerDark, color: COLORS.gold }, children: "Premium \xB7 Signature Portrait" }),
          /* @__PURE__ */ jsxs(Text, { style: { ...styles.h1, color: COLORS.bone }, children: [
            "Coach",
            "\n",
            /* @__PURE__ */ jsx(Text, { style: { fontFamily: PDF_DISPLAY, fontStyle: "italic", color: COLORS.gold }, children: "Signature." })
          ] }),
          /* @__PURE__ */ jsx(View, { style: { ...styles.dividerGold, backgroundColor: COLORS.gold } }),
          /* @__PURE__ */ jsx(Text, { style: { ...styles.bodyLight, fontFamily: PDF_DISPLAY, fontStyle: "italic", fontSize: 13, lineHeight: 1.55 }, children: texts.coach_signature_portrait }),
          texts.fuehrungsenergie && /* @__PURE__ */ jsxs(View, { style: { marginTop: 30, paddingTop: 18, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.1)" }, children: [
            /* @__PURE__ */ jsx(Text, { style: { fontSize: 8, letterSpacing: 2, color: COLORS.goldLight, textTransform: "uppercase", marginBottom: 6 }, children: "F\xFChrungsenergie" }),
            /* @__PURE__ */ jsx(Text, { style: { fontSize: 14, color: COLORS.bone, fontFamily: PDF_DISPLAY, fontStyle: "italic" }, children: texts.fuehrungsenergie })
          ] })
        ] }),
        hasPremium && (texts.paradoxien || texts.shadow_pattern) && /* @__PURE__ */ jsxs(Page, { size: "A4", style: styles.page, children: [
          /* @__PURE__ */ jsx(Text, { style: styles.kicker, children: "Premium \xB7 Paradoxien & Kippmuster" }),
          /* @__PURE__ */ jsxs(Text, { style: styles.h1, children: [
            "Die Spannungen,",
            "\n",
            "in denen du f\xFChrst."
          ] }),
          /* @__PURE__ */ jsx(View, { style: styles.dividerGold }),
          texts.paradoxien && texts.paradoxien.length > 0 && /* @__PURE__ */ jsxs(View, { style: { marginTop: 18 }, children: [
            /* @__PURE__ */ jsx(Text, { style: { fontSize: 8, letterSpacing: 2, color: COLORS.goldDeep, textTransform: "uppercase", marginBottom: 10 }, children: "Trainer-Paradoxien" }),
            texts.paradoxien.map((p, i) => /* @__PURE__ */ jsxs(View, { style: { marginBottom: 10, paddingLeft: 18, position: "relative" }, children: [
              /* @__PURE__ */ jsx(Text, { style: { position: "absolute", left: 0, top: 0, color: COLORS.gold, fontFamily: PDF_SANS, fontSize: 10 }, children: String(i + 1).padStart(2, "0") }),
              /* @__PURE__ */ jsx(Text, { style: { ...styles.body, fontFamily: PDF_DISPLAY, fontStyle: "italic", fontSize: 12 }, children: p })
            ] }, i))
          ] }),
          texts.shadow_pattern && /* @__PURE__ */ jsxs(View, { style: { ...styles.calloutGold, marginTop: 24 }, children: [
            /* @__PURE__ */ jsx(Text, { style: styles.calloutLabel, children: "Shadow Pattern \xB7 Kippmuster" }),
            /* @__PURE__ */ jsx(Text, { style: styles.body, children: texts.shadow_pattern })
          ] })
        ] }),
        hasPremium && hasContextEffect && /* @__PURE__ */ jsxs(Page, { size: "A4", style: styles.page, children: [
          /* @__PURE__ */ jsx(Text, { style: styles.kicker, children: "Premium \xB7 Wirkung je Kontext" }),
          /* @__PURE__ */ jsxs(Text, { style: styles.h1, children: [
            "Du wirkst nicht",
            "\n",
            "\xFCberall gleich."
          ] }),
          /* @__PURE__ */ jsx(View, { style: styles.dividerGold }),
          /* @__PURE__ */ jsx(View, { style: { marginTop: 16 }, children: [
            ["trainingsalltag", "Trainingsalltag"],
            ["spieltag", "Spieltag"],
            ["niederlage", "Niederlage"],
            ["konflikt", "Konflikt"],
            ["krise", "Krise / Akute Phase"]
          ].map(([key, title]) => {
            const text = texts.wirkung_je_kontext?.[key];
            if (!text) return null;
            return /* @__PURE__ */ jsxs(View, { style: styles.moduleCard, children: [
              /* @__PURE__ */ jsx(View, { style: styles.moduleHeader, children: /* @__PURE__ */ jsx(Text, { style: styles.moduleCode, children: title }) }),
              /* @__PURE__ */ jsx(Text, { style: { ...styles.body, fontSize: 9.5 }, children: text })
            ] }, key);
          }) })
        ] }),
        hasMaturity && maturityScores && /* @__PURE__ */ jsxs(Page, { size: "A4", style: styles.page, children: [
          /* @__PURE__ */ jsx(Text, { style: styles.kicker, children: "Premium \xB7 Entwicklungsindikatoren" }),
          /* @__PURE__ */ jsxs(Text, { style: styles.h1, children: [
            "Stil ist das eine.",
            "\n",
            /* @__PURE__ */ jsx(Text, { style: { fontFamily: PDF_DISPLAY, fontStyle: "italic" }, children: "Entwicklung" }),
            " ist das andere."
          ] }),
          /* @__PURE__ */ jsx(View, { style: styles.dividerGold }),
          /* @__PURE__ */ jsx(Text, { style: styles.body, children: texts.fuehrungsreife_interpretation }),
          /* @__PURE__ */ jsx(View, { style: { marginTop: 22 }, children: Object.entries(maturityScores).map(([key, val]) => /* @__PURE__ */ jsxs(View, { style: { marginBottom: 12 }, children: [
            /* @__PURE__ */ jsxs(View, { style: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }, children: [
              /* @__PURE__ */ jsx(Text, { style: { fontFamily: PDF_SANS, fontSize: 10, fontWeight: 600, color: COLORS.ink }, children: MATURITY_LABELS_PDF[key] ?? key }),
              /* @__PURE__ */ jsx(Text, { style: { fontFamily: PDF_SANS, fontSize: 9, color: COLORS.goldDeep, textTransform: "uppercase", letterSpacing: 0.5 }, children: pdfTendency(Number(val)) })
            ] }),
            /* @__PURE__ */ jsxs(Svg, { height: 8, width: "100%", children: [
              /* @__PURE__ */ jsx(Rect, { x: 0, y: 3, width: "100%", height: 2, fill: COLORS.boneLine, rx: 1 }),
              /* @__PURE__ */ jsx(Circle, { cx: safePct(val), cy: 4, r: 4, fill: COLORS.gold })
            ] })
          ] }, key)) }),
          /* @__PURE__ */ jsx(Text, { style: { fontFamily: PDF_SANS, fontSize: 8, color: COLORS.muted, marginTop: 16, lineHeight: 1.5 }, children: "Hinweis: Diese Indikatoren sind ein Reflexionsraster aus den eigenen Antworten \u2014 kein normiertes, validiertes Reifema\xDF und keine endg\xFCltige Einstufung der F\xFChrung." })
        ] }),
        hasPremium && (texts.saisonphase_interpretation || texts.coach_to_team_fit) && /* @__PURE__ */ jsxs(Page, { size: "A4", style: styles.page, children: [
          /* @__PURE__ */ jsx(Text, { style: styles.kicker, children: "Premium \xB7 Kontext-Fit" }),
          /* @__PURE__ */ jsx(Text, { style: styles.h1, children: "Stil \xD7 Phase \xD7 Team." }),
          /* @__PURE__ */ jsx(View, { style: styles.dividerGold }),
          texts.saisonphase_interpretation && /* @__PURE__ */ jsxs(View, { style: { marginTop: 14 }, children: [
            /* @__PURE__ */ jsx(Text, { style: { fontSize: 8, letterSpacing: 2, color: COLORS.goldDeep, textTransform: "uppercase", marginBottom: 8 }, children: "Wirkung in aktueller Saisonphase" }),
            /* @__PURE__ */ jsx(Text, { style: styles.body, children: texts.saisonphase_interpretation })
          ] }),
          texts.coach_to_team_fit && /* @__PURE__ */ jsxs(View, { style: { marginTop: 18 }, children: [
            /* @__PURE__ */ jsx(Text, { style: { fontSize: 8, letterSpacing: 2, color: COLORS.goldDeep, textTransform: "uppercase", marginBottom: 8 }, children: "Coach-to-Team Fit" }),
            /* @__PURE__ */ jsx(Text, { style: styles.body, children: texts.coach_to_team_fit })
          ] }),
          texts.spielerbedarf && /* @__PURE__ */ jsxs(View, { style: { ...styles.calloutGold, marginTop: 18 }, children: [
            /* @__PURE__ */ jsx(Text, { style: styles.calloutLabel, children: "Was Spieler von diesem Stil brauchen" }),
            /* @__PURE__ */ jsx(Text, { style: styles.body, children: texts.spielerbedarf })
          ] })
        ] }),
        hasPremium && texts.no_go_warnungen && texts.no_go_warnungen.length > 0 && /* @__PURE__ */ jsxs(Page, { size: "A4", style: styles.page, children: [
          /* @__PURE__ */ jsx(Text, { style: styles.kicker, children: "Premium \xB7 Warnhinweise" }),
          /* @__PURE__ */ jsxs(Text, { style: styles.h1, children: [
            "Was du",
            "\n",
            /* @__PURE__ */ jsx(Text, { style: { fontFamily: PDF_DISPLAY, fontStyle: "italic" }, children: "nicht" }),
            " tun solltest."
          ] }),
          /* @__PURE__ */ jsx(View, { style: styles.dividerGold }),
          /* @__PURE__ */ jsx(Text, { style: { ...styles.body, fontStyle: "italic", color: COLORS.muted, marginBottom: 18 }, children: "Keine Moral, sondern Praxis. Basierend auf deinem Profil sind dies die typischen Fehler, die dein Stil unter Druck produziert \u2014 und die du kennen solltest." }),
          texts.no_go_warnungen.map((warn, i) => /* @__PURE__ */ jsxs(View, { style: { marginBottom: 12, paddingLeft: 24, position: "relative" }, children: [
            /* @__PURE__ */ jsx(Text, { style: { position: "absolute", left: 0, top: 1, color: COLORS.gold, fontFamily: PDF_SANS, fontSize: 12, fontWeight: 700 }, children: "\xD7" }),
            /* @__PURE__ */ jsx(Text, { style: { ...styles.body, fontSize: 10.5 }, children: warn })
          ] }, i)),
          texts.beratungswuerdigkeit && /* @__PURE__ */ jsxs(View, { style: { marginTop: 28, paddingTop: 14, borderTopWidth: 1, borderTopColor: COLORS.boneLine }, children: [
            /* @__PURE__ */ jsx(Text, { style: { fontSize: 8, letterSpacing: 2, color: COLORS.muted, textTransform: "uppercase", marginBottom: 4 }, children: "Beratungsw\xFCrdigkeit dieses Profils" }),
            /* @__PURE__ */ jsx(Text, { style: { fontFamily: PDF_DISPLAY, fontSize: 18, color: COLORS.goldDeep, textTransform: "uppercase", letterSpacing: 2 }, children: texts.beratungswuerdigkeit }),
            /* @__PURE__ */ jsx(Text, { style: { ...styles.bodyMuted, marginTop: 6 }, children: "Gemeint ist, wie viel zus\xE4tzliche Begleitung dein Profil sinnvoll machen kann \u2014 kein Urteil \xFCber dich, sondern ein Hinweis auf den m\xF6glichen Hebel einer vertieften Arbeit." })
          ] })
        ] }),
        has360 && /* @__PURE__ */ jsxs(Page, { size: "A4", style: styles.pagePetrol, children: [
          /* @__PURE__ */ jsx(Text, { style: { ...styles.kickerDark, color: COLORS.gold }, children: "03 \u2014 360\xB0 Spiegel" }),
          /* @__PURE__ */ jsxs(Text, { style: { ...styles.h1, color: COLORS.bone }, children: [
            "Wie dein Team",
            "\n",
            /* @__PURE__ */ jsx(Text, { style: { fontFamily: PDF_DISPLAY, fontStyle: "italic", color: COLORS.gold }, children: "dich wirklich" }),
            "\n",
            "erlebt."
          ] }),
          /* @__PURE__ */ jsx(View, { style: { ...styles.dividerGold, backgroundColor: COLORS.gold } }),
          /* @__PURE__ */ jsx(Text, { style: { ...styles.bodyLight, opacity: 0.92, fontFamily: PDF_DISPLAY, fontStyle: "italic", fontSize: 12 }, children: texts.fremdbild_summary }),
          /* @__PURE__ */ jsxs(View, { style: { marginTop: 28, paddingTop: 16, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.1)" }, children: [
            /* @__PURE__ */ jsx(Text, { style: { fontSize: 8, letterSpacing: 2, color: COLORS.goldLight, textTransform: "uppercase", marginBottom: 6 }, children: "Datenbasis" }),
            /* @__PURE__ */ jsxs(Text, { style: { fontSize: 11, color: COLORS.bone }, children: [
              fremdbildResponseCount ?? 0,
              " eingegangene Fremdeinsch\xE4tzungen \xB7 anonymisiert und ausschlie\xDFlich aggregiert ausgewertet"
            ] })
          ] })
        ] }),
        has360 && /* @__PURE__ */ jsxs(Page, { size: "A4", style: styles.page, children: [
          /* @__PURE__ */ jsx(Text, { style: styles.kicker, children: "03 \u2014 Selbst- vs. Fremdbild" }),
          /* @__PURE__ */ jsxs(Text, { style: styles.h1, children: [
            "\xDCbereinstimmung,",
            "\n",
            "Spannung, Hebel."
          ] }),
          /* @__PURE__ */ jsx(View, { style: styles.dividerGold }),
          /* @__PURE__ */ jsx(Text, { style: styles.body, children: texts.spiegel_narrative }),
          /* @__PURE__ */ jsx(View, { style: { marginTop: 22 }, children: discrepancies.map((d) => {
            const labels = AXIS_LABELS[d.axis];
            const selfPct = Math.round(d.selfValue * 100);
            const fremdPct = Math.round(d.fremdValue * 100);
            const deltaPct = Math.round(d.delta * 100);
            const magColor = d.magnitude === "hoch" ? COLORS.gold : d.magnitude === "moderat" ? COLORS.goldDeep : COLORS.muted;
            return /* @__PURE__ */ jsxs(View, { style: { marginBottom: 14 }, children: [
              /* @__PURE__ */ jsxs(View, { style: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4, fontSize: 8, textTransform: "uppercase", letterSpacing: 1.4 }, children: [
                /* @__PURE__ */ jsx(Text, { style: { color: COLORS.muted }, children: labels.low }),
                /* @__PURE__ */ jsxs(Text, { style: { color: magColor, fontWeight: 700 }, children: [
                  "\u0394 ",
                  deltaPct >= 0 ? "+" : "",
                  deltaPct,
                  "% \xB7 ",
                  d.magnitude
                ] }),
                /* @__PURE__ */ jsx(Text, { style: { color: COLORS.muted }, children: labels.high })
              ] }),
              /* @__PURE__ */ jsxs(Svg, { height: 14, width: "100%", children: [
                /* @__PURE__ */ jsx(Rect, { x: 0, y: 6, width: "100%", height: 2, fill: COLORS.boneLine, rx: 1 }),
                /* @__PURE__ */ jsx(Circle, { cx: safePct(d.selfValue), cy: 7, r: 4, fill: COLORS.bone, stroke: COLORS.ink, strokeWidth: 1.5 }),
                /* @__PURE__ */ jsx(Circle, { cx: safePct(d.fremdValue), cy: 7, r: 4, fill: COLORS.gold })
              ] }),
              /* @__PURE__ */ jsxs(View, { style: { flexDirection: "row", justifyContent: "space-between", marginTop: 3, fontSize: 7.5, color: COLORS.muted }, children: [
                /* @__PURE__ */ jsxs(View, { style: { flexDirection: "row", alignItems: "center" }, children: [
                  /* @__PURE__ */ jsx(LegendDot, { filled: false }),
                  /* @__PURE__ */ jsxs(Text, { children: [
                    "Selbst ",
                    selfPct,
                    "%"
                  ] })
                ] }),
                /* @__PURE__ */ jsxs(View, { style: { flexDirection: "row", alignItems: "center" }, children: [
                  /* @__PURE__ */ jsx(LegendDot, { filled: true }),
                  /* @__PURE__ */ jsxs(Text, { children: [
                    "Fremd ",
                    fremdPct,
                    "%"
                  ] })
                ] })
              ] })
            ] }, d.axis);
          }) }),
          /* @__PURE__ */ jsxs(View, { style: { ...styles.calloutGold, marginTop: 20 }, children: [
            /* @__PURE__ */ jsx(Text, { style: styles.calloutLabel, children: "Blinde Flecken" }),
            /* @__PURE__ */ jsx(Text, { style: styles.body, children: texts.blind_spots ?? "Keine signifikanten blinden Flecken erkennbar." })
          ] })
        ] }),
        has360 && texts.diskrepanz_interpretationen && /* @__PURE__ */ jsxs(Page, { size: "A4", style: styles.page, children: [
          /* @__PURE__ */ jsx(Text, { style: styles.kicker, children: "03 \u2014 Diskrepanz pro Achse" }),
          /* @__PURE__ */ jsxs(Text, { style: styles.h1, children: [
            "Was die L\xFCcken",
            "\n",
            "konkret bedeuten."
          ] }),
          /* @__PURE__ */ jsx(View, { style: styles.dividerGold }),
          AXIS_ORDER.map((axis) => {
            const interp = texts.diskrepanz_interpretationen?.[axis];
            const d = discrepancies.find((x) => x.axis === axis);
            if (!interp || !d) return null;
            const labels = AXIS_LABELS[axis];
            return /* @__PURE__ */ jsxs(View, { style: styles.moduleCard, children: [
              /* @__PURE__ */ jsxs(View, { style: styles.moduleHeader, children: [
                /* @__PURE__ */ jsxs(Text, { style: styles.moduleCode, children: [
                  labels.low,
                  " / ",
                  labels.high
                ] }),
                /* @__PURE__ */ jsxs(Text, { style: { ...styles.moduleTitle, fontSize: 12, color: d.magnitude === "hoch" ? COLORS.gold : COLORS.ink }, children: [
                  "\u0394 ",
                  Math.round(d.delta * 100) >= 0 ? "+" : "",
                  Math.round(d.delta * 100),
                  "%"
                ] })
              ] }),
              /* @__PURE__ */ jsx(Text, { style: { ...styles.body, fontSize: 9.5 }, children: interp })
            ] }, axis);
          })
        ] }),
        /* @__PURE__ */ jsxs(Page, { size: "A4", style: styles.page, children: [
          /* @__PURE__ */ jsxs(Text, { style: styles.kicker, children: [
            has360 ? "04" : "03",
            " \u2014 Druckprofil"
          ] }),
          /* @__PURE__ */ jsxs(Text, { style: styles.h1, children: [
            "Wie du f\xFChrst, wenn",
            "'",
            "s",
            "\n",
            "wirklich z\xE4hlt."
          ] }),
          /* @__PURE__ */ jsx(View, { style: styles.dividerGold }),
          /* @__PURE__ */ jsx(Text, { style: styles.body, children: texts.druckprofil }),
          /* @__PURE__ */ jsxs(View, { style: styles.calloutGold, children: [
            /* @__PURE__ */ jsx(Text, { style: styles.calloutLabel, children: "Hauptrisiken" }),
            /* @__PURE__ */ jsx(Text, { style: styles.body, children: texts.hauptrisiken })
          ] }),
          /* @__PURE__ */ jsx(PageFooter, { pageNum: 5, productName })
        ] }),
        hasTeamcheck && /* @__PURE__ */ jsxs(Page, { size: "A4", style: styles.pagePetrol, children: [
          /* @__PURE__ */ jsx(Text, { style: { ...styles.kickerDark, color: COLORS.gold }, children: "05 \u2014 TeamCheck" }),
          /* @__PURE__ */ jsxs(Text, { style: { ...styles.h1, color: COLORS.bone }, children: [
            "Was dein",
            "\n",
            /* @__PURE__ */ jsx(Text, { style: { fontFamily: PDF_DISPLAY, fontStyle: "italic", color: COLORS.gold }, children: "Team" }),
            "\n",
            "wirklich erlebt."
          ] }),
          /* @__PURE__ */ jsx(View, { style: { ...styles.dividerGold, backgroundColor: COLORS.gold } }),
          /* @__PURE__ */ jsx(Text, { style: { ...styles.bodyLight, opacity: 0.92, fontFamily: PDF_DISPLAY, fontStyle: "italic", fontSize: 12 }, children: texts.teamcheck_summary }),
          /* @__PURE__ */ jsxs(View, { style: { marginTop: 28, paddingTop: 16, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.1)" }, children: [
            /* @__PURE__ */ jsx(Text, { style: { fontSize: 8, letterSpacing: 2, color: COLORS.goldLight, textTransform: "uppercase", marginBottom: 6 }, children: "Datenbasis" }),
            /* @__PURE__ */ jsxs(Text, { style: { fontSize: 11, color: COLORS.bone }, children: [
              teamcheckResponseCount ?? 0,
              " eingegangene Spielerantworten \xB7 anonymisiert und ausschlie\xDFlich aggregiert \xB7 Schwelle f\xFCr Auswertung: 5"
            ] })
          ] })
        ] }),
        hasTeamcheck && teamcheckScores && /* @__PURE__ */ jsxs(Page, { size: "A4", style: styles.page, children: [
          /* @__PURE__ */ jsx(Text, { style: styles.kicker, children: "05 \u2014 Team-Scores" }),
          /* @__PURE__ */ jsxs(Text, { style: styles.h1, children: [
            "F\xFCnf Dimensionen",
            "\n",
            "der Team-Realit\xE4t."
          ] }),
          /* @__PURE__ */ jsx(View, { style: styles.dividerGold }),
          /* @__PURE__ */ jsx(Text, { style: styles.body, children: texts.teamcheck_narrative }),
          /* @__PURE__ */ jsx(View, { style: { marginTop: 22 }, children: [
            ["coach_impact", teamcheckScores.coachImpact, "Coach-Wirkung", "Negativ", "Positiv"],
            ["psy_safety", teamcheckScores.psySafety, "Psychologische Sicherheit", "Unsicher", "Sicher"],
            ["team_klima", teamcheckScores.teamKlima, "Teamklima", "Schwach", "Stark"],
            ["leistungsdr", teamcheckScores.leistungsdruck, "Leistungsklima", "Erdr\xFCckend", "Inspirierend"],
            ["klarheit", teamcheckScores.klarheit, "Rollenklarheit", "Unklar", "Klar"]
          ].map(([key, val, title, low, high]) => /* @__PURE__ */ jsxs(View, { style: { marginBottom: 18 }, children: [
            /* @__PURE__ */ jsxs(View, { style: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }, children: [
              /* @__PURE__ */ jsx(Text, { style: { fontFamily: PDF_SANS, fontSize: 10, fontWeight: 600, color: COLORS.ink }, children: title }),
              /* @__PURE__ */ jsxs(Text, { style: { fontFamily: PDF_SANS, fontSize: 10, fontWeight: 600, color: COLORS.goldDeep }, children: [
                Math.round(val * 100),
                " %"
              ] })
            ] }),
            /* @__PURE__ */ jsxs(View, { style: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4, fontSize: 8, color: COLORS.muted, textTransform: "uppercase", letterSpacing: 1.4 }, children: [
              /* @__PURE__ */ jsx(Text, { children: low }),
              /* @__PURE__ */ jsx(Text, { children: high })
            ] }),
            /* @__PURE__ */ jsxs(Svg, { height: 8, width: "100%", children: [
              /* @__PURE__ */ jsx(Rect, { x: 0, y: 3, width: "100%", height: 2, fill: COLORS.boneLine, rx: 1 }),
              /* @__PURE__ */ jsx(Circle, { cx: safePct(val), cy: 4, r: 4, fill: COLORS.gold })
            ] })
          ] }, key)) }),
          /* @__PURE__ */ jsxs(View, { style: { ...styles.calloutGold, marginTop: 14 }, children: [
            /* @__PURE__ */ jsx(Text, { style: styles.calloutLabel, children: "Team-Dynamiken" }),
            /* @__PURE__ */ jsx(Text, { style: styles.body, children: texts.team_dynamics })
          ] }),
          teamcheckCareHints && teamcheckCareHints.length > 0 && /* @__PURE__ */ jsxs(View, { style: { marginTop: 14, padding: 12, borderWidth: 1, borderColor: COLORS.boneLine, borderRadius: 4 }, children: [
            /* @__PURE__ */ jsx(Text, { style: { fontSize: 7.5, letterSpacing: 1.6, color: COLORS.muted, textTransform: "uppercase", marginBottom: 6 }, children: "Achtsamkeitshinweise \xB7 anonym aggregiert \xB7 kein Befund \xFCber einzelne Personen" }),
            teamcheckCareHints.map((h, i) => /* @__PURE__ */ jsxs(Text, { style: { ...styles.body, fontSize: 9.5, marginBottom: i === teamcheckCareHints.length - 1 ? 0 : 5 }, children: [
              /* @__PURE__ */ jsxs(Text, { style: { fontWeight: 600 }, children: [
                h.topic,
                ": "
              ] }),
              h.text
            ] }, i))
          ] })
        ] }),
        hasTeamcheck && texts.team_handlungsempfehlungen && texts.team_handlungsempfehlungen.length > 0 && /* @__PURE__ */ jsxs(Page, { size: "A4", style: styles.page, children: [
          /* @__PURE__ */ jsx(Text, { style: styles.kicker, children: "05 \u2014 Sofort-Ma\xDFnahmen" }),
          /* @__PURE__ */ jsxs(Text, { style: styles.h1, children: [
            "14 Tage.",
            "\n",
            "Konkrete Schritte."
          ] }),
          /* @__PURE__ */ jsx(View, { style: styles.dividerGold }),
          /* @__PURE__ */ jsx(View, { style: { marginTop: 16 }, children: texts.team_handlungsempfehlungen.map((step, i) => /* @__PURE__ */ jsxs(View, { style: styles.moduleCard, children: [
            /* @__PURE__ */ jsx(View, { style: styles.moduleHeader, children: /* @__PURE__ */ jsx(Text, { style: { ...styles.moduleCode, fontFamily: PDF_DISPLAY, fontSize: 20, color: COLORS.gold, letterSpacing: 0 }, children: String(i + 1).padStart(2, "0") }) }),
            /* @__PURE__ */ jsx(Text, { style: styles.body, children: step })
          ] }, i)) })
        ] }),
        showAllModules && texts.modul_interpretationen && Object.keys(texts.modul_interpretationen).length > 0 && /* @__PURE__ */ jsxs(Page, { size: "A4", style: styles.page, children: [
          /* @__PURE__ */ jsx(Text, { style: styles.kicker, children: "04 \u2014 Deine Sieben Module" }),
          /* @__PURE__ */ jsx(Text, { style: styles.h1, children: "Die Architektur deiner F\xFChrung." }),
          /* @__PURE__ */ jsx(View, { style: styles.dividerGold }),
          Object.entries(texts.modul_interpretationen).slice(0, 4).map(([code, text]) => /* @__PURE__ */ jsxs(View, { style: styles.moduleCard, children: [
            /* @__PURE__ */ jsxs(View, { style: styles.moduleHeader, children: [
              /* @__PURE__ */ jsxs(Text, { style: styles.moduleCode, children: [
                "Modul ",
                code
              ] }),
              /* @__PURE__ */ jsx(Text, { style: styles.moduleTitle, children: MODULE_TITLES[code] ?? code })
            ] }),
            /* @__PURE__ */ jsx(Text, { style: styles.body, children: text })
          ] }, code)),
          /* @__PURE__ */ jsx(PageFooter, { pageNum: 6, productName })
        ] }),
        showAllModules && texts.modul_interpretationen && Object.keys(texts.modul_interpretationen).length > 4 && /* @__PURE__ */ jsxs(Page, { size: "A4", style: styles.page, children: [
          /* @__PURE__ */ jsx(Text, { style: styles.kicker, children: "04 \u2014 Deine Sieben Module (Fortsetzung)" }),
          /* @__PURE__ */ jsx(View, { style: styles.dividerGold }),
          Object.entries(texts.modul_interpretationen).slice(4).map(([code, text]) => /* @__PURE__ */ jsxs(View, { style: styles.moduleCard, children: [
            /* @__PURE__ */ jsxs(View, { style: styles.moduleHeader, children: [
              /* @__PURE__ */ jsxs(Text, { style: styles.moduleCode, children: [
                "Modul ",
                code
              ] }),
              /* @__PURE__ */ jsx(Text, { style: styles.moduleTitle, children: MODULE_TITLES[code] ?? code })
            ] }),
            /* @__PURE__ */ jsx(Text, { style: styles.body, children: text })
          ] }, code)),
          /* @__PURE__ */ jsx(PageFooter, { pageNum: 7, productName })
        ] }),
        /* @__PURE__ */ jsxs(Page, { size: "A4", style: styles.page, children: [
          /* @__PURE__ */ jsx(Text, { style: styles.kicker, children: "05 \u2014 St\xE4rken \xB7 Risiken \xB7 Hebel" }),
          /* @__PURE__ */ jsxs(Text, { style: styles.h1, children: [
            "Wo du stark bist",
            "\n",
            "und wo du drehst."
          ] }),
          /* @__PURE__ */ jsx(View, { style: styles.dividerGold }),
          /* @__PURE__ */ jsx(Text, { style: styles.h3, children: "Deine St\xE4rken" }),
          primaryArchetype.staerken.map((s, i) => /* @__PURE__ */ jsx(Bullet, { children: s }, i)),
          /* @__PURE__ */ jsx(Text, { style: styles.h3, children: "Typische Risiken" }),
          primaryArchetype.risiken.map((r, i) => /* @__PURE__ */ jsx(Bullet, { children: r }, i)),
          /* @__PURE__ */ jsx(Text, { style: styles.h3, children: "Entwicklungshebel" }),
          primaryArchetype.entwicklungshebel.map((h, i) => /* @__PURE__ */ jsx(Bullet, { children: h }, i)),
          /* @__PURE__ */ jsxs(View, { style: styles.calloutGold, children: [
            /* @__PURE__ */ jsx(Text, { style: styles.calloutLabel, children: "Entwicklungspfad" }),
            /* @__PURE__ */ jsx(Text, { style: styles.body, children: texts.entwicklungspfad })
          ] }),
          /* @__PURE__ */ jsx(PageFooter, { pageNum: 8, productName })
        ] }),
        productTier >= 2 && texts.gespraechsleitfaden && texts.gespraechsleitfaden.length > 0 && /* @__PURE__ */ jsxs(Page, { size: "A4", style: styles.page, children: [
          /* @__PURE__ */ jsx(Text, { style: styles.kicker, children: "06 \u2014 Gespr\xE4chsleitfaden" }),
          /* @__PURE__ */ jsxs(Text, { style: styles.h1, children: [
            "Fragen, die zu deinem",
            "\n",
            "Profil passen."
          ] }),
          /* @__PURE__ */ jsx(View, { style: styles.dividerGold }),
          /* @__PURE__ */ jsxs(Text, { style: styles.bodyMuted, children: [
            texts.gespraechsleitfaden.length,
            " offene ",
            texts.gespraechsleitfaden.length === 1 ? "Frage" : "Fragen",
            " zur Selbstreflexion oder f\xFCr Einzelgespr\xE4che mit Spielern. Formuliert speziell f\xFCr dein Profil und seine Spannungen."
          ] }),
          /* @__PURE__ */ jsx(View, { style: { marginTop: 20 }, children: texts.gespraechsleitfaden.map((q, i) => /* @__PURE__ */ jsxs(View, { style: { marginBottom: 14 }, children: [
            /* @__PURE__ */ jsxs(Text, { style: { fontSize: 8, color: COLORS.gold, letterSpacing: 2, marginBottom: 3 }, children: [
              "FRAGE ",
              String(i + 1).padStart(2, "0")
            ] }),
            /* @__PURE__ */ jsx(Text, { style: styles.quote, children: q })
          ] }, i)) }),
          /* @__PURE__ */ jsx(PageFooter, { pageNum: 9, productName })
        ] }),
        productTier >= 2 && texts.wirkung_je_spielertyp && texts.wirkung_je_spielertyp.length > 0 && /* @__PURE__ */ jsxs(Page, { size: "A4", style: styles.page, children: [
          /* @__PURE__ */ jsx(Text, { style: styles.kicker, children: "06b \u2014 Wirkung je Spielertyp" }),
          /* @__PURE__ */ jsxs(Text, { style: styles.h1, children: [
            "Derselbe Stil,",
            "\n",
            "vier Wirkungen."
          ] }),
          /* @__PURE__ */ jsx(View, { style: styles.dividerGold }),
          /* @__PURE__ */ jsx(Text, { style: styles.bodyMuted, children: "Dein Stil kommt nicht bei allen gleich an. So wirkt er auf vier typische Spielertypen \u2014 und was du je Typ konkret anpassen kannst." }),
          /* @__PURE__ */ jsx(View, { style: { marginTop: 18, flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" }, children: texts.wirkung_je_spielertyp.map((p, i) => /* @__PURE__ */ jsxs(View, { style: { ...styles.moduleCard, width: "48%" }, wrap: false, children: [
            /* @__PURE__ */ jsx(Text, { style: { fontSize: 10.5, fontFamily: PDF_DISPLAY, color: COLORS.ink, marginBottom: 5 }, children: p.spielertyp }),
            /* @__PURE__ */ jsx(Text, { style: { ...styles.body, marginBottom: 6 }, children: p.wirkung }),
            /* @__PURE__ */ jsx(Text, { style: { fontSize: 8, color: COLORS.gold, letterSpacing: 2, marginBottom: 2 }, children: "ANPASSUNG" }),
            /* @__PURE__ */ jsx(Text, { style: styles.quote, children: p.anpassung })
          ] }, i)) }),
          /* @__PURE__ */ jsx(PageFooter, { pageNum: 9, productName })
        ] }),
        productTier >= 2 && texts.bedienungsanleitung && texts.bedienungsanleitung.kernsatz && /* @__PURE__ */ jsxs(Page, { size: "A4", style: styles.page, children: [
          /* @__PURE__ */ jsx(Text, { style: styles.kicker, children: "06c \u2014 Deine Bedienungsanleitung" }),
          /* @__PURE__ */ jsxs(Text, { style: styles.h1, children: [
            "So arbeitet man",
            "\n",
            "am besten mit dir."
          ] }),
          /* @__PURE__ */ jsx(View, { style: styles.dividerGold }),
          /* @__PURE__ */ jsx(Text, { style: styles.bodyMuted, children: "Eine kompakte Anleitung zum Weitergeben \u2014 an Spieler, Co-Trainer oder dein Umfeld. Sie macht aus deinem Profil ein gemeinsames Verst\xE4ndnis." }),
          /* @__PURE__ */ jsxs(View, { style: { marginTop: 18 }, children: [
            /* @__PURE__ */ jsx(Text, { style: { fontSize: 18, fontFamily: PDF_DISPLAY, color: COLORS.ink, marginBottom: 4 }, children: texts.bedienungsanleitung.ueberschrift }),
            /* @__PURE__ */ jsx(Text, { style: { ...styles.quote, marginBottom: 16 }, children: texts.bedienungsanleitung.kernsatz }),
            texts.bedienungsanleitung.staerken && texts.bedienungsanleitung.staerken.length > 0 && /* @__PURE__ */ jsxs(View, { style: { marginBottom: 14 }, children: [
              /* @__PURE__ */ jsx(Text, { style: { fontSize: 8, color: COLORS.gold, letterSpacing: 2, marginBottom: 4 }, children: "KERNST\xC4RKEN" }),
              /* @__PURE__ */ jsx(Text, { style: styles.body, children: texts.bedienungsanleitung.staerken.join("  \xB7  ") })
            ] }),
            /* @__PURE__ */ jsxs(View, { style: styles.moduleCard, wrap: false, children: [
              /* @__PURE__ */ jsx(Text, { style: { fontSize: 8, color: COLORS.gold, letterSpacing: 2, marginBottom: 3 }, children: "SO ERREICHST DU MICH" }),
              /* @__PURE__ */ jsx(Text, { style: styles.body, children: texts.bedienungsanleitung.soErreichstDuMich })
            ] }),
            /* @__PURE__ */ jsxs(View, { style: styles.moduleCard, wrap: false, children: [
              /* @__PURE__ */ jsx(Text, { style: { fontSize: 8, color: COLORS.gold, letterSpacing: 2, marginBottom: 3 }, children: "SO GIBST DU MIR FEEDBACK" }),
              /* @__PURE__ */ jsx(Text, { style: styles.body, children: texts.bedienungsanleitung.soGibstDuFeedback })
            ] }),
            /* @__PURE__ */ jsxs(View, { style: styles.moduleCard, wrap: false, children: [
              /* @__PURE__ */ jsx(Text, { style: { fontSize: 8, color: COLORS.gold, letterSpacing: 2, marginBottom: 3 }, children: "UNTER DRUCK" }),
              /* @__PURE__ */ jsx(Text, { style: styles.body, children: texts.bedienungsanleitung.unterDruck })
            ] }),
            /* @__PURE__ */ jsxs(View, { style: styles.moduleCard, wrap: false, children: [
              /* @__PURE__ */ jsx(Text, { style: { fontSize: 8, color: COLORS.gold, letterSpacing: 2, marginBottom: 3 }, children: "BITTE VERMEIDEN" }),
              /* @__PURE__ */ jsx(Text, { style: styles.body, children: texts.bedienungsanleitung.vermeide })
            ] })
          ] }),
          /* @__PURE__ */ jsx(PageFooter, { pageNum: 9, productName })
        ] }),
        productTier >= 2 && texts.naechste_30_tage && texts.naechste_30_tage.length > 0 && /* @__PURE__ */ jsxs(Page, { size: "A4", style: styles.page, children: [
          /* @__PURE__ */ jsx(Text, { style: styles.kicker, children: "07 \u2014 Die N\xE4chsten 30 Tage" }),
          /* @__PURE__ */ jsxs(Text, { style: styles.h1, children: [
            "Konkrete Schritte,",
            "\n",
            "kein Warten."
          ] }),
          /* @__PURE__ */ jsx(View, { style: styles.dividerGold }),
          /* @__PURE__ */ jsx(View, { style: { marginTop: 16 }, children: texts.naechste_30_tage.map((step, i) => /* @__PURE__ */ jsxs(View, { style: styles.moduleCard, children: [
            /* @__PURE__ */ jsx(View, { style: styles.moduleHeader, children: /* @__PURE__ */ jsx(Text, { style: { ...styles.moduleCode, fontFamily: PDF_DISPLAY, fontSize: 20, color: COLORS.gold, letterSpacing: 0 }, children: String(i + 1).padStart(2, "0") }) }),
            /* @__PURE__ */ jsx(Text, { style: styles.body, children: step })
          ] }, i)) }),
          /* @__PURE__ */ jsx(PageFooter, { pageNum: 10, productName })
        ] }),
        productTier >= 2 && texts.entwicklungsprogramm && /* @__PURE__ */ jsxs(Page, { size: "A4", style: styles.page, children: [
          /* @__PURE__ */ jsx(Text, { style: styles.kicker, children: "08 \u2014 Entwicklungsprogramm" }),
          /* @__PURE__ */ jsxs(Text, { style: styles.h1, children: [
            "Was du konkret",
            "\n",
            "entwickeln kannst."
          ] }),
          /* @__PURE__ */ jsx(View, { style: styles.dividerGold }),
          texts.entwicklungsprogramm.kernfokus ? /* @__PURE__ */ jsx(Text, { style: styles.body, children: texts.entwicklungsprogramm.kernfokus }) : null,
          texts.entwicklungsprogramm.vierzehn_tage && texts.entwicklungsprogramm.vierzehn_tage.length > 0 && /* @__PURE__ */ jsxs(View, { children: [
            /* @__PURE__ */ jsx(Text, { style: styles.h2, children: "14 Tage \u2014 Sofort" }),
            texts.entwicklungsprogramm.vierzehn_tage.map((s, i) => /* @__PURE__ */ jsx(Bullet, { children: s }, `v${i}`))
          ] }),
          texts.entwicklungsprogramm.dreissig_tage && texts.entwicklungsprogramm.dreissig_tage.length > 0 && /* @__PURE__ */ jsxs(View, { children: [
            /* @__PURE__ */ jsx(Text, { style: styles.h2, children: "30 Tage \u2014 Routinen" }),
            texts.entwicklungsprogramm.dreissig_tage.map((s, i) => /* @__PURE__ */ jsx(Bullet, { children: s }, `d${i}`))
          ] }),
          texts.entwicklungsprogramm.neunzig_tage && texts.entwicklungsprogramm.neunzig_tage.length > 0 && /* @__PURE__ */ jsxs(View, { children: [
            /* @__PURE__ */ jsx(Text, { style: styles.h2, children: "90 Tage \u2014 Struktur" }),
            texts.entwicklungsprogramm.neunzig_tage.map((s, i) => /* @__PURE__ */ jsx(Bullet, { children: s }, `n${i}`))
          ] }),
          texts.entwicklungsprogramm.wissenschaftlicher_hinweis ? /* @__PURE__ */ jsxs(View, { style: styles.calloutGold, children: [
            /* @__PURE__ */ jsx(Text, { style: styles.calloutLabel, children: "EINORDNUNG" }),
            /* @__PURE__ */ jsx(Text, { style: styles.bodyMuted, children: texts.entwicklungsprogramm.wissenschaftlicher_hinweis })
          ] }) : null,
          /* @__PURE__ */ jsx(PageFooter, { pageNum: 11, productName })
        ] }),
        /* @__PURE__ */ jsx(Page, { size: "A4", style: styles.pageDark, children: /* @__PURE__ */ jsxs(View, { style: { flex: 1, padding: 60, justifyContent: "space-between" }, children: [
          /* @__PURE__ */ jsx(Text, { style: { ...styles.coverLogo, color: COLORS.bone }, children: "HUMATRIX" }),
          /* @__PURE__ */ jsxs(View, { children: [
            /* @__PURE__ */ jsx(Text, { style: { ...styles.kickerDark, marginBottom: 20 }, children: "Ende des Berichts" }),
            /* @__PURE__ */ jsxs(Text, { style: { ...styles.coverTitle, fontSize: 36, lineHeight: 1.05 }, children: [
              "Ein Profil",
              "\n",
              /* @__PURE__ */ jsx(Text, { style: styles.coverTitleGold, children: "ist der Anfang." }),
              "\n",
              "Nicht das Ziel."
            ] }),
            /* @__PURE__ */ jsx(Text, { style: { ...styles.coverSubtitle, maxWidth: "75%", marginTop: 20, color: COLORS.bone, opacity: 0.8 }, children: "Wenn du mit deinem Team den n\xE4chsten Schritt gehen willst \u2014 wir haben daf\xFCr das 360\xB0 Spiegel, den TeamCheck und die Saisonbegleitung." })
          ] }),
          /* @__PURE__ */ jsxs(View, { style: { flexDirection: "column", gap: 4 }, children: [
            /* @__PURE__ */ jsx(Text, { style: { fontSize: 7.5, color: COLORS.muted, letterSpacing: 1.5, textTransform: "uppercase" }, children: "\xA9 Humatrix \xB7 The Mind Club Company" }),
            /* @__PURE__ */ jsx(Text, { style: { fontSize: 7.5, color: COLORS.muted, letterSpacing: 1.5, textTransform: "uppercase" }, children: "Made in Tyrol, Austria \xB7 coachcheck.humatrix.cc" })
          ] })
        ] }) })
      ]
    }
  );
}

// lib/pdf/sample-report-data.ts
var SAMPLE_AXIS_SCORES = {
  struktur_intuition: 0.78,
  autoritaet_beteiligung: 0.64,
  leistung_beziehung: 0.69,
  stabilisierung_aktivierung: 0.41,
  reflexion_direktheit: 0.58,
  standardisierung_anpassung: 0.72
};
var SAMPLE_MATURITY_SCORES = {
  selbstregulation: 0.66,
  perspektivflexibilitaet: 0.48,
  konfliktreife: 0.57,
  druckreife: 0.61,
  verantwortungsklarheit: 0.74,
  integrationsfaehigkeit: 0.52
};
var SAMPLE_PRIMARY = {
  name_de: "Der Strukturgeber",
  short_trait: "Struktur \xB7 Klarheit \xB7 Verl\xE4sslichkeit",
  kernmuster: "Du f\xFChrst \xFCber Ordnung und Berechenbarkeit. Deine Mannschaft wei\xDF, woran sie bei dir ist \u2014 Klarheit ist dein wichtigstes Werkzeug.",
  staerken: [
    "Gibt der Mannschaft auch in unruhigen Phasen verl\xE4ssliche Orientierung",
    "Bereitet Trainingswochen durchdacht und nachvollziehbar vor",
    "Trifft Entscheidungen klar und steht f\xFCr sie ein"
  ],
  risiken: [
    "Kann unter Druck dazu neigen, die Z\xFCgel enger zu ziehen statt loszulassen",
    "Struktur wird von einem Teil der Spieler mitunter als Kontrolle erlebt",
    "L\xE4sst wenig Raum f\xFCr spontane, spielerische L\xF6sungen"
  ],
  entwicklungshebel: [
    "Beteiligung gezielt dosieren, ohne die eigene Klarheit aufzugeben",
    "In Drucksituationen bewusst einen Moment Ruhe vor die n\xE4chste Ansage setzen",
    "Unterschiedliche Spielertypen unterschiedlich ansprechen"
  ]
};
var SAMPLE_SECONDARY = {
  name_de: "Der Leistungsarchitekt",
  short_trait: "Anspruch \xB7 Fokus \xB7 Wettkampf"
};
var SAMPLE_REPORT = {
  executive_summary: "Stefan, dein Profil tr\xE4gt eine klare Handschrift: Du f\xFChrst \xFCber Struktur, Klarheit und Verl\xE4sslichkeit \u2014 und genau das gibt deiner Mannschaft Halt. Die markanteste Spannung liegt zwischen deinem hohen Bed\xFCrfnis nach Ordnung und der Beteiligung, die ein Teil deiner Spieler braucht, um wirklich Verantwortung zu \xFCbernehmen. Beim Stand von 0:1 zur Halbzeit ist deine St\xE4rke sp\xFCrbar: Du wirst nicht laut, du wirst pr\xE4zise. Die Coaching-Frage ist, wo dieselbe Pr\xE4zision unter Dauerdruck in Enge umschl\xE4gt.",
  archetyp_interpretation: "Dein Antwortprofil zeigt deutlich die Muster des Strukturgebers: Du baust F\xFChrung auf Berechenbarkeit auf. Bei einem Wert von 78 % auf der Achse Struktur\u2013Intuition arbeitest du planvoll, nicht aus dem Bauch heraus \u2014 deine Trainingswoche hat einen roten Faden, den deine Spieler kennen. Kombiniert mit einer ausgepr\xE4gten Leistungsorientierung (69 %) entsteht ein Trainertyp, der Standards setzt und konsequent einfordert. Das ist eine Coaching-Hypothese f\xFCr dein eigenes Nachdenken, keine Diagnose: Sie beschreibt, wie dein Stil typischerweise wirkt \u2014 und macht sichtbar, wo er tr\xE4gt und wo er an seine Grenzen kommt.",
  signature_narrative: "Liest man deine sechs Achsen als ein Bild, ergibt sich die Signatur eines ruhigen Ordnungsgebers mit hohem Anspruch. Struktur und Standardisierung tragen dein F\xFChrungsverhalten, deine Klarheit ist das Gel\xE4nder, an dem sich die Mannschaft festh\xE4lt. Auf der Achse Stabilisierung\u2013Aktivierung liegst du eher im stabilisierenden Bereich (41 %) \u2014 du beruhigst Systeme, statt sie aufzuladen. Das passt zu deinem Muster: Du gibst Sicherheit. Die Reflexionsachse (58 %) zeigt, dass du Entscheidungen durchdenkst, bevor du sie aussprichst. Im Trainingsalltag, am Spieltag und unter Druck wirkt diese Signatur jeweils etwas anders \u2014 und genau diese Unterschiede sind dein Entwicklungshebel.",
  druckprofil: "Unter Druck verst\xE4rkt sich bei deinem Profil die Ordnung. Wo andere lauter werden, wirst du kontrollierter \u2014 du greifst zur Struktur als Sicherheitsanker. Das ist in vielen Momenten ein Vorteil: Wenn ein Stammspieler nach einem Fehler den Kopf h\xE4ngen l\xE4sst, hilft deine ruhige Klarheit. Die Risikozone liegt dort, wo Unsicherheit l\xE4nger anh\xE4lt. Dann kann aus Klarheit Enge werden: mehr Vorgaben, weniger Spielraum, ein Team, das auf Ansagen wartet, statt selbst L\xF6sungen zu suchen. Der Hebel ist, in genau diesen Phasen bewusst eine Sekunde Ruhe vor die n\xE4chste Anweisung zu setzen \u2014 und zu pr\xFCfen, ob das Team gerade F\xFChrung oder Vertrauen braucht.",
  modul_interpretationen: {
    A: "Deine F\xFChrungsidentit\xE4t ist klar konturiert: Du wei\xDFt, wof\xFCr du stehst, und das sp\xFCrt die Mannschaft. Diese Stabilit\xE4t ist ein echtes Pfund. Achte darauf, dass aus einem klaren Selbstbild keine Unbeweglichkeit wird \u2014 die st\xE4rksten Trainer halten ihre Identit\xE4t und bleiben trotzdem lernoffen f\xFCr R\xFCckmeldungen aus dem Team.",
    B: "In der Kommunikation \xFCberzeugst du durch Verst\xE4ndlichkeit und Verl\xE4sslichkeit. Deine Ansagen sitzen. Im Einzelgespr\xE4ch erreichst du oft mehr Tiefe als vor der ganzen Gruppe. Der Entwicklungsraum liegt in der Bandbreite: Nicht jeder Spieler braucht dieselbe Tonlage \u2014 die Kunst ist, dieselbe Botschaft f\xFCr unterschiedliche Typen unterschiedlich zu rahmen.",
    C: "Entscheidungen triffst du klar und stehst daf\xFCr ein \u2014 eine deiner gr\xF6\xDFten St\xE4rken. Verantwortung ist bei dir sauber verortet. Die Spieler wissen, dass am Ende du entscheidest. Pr\xFCfe gelegentlich, an welchen Stellen geteilte Verantwortung das Team reifen lie\xDFe, ohne dass du deine Linie verlierst.",
    D: "Deine Fehlerkultur ist sachlich und l\xF6sungsorientiert. Du analysierst statt zu beschuldigen. Damit Fehler zu echtem Lernen werden, lohnt es sich, neben der Analyse auch sichtbar zu machen, dass ein Fehler okay war \u2014 gerade j\xFCngere Spieler trauen sich dann mehr zu.",
    E: "Unter Druck bleibst du bei dir und verlierst selten die Fassung \u2014 das ist im Profibereich Gold wert. Deine Mannschaft liest deine Ruhe als Sicherheit. Die Wachstumskante: Ruhe nicht mit R\xFCckzug zu verwechseln. In der Schlussphase eines engen Spiels braucht das Team manchmal nicht nur deine Gelassenheit, sondern auch deine sp\xFCrbare Energie.",
    F: "Du motivierst \xFCber Anspruch und Verl\xE4sslichkeit, weniger \xFCber emotionale Aufladung. Das wirkt nachhaltig und unaufgeregt. F\xFCr Spieler, die \xFCber Begeisterung z\xFCnden, kann es hilfreich sein, deinen Anspruch hin und wieder sichtbar mit Anerkennung zu verbinden \u2014 Lob, das konkret ist, wirkt bei deinem Stil besonders glaubw\xFCrdig.",
    G: "Beziehung baust du \xFCber Verl\xE4sslichkeit auf, nicht \xFCber N\xE4he um jeden Preis \u2014 die Mannschaft kann sich auf dich verlassen. Das schafft Vertrauen mit Substanz. Der n\xE4chste Schritt liegt darin, gezielt einzelne Beziehungen zu vertiefen, gerade zu Spielern, die du strukturell schwerer erreichst."
  },
  hauptrisiken: "Drei Wirkungsgrenzen sind in deinem Profil angelegt. Erstens die \xDCbersteuerung unter Druck: Wenn Unsicherheit steigt, kann deine Struktur in Kontrolle kippen und Eigeninitiative im Team d\xE4mpfen. Zweitens die Anschlussf\xE4higkeit: Ein Teil der Spieler erlebt deine Klarheit als Orientierung, ein anderer als Distanz \u2014 derselbe Stil, zwei Wirkungen. Drittens die Aktivierung: In Phasen, in denen das Team Energie und Aufbruch braucht, ist dein stabilisierender Zug eher bremsend. Keine dieser Grenzen ist ein Defizit \u2014 entscheidend ist, dass du die Bedingungen kennst, unter denen sie auftreten.",
  entwicklungspfad: 'Der gr\xF6\xDFte Hebel liegt nicht in \u201Emehr Struktur", sondern in dosierter \xD6ffnung. Du musst deine Klarheit nicht aufgeben \u2014 du kannst sie gezielter einsetzen. Konkret: W\xE4hle bewusst Situationen, in denen du Verantwortung ans Team abgibst, etwa eine von der Mannschaft selbst moderierte Videoanalyse pro Woche. Beobachte, was passiert, wenn du einen Schritt zur\xFCcktrittst. Beginne mit einer konkreten Szene der letzten Wochen, in der deine Wirkung nicht so war, wie du sie dir gew\xFCnscht hast, und leite daraus einen kleinen, beobachtbaren Schritt ab.',
  gespraechsleitfaden: [
    "In welchen Situationen erlebst du deine Klarheit als St\xE4rke \u2014 und wann beginnt sie, dich oder das Team einzuengen?",
    "Welche Spieler erreichst du mit deinem Stil gut, welche weniger gut \u2014 und woran machst du das fest?",
    "Wo k\xF6nntest du Verantwortung abgeben, ohne deine Linie zu verlieren?",
    "Was br\xE4uchte dein Team in der Schlussphase eines engen Spiels von dir \u2014 Ruhe oder Energie?",
    "Wann hast du zuletzt einen Fehler im Team sichtbar als okay markiert, statt ihn nur zu analysieren?"
  ],
  naechste_30_tage: [
    "Eine konkrete Situation der letzten Wochen notieren, in der deine Klarheit klar positiv gewirkt hat.",
    "Eine Trainingseinheit pro Woche teilweise vom Team moderieren lassen und beobachten, was entsteht.",
    "In der n\xE4chsten engen Schlussphase bewusst zwischen Ruhe und sp\xFCrbarer Energie w\xE4hlen.",
    "Ein Einzelgespr\xE4ch mit einem Spieler f\xFChren, den du strukturell schwerer erreichst."
  ],
  entwicklungsprogramm: {
    kernfokus: "Zwei Felder haben f\xFCr dich den gr\xF6\xDFten Hebel. Erstens die dosierte Beteiligung: Deine Klarheit ist gesetzt \u2014 der Wachstumsraum liegt darin, an ausgew\xE4hlten Stellen Verantwortung abzugeben, damit dein Team reift, ohne dass du deine Linie verlierst. Zweitens die situative Aktivierung: In Phasen, die Aufbruch brauchen, lohnt es sich, deinen stabilisierenden Grundzug bewusst um einen aktivierenden Impuls zu erg\xE4nzen. Beide Felder zielen nicht darauf, dich zu ver\xE4ndern, sondern dein vorhandenes Repertoire breiter und situativer einzusetzen.",
    vierzehn_tage: [
      "Vor jeder Ansage in einer Drucksituation bewusst einen Atemzug Pause setzen und pr\xFCfen, ob das Team gerade F\xFChrung oder Vertrauen braucht.",
      "Eine konkrete Trainingsentscheidung pro Woche gemeinsam mit zwei F\xFChrungsspielern abstimmen."
    ],
    dreissig_tage: [
      "Eine wiederkehrende, vom Team selbst moderierte Kurz-Analyse etablieren (10 Minuten nach dem Spiel).",
      "Anerkennung gezielt und konkret aussprechen \u2014 mindestens ein benanntes Lob pro Trainingstag."
    ],
    neunzig_tage: [
      "Mit dem Trainerteam ein einfaches Bild davon entwickeln, welche Spielertypen ihr wie ansprecht, und es regelm\xE4\xDFig nachsch\xE4rfen."
    ],
    wissenschaftlicher_hinweis: "Diese Bausteine sind theoriegeleitete Coaching-Hypothesen auf Basis evidenzbasierter Methodik der F\xFChrungs- und Sportpsychologie \u2014 keine Diagnose und keine Erfolgszusage, sondern Anregungen f\xFCr deine Praxis."
  },
  coach_signature_portrait: "Dieses Profil vereint hohe Struktur, klare F\xFChrungsintention und einen ausgepr\xE4gten Anspruch an Verl\xE4sslichkeit. Stefan f\xFChrt nicht \xFCber Lautst\xE4rke, sondern \xFCber Ordnung: Die Mannschaft wei\xDF, woran sie ist, und das schafft eine ruhige Form von Autorit\xE4t. Die St\xE4rke liegt in Orientierung, Berechenbarkeit und Standardsicherheit \u2014 gerade in unruhigen Phasen wird dieser Trainer zum Fixpunkt. Kritisch wird das Profil dort, wo Unsicherheit l\xE4nger anh\xE4lt und Struktur zunehmend als Kontrolle erlebt wird. Dann besteht die Gefahr, dass das Team in eine abwartende Haltung rutscht und auf Ansagen wartet, statt selbst zu gestalten. Die eigentliche Entwicklungsaufgabe ist deshalb kein Mehr an F\xFChrung, sondern ein situativeres Dosieren: zu wissen, wann Klarheit tr\xE4gt und wann Beteiligung mehr Wirkung entfaltet. Wer diese Balance findet, verbindet die Verl\xE4sslichkeit des Strukturgebers mit der Lebendigkeit eines Teams, das Verantwortung \xFCbernimmt.",
  paradoxien: [
    "Hohe Klarheit, aber an manchen Stellen begrenzte Anschlussf\xE4higkeit",
    "Starke Verl\xE4sslichkeit, aber wenig Raum f\xFCr spontane L\xF6sungen",
    "Ruhe unter Druck, die gelegentlich als Distanz statt als Sicherheit ankommt"
  ],
  shadow_pattern: "Das Schattenmuster dieses Profils liegt nicht in mangelnder F\xFChrung, sondern in der Tendenz zur Verengung unter steigender Unsicherheit. Was im Alltag als Struktur tr\xE4gt, kann unter Dauerdruck als erh\xF6hte Kontrolle erlebt werden: mehr Vorgaben, engere F\xFChrung, weniger Eigeninitiative. Das Team reagiert dann oft mit Abwarten \u2014 was die Unsicherheit des Trainers best\xE4tigt und die Kontrolle weiter verst\xE4rkt. Den Kreislauf durchbricht bewusste, dosierte Beteiligung genau in den Momenten, in denen der Reflex zur Verengung am st\xE4rksten ist.",
  wirkung_je_kontext: {
    trainingsalltag: "In der Routine wirkt dieser Trainer als verl\xE4sslicher Taktgeber. Die Spieler sch\xE4tzen die klare Struktur und wissen, was sie erwartet \u2014 das schafft Konzentration und Ruhe in der Wochenarbeit.",
    spieltag: "Am Spieltag \xFCbertr\xE4gt sich die Ruhe als Sicherheit. Klare Matchpl\xE4ne geben Orientierung. Der Wachstumsraum: in entscheidenden Momenten auch sp\xFCrbar Energie freizusetzen, nicht nur Ordnung zu halten.",
    niederlage: "Nach einer Niederlage analysiert dieser Trainer sachlich statt emotional \u2014 das verhindert Schuldzuweisungen. Wichtig ist, neben der Analyse auch den emotionalen Moment der Mannschaft aufzufangen.",
    konflikt: "In Konflikten bleibt er fair und faktenorientiert. Er sucht die saubere L\xF6sung. Bei aufgeladenen Spannungen hilft es, fr\xFCher das pers\xF6nliche Gespr\xE4ch zu suchen, bevor sich Positionen verh\xE4rten.",
    krise: "In akuten Krisenphasen ist die Stabilit\xE4t dieses Trainers ein Anker. Die Gefahr liegt darin, zu lange auf Kontrolle zu setzen, wo das Team einen aktivierenden, neuen Impuls br\xE4uchte."
  },
  fuehrungsreife_interpretation: "Diese sechs Entwicklungsindikatoren sind ein Reflexionsraster aus deinen Antworten \u2014 kein normiertes Reifema\xDF, sondern Hinweise, wo genaueres Hinsehen lohnt. Deutlich ausgepr\xE4gt zeigt sich die Verantwortungsklarheit: Du wei\xDFt, wof\xFCr du stehst, und triffst Entscheidungen ohne Schlingern. Auch Selbstregulation und Druckreife liegen im oberen Bereich und deuten an, dass dich enge Phasen verl\xE4sslich tragen. Im mittleren Bereich liegt die Perspektivflexibilit\xE4t \u2014 die F\xE4higkeit, bewusst die Sicht deiner Spieler einzunehmen und deinen Stil daran anzupassen. Lies das als Ansto\xDF, nicht als Urteil: Genau dort k\xF6nnte ein Hebel liegen, um deine F\xFChrung anschlussf\xE4higer zu machen.",
  no_go_warnungen: [
    "Nicht noch mehr Kontrolle erh\xF6hen, wenn die Unsicherheit im Team steigt \u2014 das verst\xE4rkt die Abwartehaltung.",
    "Keine pauschale Kritik im Kollektiv aussprechen; was sachlich gemeint ist, wirkt vor der Gruppe schnell hart.",
    "Ruhe in der Schlussphase nicht mit R\xFCckzug verwechseln \u2014 bleib f\xFCr das Team sichtbar pr\xE4sent.",
    "Nicht jeden Spieler mit derselben Tonlage ansprechen, nur weil sie bei den meisten funktioniert."
  ],
  spielerbedarf: "Spieler brauchen von diesem Stil vor allem zwei Dinge, damit er voll anschlussf\xE4hig wird. Erstens sp\xFCrbare Anerkennung: Weil Lob bei einem so klaren, anspruchsvollen Trainer als besonders glaubw\xFCrdig erlebt wird, wirkt konkretes, benanntes Lob stark \u2014 es muss nur sichtbar gemacht werden. Zweitens dosierte Mitgestaltung: Gerade reifere und ehrgeizige Spieler wollen Verantwortung \xFCbernehmen. Wenn dieser Trainer ihnen klar umrissene R\xE4ume daf\xFCr \xF6ffnet, ohne die Gesamtlinie aufzugeben, verwandelt sich die anf\xE4ngliche Abwartehaltung in echte Eigeninitiative \u2014 und die Struktur des Trainers wird vom Korsett zum Fundament.",
  beratungswuerdigkeit: "mittel",
  fuehrungsenergie: "ordnend und stabilisierend",
  saisonphase_interpretation: "In der aktuellen Saisonphase wirkt dieser Stil grunds\xE4tzlich g\xFCnstig: Struktur und Verl\xE4sslichkeit geben einer Mannschaft, die Ergebnisse liefern muss, einen klaren Rahmen. Der Vorteil ist Orientierung und Konstanz. Das Risiko liegt darin, dass eine zu enge F\xFChrung den n\xF6tigen Mut zu spielerischen L\xF6sungen bremst, wenn ein Spiel von einem mutigen Impuls statt von Disziplin entschieden wird. Die Phase belohnt es, die vorhandene Ordnung zu halten und sie punktuell um aktivierende Akzente zu erg\xE4nzen.",
  coach_to_team_fit: "Zu einem gemischt erfahrenen Team passt dieser Stil \xFCber weite Strecken gut: Die Erfahreneren sch\xE4tzen Klarheit und sauber verortete Verantwortung, die J\xFCngeren profitieren von der verl\xE4sslichen Struktur und den klaren Standards. Reibung entsteht dort, wo eigenst\xE4ndige, kreative Spielertypen mehr Gestaltungsraum suchen, als die Struktur zun\xE4chst hergibt. Funktionieren wird die Passung dann, wenn der Trainer diesen Typen gezielt umrissene Freir\xE4ume er\xF6ffnet \u2014 die Struktur bleibt Fundament, wird aber nicht zur Decke.",
  wirkung_je_spielertyp: [
    {
      spielertyp: "Der selbstbewusste Leistungstr\xE4ger",
      wirkung: "Deine Klarheit und dein Anspruch geben ihm Orientierung und fordern ihn. Bei zu enger Vorgabe kann er sich aber kontrolliert f\xFChlen und beginnt, gegen die Linie zu arbeiten statt mit ihr.",
      anpassung: "Gib ihm echte Verantwortung in einem klaren Rahmen und fordere seinen Vorschlag ein, bevor du die L\xF6sung vorgibst."
    },
    {
      spielertyp: "Der unsichere, zur\xFCckhaltende Spieler",
      wirkung: "Deine Verl\xE4sslichkeit gibt ihm Halt. Deine Direktheit meinst du als Klarheit \u2014 er erlebt sie unter Druck jedoch leicht als pers\xF6nliche Kritik und macht sich kleiner.",
      anpassung: "Kritische R\xFCckmeldung zuerst kurz unter vier Augen geben und immer mit einer konkreten n\xE4chsten Handlung verbinden."
    },
    {
      spielertyp: "Der kreative Eigenst\xE4ndige",
      wirkung: "Deine Struktur gibt ihm Sicherheit, kann ihm aber den Gestaltungsraum nehmen, den er zum Aufbl\xFChen braucht. Aus Klarheit wird f\xFCr ihn schnell Enge.",
      anpassung: "Er\xF6ffne ihm klar umrissene Freir\xE4ume: die Struktur bleibt Fundament, wird aber nicht zur Decke."
    },
    {
      spielertyp: "Der junge Entwicklungsspieler",
      wirkung: "Deine verl\xE4ssliche Struktur und die klaren Standards geben ihm genau die Orientierung, die er in dieser Phase braucht. Tempo und H\xE4rte k\xF6nnen ihn allerdings \xFCberfordern.",
      anpassung: 'Erkl\xE4re \xF6fter das \u201EWarum" hinter deinen Entscheidungen \u2014 Verstehen baut bei ihm Sicherheit auf.'
    }
  ],
  bedienungsanleitung: {
    ueberschrift: "Der Strukturgeber",
    kernsatz: "Du f\xFChrst \xFCber Berechenbarkeit, klare Standards und konsequente Verl\xE4sslichkeit \u2014 Orientierung ist deine st\xE4rkste W\xE4hrung.",
    staerken: ["Klarheit", "Verl\xE4sslichkeit", "Standardsicherheit"],
    unterDruck: "Unter Druck ziehst du die Z\xFCgel enger \u2014 was sonst Struktur ist, kann dann als Kontrolle ankommen.",
    soErreichstDuMich: "\xDCber sichtbaren Fortschritt, klare Ziele und ehrliches, konkretes Feedback. Allgemeines Lob tr\xE4gt bei dir wenig.",
    soGibstDuFeedback: "Sachlich, vorbereitet und mit konkretem Bezug \u2014 kein vages Andeuten, sondern Beispiel und n\xE4chster Schritt.",
    vermeide: "Unklare Vorgaben, st\xE4ndig wechselnde Ziele und R\xFCckmeldungen ohne konkreten Bezug."
  }
};
var SAMPLE_META = {
  traineeName: "Stefan Berger",
  sport: "Fu\xDFball",
  productName: "Selbsttest",
  productTier: 2
};
export {
  ReportDocument,
  SAMPLE_AXIS_SCORES,
  SAMPLE_MATURITY_SCORES,
  SAMPLE_META,
  SAMPLE_PRIMARY,
  SAMPLE_REPORT,
  SAMPLE_SECONDARY
};
