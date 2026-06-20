'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { copyToClipboard } from '@/lib/utils/clipboard';

const ANON_THRESHOLD = 5;

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
  const [archivingId, setArchivingId] = useState<string | null>(null);
  const [startingCycle, setStartingCycle] = useState(false);
  const [tokenBusyId, setTokenBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [trends, setTrends] = useState<any[] | null>(null);

  const openCycle = cycles.find((c) => c.status === 'open');
  const closedCycles = cycles.filter((c) => c.status === 'closed');
  const canClose = (openCycle?.response_count ?? 0) >= ANON_THRESHOLD;

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
      notify(`Pulse #${cycles.find((c) => c.id === cycleId)?.cycle_number} geschlossen · ${data.responseCount} Antworten`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler');
    } finally {
      setClosingId(null);
    }
  }

  async function archiveCycle(cycleId: string) {
    if (!confirm('Diesen Pulse-Cycle ohne Auswertung archivieren? Es wird kein Snapshot erzeugt und der Cycle kann nicht wieder geöffnet werden.')) {
      return;
    }
    setArchivingId(cycleId);
    setError(null);
    try {
      const res = await fetch(`/api/seasons/${season.id}/cycles/${cycleId}/archive`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Fehler');
      notify(`Pulse #${cycles.find((c) => c.id === cycleId)?.cycle_number} ohne Auswertung archiviert`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler');
    } finally {
      setArchivingId(null);
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

  async function revokeToken(invitationId: string) {
    if (!confirm('Diesen Token endgültig widerrufen? Der Link nimmt danach keine Antworten mehr an.')) return;
    setTokenBusyId(invitationId);
    setError(null);
    try {
      const res = await fetch(`/api/seasons/${season.id}/invitations/${invitationId}/revoke`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Fehler');
      notify('Token widerrufen');
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler');
    } finally {
      setTokenBusyId(null);
    }
  }

  async function rotateToken(invitationId: string) {
    if (!confirm('Neuen Link für diesen Platz erzeugen? Der bisherige Link wird sofort ungültig.')) return;
    setTokenBusyId(invitationId);
    setError(null);
    try {
      const res = await fetch(`/api/seasons/${season.id}/invitations/${invitationId}/rotate`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Fehler');
      notify('Neuer Link erzeugt — bisheriger Link ist ungültig');
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler');
    } finally {
      setTokenBusyId(null);
    }
  }

  function tokenLabel(i: Invitation): string {
    return i.label ?? 'Spieler-Token';
  }

  function copyAllTokens() {
    const lines = invitations
      .filter((i) => i.status === 'active')
      .map((i) => `${tokenLabel(i)}: ${appUrl}/pulse/${i.token}`)
      .join('\n');
    copyToClipboard(lines);
    notify('Alle aktiven Token-Links kopiert');
  }

  const activeInvites = invitations.filter((i) => i.status === 'active');

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
                {openCycle.response_count} {openCycle.response_count === 1 ? 'Antwort' : 'Antworten'} · schließt am {new Date(openCycle.closes_at).toLocaleDateString('de-AT')}
              </span>
            </div>
            <h3 className="font-display text-2xl mb-4">Spieler haben Zeit bis {new Date(openCycle.closes_at).toLocaleDateString('de-AT')}</h3>

            {!canClose && (
              <div className="mb-4 p-3 bg-petrol-deep/60 border border-bone/20 rounded text-sm text-bone-soft">
                Für eine anonyme Auswertung sind mindestens {ANON_THRESHOLD} vollständige Antworten nötig.
                Aktuell {openCycle.response_count}. Das Schließen mit Snapshot ist erst ab {ANON_THRESHOLD} möglich.
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => closeCycle(openCycle.id)}
                disabled={closingId === openCycle.id || !canClose}
                title={canClose ? undefined : `Erst ab ${ANON_THRESHOLD} Antworten möglich`}
                className="px-5 py-3 bg-gold text-ink rounded-full font-semibold hover:bg-bone disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                {closingId === openCycle.id ? 'Schließt …' : 'Cycle schließen + Snapshot generieren'}
              </button>
              <button
                onClick={() => archiveCycle(openCycle.id)}
                disabled={archivingId === openCycle.id}
                className="px-5 py-3 bg-transparent border border-bone/40 text-bone rounded-full font-semibold hover:bg-bone/10 disabled:opacity-50 transition"
              >
                {archivingId === openCycle.id ? 'Archiviert …' : 'Ohne Auswertung archivieren'}
              </button>
            </div>
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
                  {Array.isArray(c.snapshot?.care_hints) && c.snapshot.care_hints.length > 0 && (
                    <div className="mt-3 p-3 bg-bone border border-bone-line rounded">
                      <div className="font-mono text-[0.6rem] uppercase tracking-[0.1em] text-muted mb-2">
                        Achtsamkeitshinweise · anonym aggregiert · kein Befund über einzelne Personen
                      </div>
                      <ul className="space-y-1.5">
                        {c.snapshot.care_hints.map((h: { topic: string; text: string }, hi: number) => (
                          <li key={hi} className="text-sm leading-snug">
                            <span className="font-medium">{h.topic}:</span> {h.text}
                          </li>
                        ))}
                      </ul>
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
          {activeInvites.length > 0 && (
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
          <>
            <div className="text-sm text-muted mb-3">
              {invitations.length} Token insgesamt · {activeInvites.length} aktiv
            </div>
            <ul className="divide-y divide-bone-line border border-bone-line rounded-md overflow-hidden">
              {invitations.map((i) => {
                const isActive = i.status === 'active';
                const busy = tokenBusyId === i.id;
                return (
                  <li key={i.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-bone">
                    <div className="min-w-0">
                      <div className="font-medium truncate">{tokenLabel(i)}</div>
                      <div className="font-mono text-[0.65rem] text-muted truncate">
                        {isActive ? `${appUrl}/pulse/${i.token}` : 'widerrufen — Link ungültig'}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {isActive ? (
                        <>
                          <button
                            onClick={() => copyToClipboard(`${appUrl}/pulse/${i.token}`)}
                            className="font-mono text-[0.65rem] uppercase tracking-[0.1em] px-2.5 py-1.5 border border-bone-line rounded-full hover:bg-bone-soft transition"
                          >
                            Kopieren
                          </button>
                          <button
                            onClick={() => rotateToken(i.id)}
                            disabled={busy}
                            className="font-mono text-[0.65rem] uppercase tracking-[0.1em] px-2.5 py-1.5 border border-bone-line rounded-full hover:bg-bone-soft disabled:opacity-50 transition"
                          >
                            Neuer Link
                          </button>
                          <button
                            onClick={() => revokeToken(i.id)}
                            disabled={busy}
                            className="font-mono text-[0.65rem] uppercase tracking-[0.1em] px-2.5 py-1.5 border border-red-200 text-red-600 rounded-full hover:bg-red-50 disabled:opacity-50 transition"
                          >
                            Widerrufen
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => rotateToken(i.id)}
                          disabled={busy}
                          className="font-mono text-[0.65rem] uppercase tracking-[0.1em] px-2.5 py-1.5 border border-bone-line rounded-full hover:bg-bone-soft disabled:opacity-50 transition"
                        >
                          Reaktivieren (neuer Link)
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </section>
    </div>
  );
}
