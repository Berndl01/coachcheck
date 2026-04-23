'use client';

import { useState } from 'react';

type Props = {
  assessmentId: string;
  initialContext?: {
    seasonPhase?: string | null;
    teamMaturity?: string | null;
    conflictState?: string | null;
    ageRange?: string | null;
    notes?: string | null;
  };
};

const SEASON_PHASES = [
  { key: 'vorbereitung', label: 'Saisonvorbereitung' },
  { key: 'fruehe_saison', label: 'Frühe Saison' },
  { key: 'erfolgslauf', label: 'Erfolgslauf' },
  { key: 'formkrise', label: 'Formkrise' },
  { key: 'kaderumbruch', label: 'Kaderumbruch' },
  { key: 'trainerwechsel', label: 'Trainerwechsel-Übergabe' },
  { key: 'saisonendphase', label: 'Saisonendphase' },
  { key: 'aufstiegsdruck', label: 'Aufstiegsdruck' },
  { key: 'abstiegsdruck', label: 'Abstiegsdruck' },
];

const TEAM_MATURITIES = [
  { key: 'jung_unerfahren', label: 'Jung & unerfahren' },
  { key: 'gemischt', label: 'Gemischt' },
  { key: 'reif_etabliert', label: 'Reif & etabliert' },
  { key: 'umbruch', label: 'Im Umbruch' },
];

const CONFLICT_STATES = [
  { key: 'stabil', label: 'Stabil' },
  { key: 'leichte_spannungen', label: 'Leichte Spannungen' },
  { key: 'spuerbare_spannungen', label: 'Spürbare Spannungen' },
  { key: 'akuter_konflikt', label: 'Akuter Konflikt' },
];

export function ContextForm({ assessmentId, initialContext }: Props) {
  const [seasonPhase, setSeasonPhase] = useState(initialContext?.seasonPhase ?? '');
  const [teamMaturity, setTeamMaturity] = useState(initialContext?.teamMaturity ?? '');
  const [conflictState, setConflictState] = useState(initialContext?.conflictState ?? '');
  const [ageRange, setAgeRange] = useState(initialContext?.ageRange ?? '');
  const [notes, setNotes] = useState(initialContext?.notes ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/assessment/${assessmentId}/context`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seasonPhase: seasonPhase || null,
          teamMaturity: teamMaturity || null,
          conflictState: conflictState || null,
          ageRange: ageRange || null,
          notes: notes || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Fehler');
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-bone-soft p-6 rounded-md border border-bone-line">
      <div className="font-mono text-xs uppercase tracking-[0.18em] text-gold-deep mb-2">
        Premium · Kontext für Interpretation
      </div>
      <h3 className="font-display text-2xl tracking-[-0.02em] mb-2">
        Wo stehst du <em className="font-editorial">gerade?</em>
      </h3>
      <p className="text-muted text-sm mb-6 max-w-[55ch] leading-[1.5]">
        Derselbe Führungsstil wirkt in unterschiedlichen Phasen ganz anders.
        Wenn du uns den aktuellen Kontext mitgibst, schärft der Report seine Interpretation konkret auf deine Situation.
      </p>

      <div className="grid gap-4">
        <div>
          <label className="block font-mono text-xs uppercase tracking-[0.1em] text-muted mb-2">Saisonphase</label>
          <div className="grid grid-cols-3 sm:grid-cols-3 gap-1.5">
            {SEASON_PHASES.map((p) => (
              <button
                key={p.key}
                onClick={() => setSeasonPhase(p.key === seasonPhase ? '' : p.key)}
                className={`px-3 py-2 rounded text-xs font-mono uppercase tracking-[0.05em] border transition ${
                  seasonPhase === p.key
                    ? 'bg-ink text-bone border-ink'
                    : 'bg-bone border-bone-line text-muted hover:border-gold'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block font-mono text-xs uppercase tracking-[0.1em] text-muted mb-2">Team-Reife</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {TEAM_MATURITIES.map((m) => (
              <button
                key={m.key}
                onClick={() => setTeamMaturity(m.key === teamMaturity ? '' : m.key)}
                className={`px-3 py-2 rounded text-xs font-mono uppercase tracking-[0.05em] border transition ${
                  teamMaturity === m.key
                    ? 'bg-ink text-bone border-ink'
                    : 'bg-bone border-bone-line text-muted hover:border-gold'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block font-mono text-xs uppercase tracking-[0.1em] text-muted mb-2">Konfliktlage</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {CONFLICT_STATES.map((c) => (
              <button
                key={c.key}
                onClick={() => setConflictState(c.key === conflictState ? '' : c.key)}
                className={`px-3 py-2 rounded text-xs font-mono uppercase tracking-[0.05em] border transition ${
                  conflictState === c.key
                    ? 'bg-ink text-bone border-ink'
                    : 'bg-bone border-bone-line text-muted hover:border-gold'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-mono text-xs uppercase tracking-[0.1em] text-muted mb-2">Altersstruktur (optional)</label>
            <input
              type="text" value={ageRange} onChange={(e) => setAgeRange(e.target.value)}
              placeholder="z.B. 18-35 Jahre"
              className="w-full px-4 py-2 bg-bone border border-bone-line rounded-md text-ink focus:border-gold focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block font-mono text-xs uppercase tracking-[0.1em] text-muted mb-2">Kurze Notiz (optional)</label>
          <textarea
            value={notes} onChange={(e) => setNotes(e.target.value)}
            placeholder="z.B. 'Kaderumbruch nach Abstieg, zwei Leistungsträger abgegeben'"
            rows={2}
            className="w-full px-4 py-2 bg-bone border border-bone-line rounded-md text-ink focus:border-gold focus:outline-none text-sm"
          />
        </div>

        {error && <div className="text-red-600 text-sm font-mono">{error}</div>}

        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gold text-ink rounded-full font-semibold hover:bg-ink hover:text-gold disabled:opacity-50 transition text-sm"
          >
            {saving ? 'Speichert …' : saved ? '✓ Gespeichert' : 'Kontext speichern'}
          </button>
          <span className="text-xs text-muted">
            Wirkt beim nächsten Report-Generieren.
          </span>
        </div>
      </div>
    </div>
  );
}
