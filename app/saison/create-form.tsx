'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function CreateSeasonForm() {
  const router = useRouter();
  const [name, setName] = useState('Saison 2026/27');
  const [sport, setSport] = useState('fussball');
  const [teamSize, setTeamSize] = useState(20);
  const [interval, setInterval] = useState(30);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError(null);
    try {
      const res = await fetch('/api/seasons/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name, sport,
          team_size_estimate: teamSize,
          pulse_interval_days: interval,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Fehler');
      router.push(`/saison/${data.season.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler');
    } finally {
      setCreating(false);
    }
  }

  return (
    <form onSubmit={submit} className="bg-ink text-bone p-6 rounded-md max-w-2xl">
      <div className="grid gap-4">
        <div>
          <label className="block font-mono text-xs uppercase tracking-[0.15em] text-gold mb-2">Name</label>
          <input
            type="text" required value={name} onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 bg-ink-soft border border-ink-line rounded-md text-bone focus:border-gold focus:outline-none"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-mono text-xs uppercase tracking-[0.15em] text-gold mb-2">Sport</label>
            <select value={sport} onChange={(e) => setSport(e.target.value)}
              className="w-full px-4 py-3 bg-ink-soft border border-ink-line rounded-md text-bone focus:border-gold focus:outline-none">
              <option value="fussball">Fußball</option>
              <option value="handball">Handball</option>
              <option value="basketball">Basketball</option>
              <option value="volleyball">Volleyball</option>
              <option value="eishockey">Eishockey</option>
              <option value="andere">Andere</option>
            </select>
          </div>
          <div>
            <label className="block font-mono text-xs uppercase tracking-[0.15em] text-gold mb-2">Teamgröße (geschätzt)</label>
            <input
              type="number" min={5} max={200} value={teamSize} onChange={(e) => setTeamSize(parseInt(e.target.value) || 20)}
              className="w-full px-4 py-3 bg-ink-soft border border-ink-line rounded-md text-bone focus:border-gold focus:outline-none"
            />
          </div>
        </div>
        <div>
          <label className="block font-mono text-xs uppercase tracking-[0.15em] text-gold mb-2">Pulse-Intervall (Tage zwischen Cycles)</label>
          <input
            type="number" min={7} max={90} value={interval} onChange={(e) => setInterval(parseInt(e.target.value) || 30)}
            className="w-full px-4 py-3 bg-ink-soft border border-ink-line rounded-md text-bone focus:border-gold focus:outline-none"
          />
        </div>

        {error && <div className="text-red-400 text-sm font-mono">{error}</div>}

        <button type="submit" disabled={creating}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gold text-ink rounded-full font-semibold hover:bg-bone disabled:opacity-50 transition">
          {creating ? 'Wird erstellt…' : 'Saison anlegen'} <span className="font-mono">→</span>
        </button>
      </div>
    </form>
  );
}
