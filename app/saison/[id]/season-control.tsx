'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Cycle = {
  id: string;
  cycle_number: number;
  status: string;
  response_count: number;
  started_at: string;
  closes_at: string;
  closed_at: string | null;
  snapshot: any;
};

type Invitation = {
  id: string;
  token: string;
  label: string | null;
  status: string;
};

type Season = {
  id: string;
  name: string;
  status: string;
};

type Props = {
  season: Season;
  cycles: Cycle[];
  invitations: Invitation[];
  appUrl: string;
};

const DIM_LABELS: Record<string, string> = {
  coach_impact: 'Coach Impact',
  psy_safety: 'Psy Sicherheit',
  team_klima: 'Teamklima',
  belastung: 'Belastung',
  wir_gefuehl: 'Wir-Gefühl',
  fokus: 'Fokus',
};

export function SeasonControl({ season, cycles, invitations, appUrl }: Props) {
  const router = useRouter();
  const [bulkCount, setBulkCount] = useState(20);
  const [creating, setCreating] = useState(false);
  const [closingId, setClosingId] = useState<string | null>(null);
  const [startingCycle, setStartingCycle] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [trends, setTrends] = useState<any[] | null>(null);

  const openCycle = cycles.find((c) => c.status === 'open');
  const closedCycles = cycles.filter((c) => c.status === 'closed');

  function notify(msg: string) {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 4000);
  }

  async function startCycle() {
    setStartingCycle(true);
    setError(null);
    try {
      const res = await fetch(`/api/seasons/${season.id}/cycles/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ season_id: season.id, closes_in_days: 14 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Fehler');
      notify(`Pulse-Cycle #${data.cycle.cycle_number} gestartet.`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler');
    } finally {
      setStartingCycle(false);
    }
  }

  async function closeCycle(cycleId: string) {
    setClosingId(cycleId);
    setError(null);
    try {
      const res = await fetch(`/api/seasons/${season.id}/cycles/${cycleId}/close`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Fehler');
      setTrends(data.trends ?? []);
      notify(`Pulse #${cycles.find(c => c.id === cycleId)?.cycle_number} geschlossen · ${data.responseCount} Antworten`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler');
    } finally {
      setClosingId(null);
    }
  }

  async function generateTokens() {
    setCreating(true);
    setError(null);
    try {
      const res = await fetch(`/api/seasons/${season.id}/invitations/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ season_id: season.id, count: bulkCount }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Fehler');
      notify(`${data.invitations?.length ?? 0} Token erstellt`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler');
    } finally {
      setCreating(false);
    }
  }

  function copyAllTokens() {
    const lines = invitations
      .filter((i) => i.status === 'active')
      .map((i, idx) => `${i.label ?? `Spieler ${String(idx + 1).padStart(2, '0')}`}: ${appUrl}/pulse/${i.token}`)
      .join('\n');
    navigator.clipboard.writeText(lines);
    notify('Alle Token-Links kopiert');
  }

  return (
    <div className="space-y-10">
      {success && <div className="bg-gold/10 border border-gold text-gold-deep p-3 rounded-md font-mono text-sm">✓ {success}</div>}
      {error && <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-md font-mono text-sm">{error}</div>}

      {/* Active Cycle */}
      <section>
        <h2 className="font-display text-2xl tracking-[-0.02em] mb-5">Aktiver Pulse-Cycle</h2>
        {openCycle ? (
          <div className="bg-petrol text-bone p-6 rounded-md">
            <div className="flex justify-between items-baseline mb-3">
              <span className="font-mono text-xs uppercase tracking-[0.18em] text-gold">
                Pulse #{openCycle.cycle_number} · Offen
              </span>
              <span className="text-bone-soft text-sm">
                {openCycle.response_count} Antworten · schließt am {new Date(openCycle.closes_at).toLocaleDateString('de-AT')}
              </span>
            </div>
            <h3 className="font-display text-2xl mb-4">Spieler haben Zeit bis {new Date(openCycle.closes_at).toLocaleDateString('de-AT')}</h3>
            <button
              onClick={() => closeCycle(openCycle.id)}
              disabled={closingId === openCycle.id}
              className="px-5 py-3 bg-gold text-ink rounded-full font-semibold hover:bg-bone disabled:opacity-50 transition"
            >
              {closingId === openCycle.id ? 'Schließt …' : 'Cycle jetzt schließen + Snapshot generieren'}
            </button>
          </div>
        ) : (
          <div className="bg-bone-soft border border-bone-line p-6 rounded-md">
            <p className="font-editorial italic text-lg text-muted mb-4">
              Aktuell läuft kein Pulse-Cycle.
            </p>
            <button
              onClick={startCycle}
              disabled={startingCycle}
              className="inline-flex items-center gap-2 px-6 py-3 bg-ink text-bone rounded-full font-semibold hover:bg-gold hover:text-ink disabled:opacity-50 transition"
            >
              {startingCycle ? 'Startet …' : 'Neuen Pulse-Cycle starten (14 Tage)'} <span className="font-mono">→</span>
            </button>
          </div>
        )}
      </section>

      {/* Trends from latest closing */}
      {trends && trends.length > 0 && (
        <section>
          <h2 className="font-display text-2xl tracking-[-0.02em] mb-5">Trend-Erkennung</h2>
          <div className="space-y-3">
            {trends.map((t, i) => {
              const sevColor =
                t.severity === 'kritisch' ? 'bg-red-500 text-bone' :
                t.severity === 'hoch' ? 'bg-gold text-ink' :
                'bg-bone-line text-ink';
              return (
                <div key={i} className="flex flex-wrap items-center gap-4 p-4 bg-bone border border-bone-line rounded-md">
                  <span className={`font-mono text-[0.65rem] uppercase tracking-[0.14em] px-3 py-1 rounded-full ${sevColor}`}>
                    {t.severity}
                  </span>
                  <div className="flex-grow">
                    <div className="font-medium">{DIM_LABELS[t.dimension] ?? t.dimension}</div>
                    <div className="font-mono text-xs text-muted mt-0.5">
                      {t.previous} → {t.current} ({t.delta >= 0 ? '+' : ''}{t.delta}) · {t.direction}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* History */}
      {closedCycles.length > 0 && (
        <section>
          <h2 className="font-display text-2xl tracking-[-0.02em] mb-5">Historie</h2>
          <div className="space-y-3">
            {closedCycles.map((c) => {
              const dims = c.snapshot?.dimensions ?? {};
              return (
                <div key={c.id} className="p-5 bg-bone-soft border border-bone-line rounded-md">
                  <div className="flex justify-between items-baseline mb-3">
                    <div>
                      <div className="font-display text-lg">Pulse #{c.cycle_number}</div>
                      <div className="font-mono text-xs text-muted">
                        {c.response_count} Antworten · geschlossen am {c.closed_at ? new Date(c.closed_at).toLocaleDateString('de-AT') : '—'}
                      </div>
                    </div>
                  </div>
                  {Object.keys(dims).length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                      {Object.entries(dims).map(([dim, val]) => (
                        <div key={dim} className="bg-bone p-2 rounded">
                          <div className="font-mono text-[0.6rem] uppercase tracking-[0.1em] text-muted truncate">{DIM_LABELS[dim] ?? dim}</div>
                          <div className="font-display text-lg text-gold-deep">{Number(val).toFixed(2)}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Tokens */}
      <section>
        <div className="flex justify-between items-center mb-5">
          <h2 className="font-display text-2xl tracking-[-0.02em]">Spieler-Token</h2>
          {invitations.filter((i) => i.status === 'active').length > 0 && (
            <button
              onClick={copyAllTokens}
              className="font-mono text-xs uppercase tracking-[0.1em] px-3 py-2 bg-ink text-bone rounded-full hover:bg-gold hover:text-ink transition"
            >
              Alle Links kopieren
            </button>
          )}
        </div>

        <div className="bg-ink text-bone p-5 rounded-md mb-4">
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="number" min={1} max={100} value={bulkCount}
              onChange={(e) => setBulkCount(Math.min(100, Math.max(1, parseInt(e.target.value) || 1)))}
              className="w-20 px-3 py-2 bg-ink-soft border border-ink-line rounded text-bone text-center focus:border-gold focus:outline-none"
            />
            <span className="text-bone-soft">weitere Token generieren</span>
            <button
              onClick={generateTokens}
              disabled={creating}
              className="px-4 py-2 bg-gold text-ink rounded-full font-semibold hover:bg-bone disabled:opacity-50 transition"
            >
              {creating ? 'Erstellt …' : 'Erstellen'}
            </button>
          </div>
        </div>

        {invitations.length > 0 && (
          <div className="text-sm text-muted">
            {invitations.length} Token insgesamt · {invitations.filter((i) => i.status === 'active').length} aktiv
          </div>
        )}
      </section>
    </div>
  );
}
