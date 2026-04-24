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
  sent: { de: 'Verschickt', color: 'bg-petrol text-bone' },
  opened: { de: 'Geöffnet', color: 'bg-gold-light text-ink' },
  completed: { de: 'Eingegangen', color: 'bg-gold text-ink' },
  expired: { de: 'Abgelaufen', color: 'bg-muted text-bone' },
};

const MIN_PLAYERS = 5;

export function TeamcheckManager({ assessmentId, initialInvitations, appUrl }: Props) {
  const [invitations, setInvitations] = useState<Invitation[]>(initialInvitations);
  const [mode, setMode] = useState<'emails' | 'tokens'>('emails');
  const [emailsText, setEmailsText] = useState('');
  const [tokenCount, setTokenCount] = useState(15);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bulkSuccess, setBulkSuccess] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const completedCount = invitations.filter((i) => i.status === 'completed').length;
  const sentCount = invitations.filter((i) => ['sent','opened','completed'].includes(i.status)).length;
  const progressPct = Math.min(100, Math.round((completedCount / MIN_PLAYERS) * 100));

  async function bulkCreate() {
    setCreating(true);
    setError(null);
    setBulkSuccess(null);
    try {
      const payload: any = { assessment_id: assessmentId, mode };
      if (mode === 'emails') {
        const parsed = emailsText
          .split(/[\n,;\s]+/)
          .map((s) => s.trim())
          .filter((s) => s.length > 0);
        if (parsed.length === 0) {
          setError('Mindestens eine E-Mail-Adresse');
          setCreating(false);
          return;
        }
        payload.emails = parsed;
      } else {
        payload.count = tokenCount;
      }

      const res = await fetch('/api/invitations/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Fehler');

      setInvitations([...(data.invitations ?? []), ...invitations]);
      setBulkSuccess(`${data.count} Einladung${data.count === 1 ? '' : 'en'} erstellt`);
      setEmailsText('');
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
      .map((i, idx) => {
        const label = i.invited_email ?? `Spieler ${String(idx + 1).padStart(2, '0')}`;
        return `${label}: ${appUrl}/teamcheck/${i.token}`;
      })
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
            <span className="text-sm text-muted">{sentCount} verschickt</span>
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

      {/* Bulk creator */}
      <div className="bg-ink text-bone p-6 rounded-md">
        <div className="font-mono text-xs uppercase tracking-[0.18em] text-gold mb-3">
          Spieler einladen
        </div>
        <h3 className="font-display text-xl tracking-[-0.02em] mb-2">
          Mehrere Tokens auf einmal erstellen
        </h3>
        <p className="text-bone-soft text-sm mb-4 leading-[1.5] max-w-[60ch]">
          Du kannst <strong className="text-gold">E-Mails einfügen</strong> (eine pro Zeile, oder kommagetrennt) — wir versenden Einladungen automatisch — oder einfach <strong className="text-gold">anonyme Tokens</strong> generieren und die Links per WhatsApp / Slack / Aushang teilen.
        </p>

        {/* Mode toggle */}
        <div className="inline-flex bg-ink-soft rounded-full p-1 mb-4">
          <button
            onClick={() => setMode('emails')}
            className={`px-4 py-2 rounded-full text-xs font-mono uppercase tracking-[0.1em] transition ${
              mode === 'emails' ? 'bg-gold text-ink' : 'text-bone-soft'
            }`}
          >
            E-Mails (mit Versand)
          </button>
          <button
            onClick={() => setMode('tokens')}
            className={`px-4 py-2 rounded-full text-xs font-mono uppercase tracking-[0.1em] transition ${
              mode === 'tokens' ? 'bg-gold text-ink' : 'text-bone-soft'
            }`}
          >
            Tokens (anonym)
          </button>
        </div>

        {mode === 'emails' ? (
          <textarea
            placeholder="spieler1@email.at&#10;spieler2@email.at&#10;spieler3@email.at"
            value={emailsText}
            onChange={(e) => setEmailsText(e.target.value)}
            rows={6}
            className="w-full px-4 py-3 bg-ink-soft border border-ink-line rounded-md text-bone placeholder-muted focus:border-gold focus:outline-none font-mono text-sm leading-relaxed"
          />
        ) : (
          <div className="flex items-center gap-4">
            <input
              type="number"
              min={1}
              max={50}
              value={tokenCount}
              onChange={(e) => setTokenCount(Math.min(50, Math.max(1, parseInt(e.target.value) || 1)))}
              className="w-24 px-4 py-3 bg-ink-soft border border-ink-line rounded-md text-bone text-center font-display text-2xl focus:border-gold focus:outline-none"
            />
            <span className="text-bone-soft">anonyme Tokens generieren</span>
          </div>
        )}

        <div className="flex gap-3 mt-4">
          <button
            onClick={bulkCreate}
            disabled={creating}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gold text-ink rounded-full font-semibold hover:bg-bone disabled:opacity-50 transition"
          >
            {creating ? 'Erstellt …' : `Einladungen erstellen`} <span className="font-mono">→</span>
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
              Spieler-Einladungen ({invitations.length})
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
                      {inv.invited_email ?? `Spieler-Token #${String(idx + 1).padStart(2, '0')}`}
                    </div>
                    <div className="font-mono text-xs text-muted mt-0.5 truncate">
                      {inv.completed_at
                        ? `Eingegangen ${new Date(inv.completed_at).toLocaleDateString('de-AT')}`
                        : inv.invited_email
                          ? inv.sent_at ? `Verschickt am ${new Date(inv.sent_at).toLocaleDateString('de-AT')}` : 'Noch nicht verschickt'
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
