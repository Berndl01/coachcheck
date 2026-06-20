'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useT } from '@/components/i18n/locale-provider';

type Props = {
  initialProfile: {
    full_name?: string | null;
    sport?: string | null;
    club?: string | null;
    training_level?: string | null;
    age_group?: string | null;
    club_type?: string | null;
  };
};

export function ProfileSetupForm({ initialProfile }: Props) {
  const t = useT();
  const router = useRouter();

  // Schlüssel (training_level/age_group/club_type) sind DB-Werte und bleiben stabil;
  // nur die sichtbaren Labels werden übersetzt.
  const LEVELS = [
    { key: 'amateur_hobby', title: t('profileSetup.levelHobbyTitle'), desc: t('profileSetup.levelHobbyDesc') },
    { key: 'amateur_ambitioniert', title: t('profileSetup.levelAmbTitle'), desc: t('profileSetup.levelAmbDesc') },
    { key: 'semi_profi', title: t('profileSetup.levelSemiTitle'), desc: t('profileSetup.levelSemiDesc') },
    { key: 'profi', title: t('profileSetup.levelProfiTitle'), desc: t('profileSetup.levelProfiDesc') },
  ];
  const AGE_GROUPS = [
    { key: 'kids_u12', title: t('profileSetup.ageKidsU12') },
    { key: 'jugend_u16', title: t('profileSetup.ageJugendU16') },
    { key: 'jugend_u18', title: t('profileSetup.ageJugendU18') },
    { key: 'erwachsene', title: t('profileSetup.ageErwachsene') },
    { key: 'gemischt', title: t('profileSetup.ageGemischt') },
  ];
  const CLUB_TYPES = [
    { key: 'dorfverein', title: t('profileSetup.clubDorf') },
    { key: 'stadtverein', title: t('profileSetup.clubStadt') },
    { key: 'leistungszentrum', title: t('profileSetup.clubLZ') },
    { key: 'akademie', title: t('profileSetup.clubAkademie') },
    { key: 'sonstige', title: t('profileSetup.clubSonstige') },
  ];

  const [fullName, setFullName] = useState(initialProfile.full_name ?? '');
  const [sport, setSport] = useState(initialProfile.sport ?? 'fussball');
  const [club, setClub] = useState(initialProfile.club ?? '');
  const [level, setLevel] = useState(initialProfile.training_level ?? '');
  const [ageGroup, setAgeGroup] = useState(initialProfile.age_group ?? '');
  const [clubType, setClubType] = useState(initialProfile.club_type ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/profil/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName,
          sport,
          club,
          training_level: level || null,
          age_group: ageGroup || null,
          club_type: clubType || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t('profileSetup.error'));
      router.push('/dashboard');
    } catch (e) {
      setError(e instanceof Error ? e.message : t('profileSetup.error'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-8">
      {/* Basics */}
      <div className="grid gap-4">
        <div>
          <label className="block font-mono text-xs uppercase tracking-[0.12em] text-muted mb-2">{t('profileSetup.nameLabel')}</label>
          <input
            type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)}
            placeholder={t('profileSetup.namePlaceholder')}
            className="w-full px-4 py-3 bg-bone border border-bone-line rounded-md focus:border-gold focus:outline-none"
          />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-mono text-xs uppercase tracking-[0.12em] text-muted mb-2">{t('profileSetup.sportLabel')}</label>
            <select value={sport} onChange={(e) => setSport(e.target.value)}
              className="w-full px-4 py-3 bg-bone border border-bone-line rounded-md focus:border-gold focus:outline-none">
              <option value="fussball">{t('options.sportFussball')}</option>
              <option value="handball">{t('options.sportHandball')}</option>
              <option value="basketball">{t('options.sportBasketball')}</option>
              <option value="volleyball">{t('options.sportVolleyball')}</option>
              <option value="eishockey">{t('options.sportEishockey')}</option>
              <option value="andere">{t('options.sportAndere')}</option>
            </select>
          </div>
          <div>
            <label className="block font-mono text-xs uppercase tracking-[0.12em] text-muted mb-2">{t('profileSetup.clubLabel')}</label>
            <input
              type="text" value={club} onChange={(e) => setClub(e.target.value)}
              className="w-full px-4 py-3 bg-bone border border-bone-line rounded-md focus:border-gold focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Niveau */}
      <div>
        <label className="block font-mono text-xs uppercase tracking-[0.15em] text-gold-deep mb-3">
          {t('profileSetup.levelQ')}
        </label>
        <div className="grid gap-2">
          {LEVELS.map((l) => (
            <button
              key={l.key}
              type="button"
              onClick={() => setLevel(l.key)}
              className={`text-left p-4 rounded-md border-2 transition ${
                level === l.key
                  ? 'bg-ink text-bone border-ink'
                  : 'bg-bone border-bone-line hover:border-gold'
              }`}
            >
              <div className="font-display text-lg tracking-[-0.01em] mb-1">{l.title}</div>
              <div className={`text-sm ${level === l.key ? 'text-bone-soft' : 'text-muted'}`}>
                {l.desc}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Altersgruppe */}
      <div>
        <label className="block font-mono text-xs uppercase tracking-[0.15em] text-gold-deep mb-3">
          {t('profileSetup.ageQ')}
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {AGE_GROUPS.map((a) => (
            <button
              key={a.key}
              type="button"
              onClick={() => setAgeGroup(a.key === ageGroup ? '' : a.key)}
              className={`px-3 py-2.5 rounded-md text-sm font-mono uppercase tracking-[0.05em] border transition ${
                ageGroup === a.key
                  ? 'bg-ink text-bone border-ink'
                  : 'bg-bone border-bone-line text-muted hover:border-gold'
              }`}
            >
              {a.title}
            </button>
          ))}
        </div>
      </div>

      {/* Vereinstyp */}
      <div>
        <label className="block font-mono text-xs uppercase tracking-[0.15em] text-gold-deep mb-3">
          {t('profileSetup.clubTypeQ')}
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {CLUB_TYPES.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => setClubType(c.key === clubType ? '' : c.key)}
              className={`px-3 py-2.5 rounded-md text-sm font-mono uppercase tracking-[0.05em] border transition ${
                clubType === c.key
                  ? 'bg-ink text-bone border-ink'
                  : 'bg-bone border-bone-line text-muted hover:border-gold'
              }`}
            >
              {c.title}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="text-red-600 font-mono text-sm">{error}</div>}

      <div className="pt-4">
        <button
          type="submit"
          disabled={saving || !fullName || !level}
          className="inline-flex items-center gap-2 px-8 py-4 bg-gold text-ink rounded-full font-semibold hover:bg-ink hover:text-gold disabled:opacity-50 transition"
        >
          {saving ? t('profileSetup.saving') : t('profileSetup.submit')} <span className="font-mono">→</span>
        </button>
      </div>
    </form>
  );
}
