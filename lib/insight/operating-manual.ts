import type { AxisScores } from '@/lib/scoring';

/**
 * Gemeinsame, DETERMINISTISCHE Ableitung von
 *   (a) Bedienungsanleitung ("so arbeitest du mit mir") und
 *   (b) Wirkung-je-Spielertyp-Matrix
 * aus Archetyp + Achsenwerten.
 *
 * Eine Quelle für: Report-Fallback (lib/ai/report-prompt), PDF (lib/pdf),
 * Ergebnisseite und die öffentliche Ergebniskarte (/karte/[token]). So sind
 * diese Inhalte IMMER vorhanden — auch ohne KI-Report — und überall identisch.
 *
 * Ton: Coaching-Hypothese, keine Diagnose. Stärke mit Schatten, ohne Schönfärberei.
 */

export type ArchetypeLike = {
  name_de: string;
  short_trait: string;
  kernmuster: string;
  staerken: string[];
  risiken: string[];
  entwicklungshebel: string[];
};

export type OperatingManual = {
  ueberschrift: string;        // Archetyp-Name
  kernsatz: string;            // Wiedererkennungssatz
  staerken: string[];          // bis zu 3 Kernstärken
  unterDruck: string;          // Einzeiler: wie der Stil unter Druck kippt
  soErreichstDuMich: string;   // wie man diesen Trainer erreicht/motiviert
  soGibstDuFeedback: string;   // wie man IHM Feedback gibt
  vermeide: string;            // was man vermeiden sollte
};

export type PlayerTypeEffect = {
  spielertyp: string;          // z. B. "Der selbstbewusste Leistungsträger"
  wirkung: string;             // wie dieser Stil bei dem Typ ankommt
  anpassung: string;           // eine konkrete Anpassung
};

const v = (s: Partial<AxisScores> | null | undefined, k: keyof AxisScores): number =>
  typeof s?.[k] === 'number' ? (s[k] as number) : 50;

type Flags = {
  strukturiert: boolean;
  intuitiv: boolean;
  leistungsorientiert: boolean;
  beziehungsorientiert: boolean;
  autoritaer: boolean;
  beteiligend: boolean;
  stabilisierend: boolean;
  aktivierend: boolean;
  standardisiert: boolean;
};

function flags(s: Partial<AxisScores> | null | undefined): Flags {
  return {
    strukturiert: v(s, 'struktur_intuition') >= 55,
    intuitiv: v(s, 'struktur_intuition') <= 45,
    leistungsorientiert: v(s, 'leistung_beziehung') >= 55,
    beziehungsorientiert: v(s, 'leistung_beziehung') <= 45,
    autoritaer: v(s, 'autoritaet_beteiligung') >= 55,
    beteiligend: v(s, 'autoritaet_beteiligung') <= 45,
    stabilisierend: v(s, 'stabilisierung_aktivierung') >= 55,
    aktivierend: v(s, 'stabilisierung_aktivierung') <= 45,
    standardisiert: v(s, 'standardisierung_anpassung') >= 55,
  };
}

export function buildOperatingManual(
  a: ArchetypeLike,
  scores?: Partial<AxisScores> | null,
): OperatingManual {
  const f = flags(scores);
  const staerken = (a.staerken ?? []).slice(0, 3);

  const unterDruck = f.autoritaer || f.strukturiert
    ? 'Unter Druck ziehst du die Zügel enger — was sonst Struktur ist, kann dann als Kontrolle ankommen.'
    : f.beziehungsorientiert
      ? 'Unter Druck suchst du eher Ausgleich — klare Entscheidungen sprichst du dann manchmal später aus, als es hilft.'
      : f.aktivierend
        ? 'Unter Druck drehst du das Tempo hoch — Energie kann dann in Unruhe kippen.'
        : 'Unter Druck verstärkt sich dein dominanter Zug — achte darauf, welche Wirkung dein Team gerade wirklich braucht.';

  const soErreichstDuMich = f.leistungsorientiert
    ? 'Über sichtbaren Fortschritt, klare Ziele und ehrliches, konkretes Feedback. Allgemeines Lob trägt bei dir wenig.'
    : f.beziehungsorientiert
      ? 'Über Vertrauen, Verlässlichkeit und echtes Interesse an der Person hinter der Leistung.'
      : 'Über klare Erwartungen und Rückmeldungen, an denen du echten Fortschritt erkennst.';

  const soGibstDuFeedback = f.strukturiert || f.autoritaer
    ? 'Sachlich, vorbereitet und mit konkretem Bezug — keine vagen Andeutungen, sondern Beispiel und nächster Schritt.'
    : 'Ruhig, wertschätzend und unter vier Augen — mit klarem Anliegen statt zwischen den Zeilen.';

  const vermeide = f.autoritaer
    ? 'Lange, ziellose Diskussionen und das Gefühl, übergangen zu werden.'
    : f.beziehungsorientiert
      ? 'Harte öffentliche Konfrontation und Druck ohne erkennbaren Sinn.'
      : 'Unklare Vorgaben, ständig wechselnde Ziele und Rückmeldungen ohne konkreten Bezug.';

  return {
    ueberschrift: a.name_de,
    kernsatz: a.kernmuster,
    staerken,
    unterDruck,
    soErreichstDuMich,
    soGibstDuFeedback,
    vermeide,
  };
}

export function buildPlayerTypeMatrix(
  a: ArchetypeLike,
  scores?: Partial<AxisScores> | null,
): PlayerTypeEffect[] {
  const f = flags(scores);

  return [
    {
      spielertyp: 'Der selbstbewusste Leistungsträger',
      wirkung: f.autoritaer || f.strukturiert
        ? 'Deine Klarheit gibt ihm Orientierung — gleichzeitig kann er sich von zu viel Vorgabe eingeengt fühlen und gegensteuern.'
        : 'Er findet bei dir Raum und Vertrauen — achte darauf, dass deine Anforderungen klar genug bleiben, damit er Reibung zum Wachsen hat.',
      anpassung: 'Gib ihm echte Verantwortung und einen klaren Rahmen — fordere Mitdenken, bevor du die Lösung vorgibst.',
    },
    {
      spielertyp: 'Der unsichere, zurückhaltende Spieler',
      wirkung: f.autoritaer || f.leistungsorientiert
        ? 'Deine Direktheit meinst du als Klarheit — er erlebt sie unter Umständen als persönliche Kritik und zieht sich zurück.'
        : 'Deine Ruhe und Verlässlichkeit geben ihm Sicherheit — genau das braucht er, um sich etwas zuzutrauen.',
      anpassung: 'Kritik zuerst kurz unter vier Augen geben und immer mit einer konkreten nächsten Handlung verbinden.',
    },
    {
      spielertyp: 'Der kreative Eigenständige',
      wirkung: f.strukturiert || f.standardisiert
        ? 'Deine Struktur gibt Halt, kann ihm aber den Gestaltungsraum nehmen, den er zum Aufblühen braucht.'
        : 'Deine Offenheit passt gut zu ihm — achte darauf, dass aus Freiheit nicht Beliebigkeit wird.',
      anpassung: 'Eröffne ihm klar umrissene Freiräume: die Struktur bleibt Fundament, wird aber nicht zur Decke.',
    },
    {
      spielertyp: 'Der junge Entwicklungsspieler',
      wirkung: f.strukturiert
        ? 'Deine verlässliche Struktur und klaren Standards geben ihm genau die Orientierung, die er in dieser Phase braucht.'
        : 'Deine Nähe und Geduld helfen ihm — ergänze sie um klare, wiederkehrende Bezugspunkte, an denen er sich festhalten kann.',
      anpassung: 'Erkläre öfter das „Warum" hinter deinen Entscheidungen — Verstehen baut bei ihm Sicherheit auf.',
    },
  ];
}
