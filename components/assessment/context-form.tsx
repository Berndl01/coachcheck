'use client';

import { useState } from 'react';
import { useT } from '@/components/i18n/locale-provider';

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

export function ContextForm({ assessmentId, initialContext }: Props) {
  const t = useT();
  // Schlüssel (DB-Werte) bleiben stabil; nur Labels lokalisiert.
  const SEASON_PHASES = [
    { key: 'vorbereitung', label: t('contextForm.seasonVorbereitung') },
    { key: 'fruehe_saison', label: t('contextForm.seasonFruehe') },
    { key: 'erfolgslauf', label: t('contextForm.seasonErfolgslauf') },
    { key: 'formkrise', label: t('contextForm.seasonFormkrise') },
    { key: 'kaderumbruch', label: t('contextForm.seasonKaderumbruch') },
    { key: 'trainerwechsel', label: t('contextForm.seasonTrainerwechsel') },
    { key: 'saisonendphase', label: t('contextForm.seasonEndphase') },
    { key: 'aufstiegsdruck', label: t('contextForm.seasonAufstieg') },
    { key: 'abstiegsdruck', label: t('contextForm.seasonAbstieg') },
  ];
  const TEAM_MATURITIES = [
    { key: 'jung_unerfahren', label: t('contextForm.maturityJung') },
    { key: 'gemischt', label: t('contextForm.maturityGemischt') },
    { key: 'reif_etabliert', label: t('contextForm.maturityReif') },
    { key: 'umbruch', label: t('contextForm.maturityUmbruch') },
  ];
  const CONFLICT_STATES = [
    { key: 'stabil', label: t('contextForm.conflictStabil') },
    { key: 'leichte_spannungen', label: t('contextForm.conflictLeicht') },
    { key: 'spuerbare_spannungen', label: t('contextForm.conflictSpuerbar') },
    { key: 'akuter_konflikt', label: t('contextForm.conflictAkut') },
  ];

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
      if (!res.ok) throw new Error(data.error ?? t('contextForm.errGeneric'));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      const message = e instanceof Error ? e.message : t('contextForm.errGeneric');
      setError(message.includes('schema cache') || message.includes('context_') ? t('contextForm.errSchema') : message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-bone-soft p-6 rounded-md border border-bone-line">
      <div className="font-mono text-xs uppercase tracking-[0.18em] text-gold-deep mb-2">
        {t('contextForm.kicker')}
      </div>
      <h3 className="font-display text-2xl tracking-[-0.02em] mb-2">
        {t('contextForm.h1a')} <em className="font-editorial">{t('contextForm.h1emph')}</em>
      </h3>
      <div className="grid gap-3 mb-6 max-w-[68ch]">
        <p className="text-muted text-sm leading-[1.5]">
          {t('contextForm.intro1')}
        </p>
        <p className="text-muted text-sm leading-[1.5]">
          {t('contextForm.intro2')}
        </p>
      </div>

      <div className="grid gap-4">
        <div>
          <label className="block font-mono text-xs uppercase tracking-[0.1em] text-muted mb-2">{t('contextForm.seasonLabel')}</label>
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
          <label className="block font-mono text-xs uppercase tracking-[0.1em] text-muted mb-2">{t('contextForm.maturityLabel')}</label>
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
          <label className="block font-mono text-xs uppercase tracking-[0.1em] text-muted mb-2">{t('contextForm.conflictLabel')}</label>
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
            <label className="block font-mono text-xs uppercase tracking-[0.1em] text-muted mb-2">{t('contextForm.ageLabel')}</label>
            <input
              type="text" value={ageRange} onChange={(e) => setAgeRange(e.target.value)}
              placeholder={t('contextForm.agePlaceholder')}
              className="w-full px-4 py-2 bg-bone border border-bone-line rounded-md text-ink focus:border-gold focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block font-mono text-xs uppercase tracking-[0.1em] text-muted mb-2">{t('contextForm.notesLabel')}</label>
          <textarea
            value={notes} onChange={(e) => setNotes(e.target.value)}
            placeholder={t('contextForm.notesPlaceholder')}
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
            {saving ? t('contextForm.saving') : saved ? t('contextForm.saved') : t('contextForm.save')}
          </button>
          <span className="text-xs text-muted">
            {t('contextForm.hint')}
          </span>
        </div>
      </div>
    </div>
  );
}
