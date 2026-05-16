'use client';

import { useState } from 'react';
import { copyToClipboard } from '@/lib/utils/clipboard';

type Invitation = {
  id: string;
  token: string;
  invited_email: string | null;
  invitation_type: string;
  status: string;
  sent_at: string | null;
  completed_at: string | null;
  expires_at: string;
  created_at: string;
};

type Props = {
  assessmentId: string;
  initialInvitations: Invitation[];
  appUrl: string;
};

const STATUS_LABELS: Record<string, { de: string; color: string }> = {
  pending: { de: 'Bereit', color: 'bg-bone-line text-ink' },
  sent: { de: 'Aktiv', color: 'bg-petrol text-bone' },
  opened: { de: 'Geöffnet', color: 'bg-gold-light text-ink' },
  completed: { de: 'Eingegangen', color: 'bg-gold text-ink' },
  expired: { de: 'Abgelaufen', color: 'bg-muted text-bone' },
};

const MIN_PLAYERS = 5;

export function TeamcheckManager({ assessmentId, initialInvitations, appUrl }: Props) {
  const [invitations, setInvitations] = useState<Invitation[]>(initialInvitations);
  const [tokenCount, setTokenCount] = useState(15);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bulkSuccess, setBulkSuccess] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const completedCount = invitations.filter((i) => i.status === 'completed').length;
  const activeCount = invitations.filter((i) => ['pending', 'sent', 'opened'].includes(i.status)).length;
  const progressPct = Math.min(100, Math.round((completedCount / MIN_PLAYERS) * 100));

  async function bulkCreate() {
    setCreating(true);
    setError(null);
    setBulkSuccess(null);
    try {
      const res = await fetch('/api/invitations/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assessment_id: assessmentId,
          mode: 'tokens',
          count: tokenCount,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Fehler');

      setInvitations([...(data.invitations ?? []), ...invitations]);
      setBulkSuccess(`${data.count} Token-Link${data.count === 1 ? '' : 's'} erstellt`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler');
    } finally {
      setCreating(false);
      setTimeout(() => setBulkSuccess(null), 4000);
    }
  }

  function copyLink(inv: Invitation) {
    const url = `${appUrl}/teamcheck/${inv.token}`;
    copyToClipboard(url);
    setCopiedId(inv.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function copyAllLinks() {
    const lines = invitations
      .filter((i) => i.status !== 'completed' && i.status !== 'expired')
      .map((i, idx) => `Spieler ${String(idx + 1).padStart(2, '0')}: ${appUrl}/teamcheck/${i.token}`)
      .join('\n');
    copyToClipboard(lines);
    setBulkSuccess('Alle Links kopiert');
    setTimeout(() => setBulkSuccess(null), 3000);
  }

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="bg-bone-soft p-6 rounded-md border border-bone-line">
        <div className="flex justify-between items-baseline mb-3">
          <span className="font-mono text-xs uppercase tracking-[0.15em] text-muted">
            Spieler-Antworten
          </span>
          <div className="flex gap-6 items-baseline">
            <span className="text-sm text-muted">{activeCount} Links aktiv</span>
            <span className="font-display text-2xl tracking-[-0.02em]">
              {completedCount}<span className="text-muted text-base"> / {MIN_PLAYERS}+ benötigt</span>
            </span>
          </div>
        </div>
        <div className="h-1 bg-bone-line rounded overflow-hidden">
          <div
            className="h-full bg-gold transition-[width] duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="font-mono text-xs uppercase tracking-[0.1em] text-muted mt-3">
          {completedCount >= MIN_PLAYERS
            ? '✓ Genug Spieler-Antworten — du kannst den TeamCheck-Report jetzt generieren.'
            : `Noch ${MIN_PLAYERS - completedCount} Spieler-Antworten bis zur Auswertung. Anonymität ist erst ab 5 Antworten gewährleistet.`}
        </div>
      </div>

      {/* Token generator (anonymous-only) */}
      <div className="bg-ink text-bone p-6 rounded-md">
        <div className="font-mono text-xs uppercase tracking-[0.18em] text-gold mb-3">
          Spieler-Links erzeugen
        </div>
        <h3 className="font-display text-xl tracking-[-0.02em] mb-2">
          Anonyme Token-Links erstellen
        </h3>
        <p className="text-bone-soft text-sm mb-4 leading-[1.5] max-w-[60ch]">
          Erzeuge anonyme Token-Links und verteile sie selbst per QR-Code, WhatsApp,
          Slack oder Aushang. <strong className="text-gold">Die App speichert keine
          Spieler-E-Mail-Adressen</strong> — die Antworten der Spieler kannst du
          nachher ausschließlich aggregiert sehen.
        </p>

        <div className="flex items-center gap-4">
          <input
            type="number"
            min={1}
            max={50}
            value={tokenCount}
            onChange={(e) =>
              setTokenCount(Math.min(50, Math.max(1, parseInt(e.target.value) || 1)))
            }
            className="w-24 px-4 py-3 bg-ink-soft border border-ink-line rounded-md text-bone text-center font-display text-2xl focus:border-gold focus:outline-none"
          />
          <span className="text-bone-soft">anonyme Token-Links generieren</span>
        </div>

        <div className="flex gap-3 mt-4">
          <button
            onClick={bulkCreate}
            disabled={creating}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gold text-ink rounded-full font-semibold hover:bg-bone disabled:opacity-50 transition"
          >
            {creating ? 'Erstellt …' : 'Token-Links erstellen'} <span className="font-mono">→</span>
          </button>
        </div>

        {error && <div className="text-red-400 text-sm font-mono mt-3">{error}</div>}
        {bulkSuccess && <div className="text-gold text-sm font-mono mt-3">✓ {bulkSuccess}</div>}
      </div>

      {/* Invitations list */}
      {invitations.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="font-mono text-xs uppercase tracking-[0.18em] text-muted">
              Spieler-Token ({invitations.length})
            </div>
            <button
              onClick={copyAllLinks}
              className="font-mono text-[0.65rem] uppercase tracking-[0.12em] px-3 py-1.5 bg-ink text-bone rounded-full hover:bg-gold hover:text-ink transition"
            >
              Alle aktiven Links kopieren
            </button>
          </div>

          <div className="space-y-2">
            {invitations.map((inv, idx) => {
              const status = STATUS_LABELS[inv.status] ?? STATUS_LABELS.pending;
              const isCopied = copiedId === inv.id;
              return (
                <div
                  key={inv.id}
                  className="flex flex-wrap items-center gap-4 p-4 bg-bone border border-bone-line rounded-md"
                >
                  <span
                    className={`font-mono text-[0.65rem] uppercase tracking-[0.14em] px-3 py-1 rounded-full ${status.color}`}
                  >
                    {status.de}
                  </span>
                  <div className="flex-grow min-w-0">
                    <div className="font-medium text-sm truncate">
                      Spieler-Token #{String(idx + 1).padStart(2, '0')}
                    </div>
                    <div className="font-mono text-xs text-muted mt-0.5 truncate">
                      {inv.completed_at
                        ? `Eingegangen ${new Date(inv.completed_at).toLocaleDateString('de-AT')}`
                        : `Token: …${inv.token.slice(-8)}`}
                    </div>
                  </div>
                  {inv.status !== 'completed' && (
                    <button
                      onClick={() => copyLink(inv)}
                      className="font-mono text-xs uppercase tracking-[0.1em] px-3 py-2 border border-ink rounded-full hover:bg-ink hover:text-bone transition"
                    >
                      {isCopied ? '✓ Kopiert' : 'Link kopieren'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
