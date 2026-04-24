'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
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
  pending: { de: 'Vorbereitet', color: 'bg-bone-line text-ink' },
  sent: { de: 'Verschickt', color: 'bg-petrol text-bone' },
  opened: { de: 'Geöffnet', color: 'bg-gold-light text-ink' },
  completed: { de: 'Eingegangen', color: 'bg-gold text-ink' },
  expired: { de: 'Abgelaufen', color: 'bg-muted text-bone' },
};

export function InvitationsManager({ assessmentId, initialInvitations, appUrl }: Props) {
  const [invitations, setInvitations] = useState<Invitation[]>(initialInvitations);
  const [email, setEmail] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);

  const completedCount = invitations.filter((i) => i.status === 'completed').length;
  const minRequired = 3;

  async function createInvitation() {
    if (!email.trim()) {
      setError('E-Mail-Adresse erforderlich');
      return;
    }
    setCreating(true);
    setError(null);

    try {
      const res = await fetch('/api/invitations/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assessment_id: assessmentId,
          email: email.trim(),
          invitation_type: 'fremdbild',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Fehler');

      setInvitations([data.invitation, ...invitations]);
      setEmail('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler');
    } finally {
      setCreating(false);
    }
  }

  async function sendEmail(inv: Invitation) {
    setSendingId(inv.id);
    setError(null);
    try {
      const res = await fetch('/api/invitations/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invitation_id: inv.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Fehler beim Versand');
      // update local state
      setInvitations(invitations.map((i) =>
        i.id === inv.id ? { ...i, status: 'sent', sent_at: new Date().toISOString() } : i
      ));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler');
    } finally {
      setSendingId(null);
    }
  }

  function copyLink(token: string) {
    const url = `${appUrl}/einschaetzung/${token}`;
    copyToClipboard(url);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  }

  const progressPct = Math.min(100, Math.round((completedCount / minRequired) * 100));

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="bg-bone-soft p-6 rounded-md border border-bone-line">
        <div className="flex justify-between items-baseline mb-2">
          <span className="font-mono text-xs uppercase tracking-[0.15em] text-muted">
            Eingegangene Fremdbilder
          </span>
          <span className="font-display text-2xl tracking-[-0.02em]">
            {completedCount}<span className="text-muted text-base"> / {minRequired}+</span>
          </span>
        </div>
        <div className="h-1 bg-bone-line rounded overflow-hidden">
          <div
            className="h-full bg-gold transition-[width] duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="font-mono text-xs uppercase tracking-[0.1em] text-muted mt-3">
          {completedCount >= minRequired
            ? 'Du kannst den 360°-Report jetzt generieren.'
            : `Noch ${minRequired - completedCount} Fremdbilder bis zur Auswertung. Anonymität ist erst ab 3 Einschätzungen gewährleistet.`}
        </div>
      </div>

      {/* New invitation */}
      <div className="bg-ink text-bone p-6 rounded-md">
        <div className="font-mono text-xs uppercase tracking-[0.18em] text-gold mb-3">
          Neue Einladung
        </div>
        <h3 className="font-display text-xl tracking-[-0.02em] mb-4">
          Wen willst du einladen?
        </h3>
        <p className="text-bone-soft text-sm mb-4 leading-[1.5] max-w-[55ch]">
          Spieler, Co-Trainer, Sportdirektor, Vertrauenspersonen — wer dich kennt
          und ehrlich antworten würde. Antworten sind <strong className="text-gold">100% anonym</strong>,
          du siehst nie wer was geantwortet hat.
        </p>
        <div className="flex flex-wrap gap-2">
          <input
            type="email"
            placeholder="email@beispiel.at"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && createInvitation()}
            className="flex-grow min-w-[220px] px-4 py-3 bg-ink-soft border border-ink-line rounded-full text-bone placeholder-muted focus:border-gold focus:outline-none"
          />
          <button
            onClick={createInvitation}
            disabled={creating}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gold text-ink rounded-full font-semibold hover:bg-bone disabled:opacity-50 disabled:cursor-wait transition"
          >
            {creating ? 'Erstellt …' : 'Einladung anlegen'} <span className="font-mono">→</span>
          </button>
        </div>
        {error && <div className="text-red-400 text-sm font-mono mt-3">{error}</div>}
      </div>

      {/* Invitations list */}
      {invitations.length > 0 && (
        <div>
          <div className="font-mono text-xs uppercase tracking-[0.18em] text-muted mb-3">
            Deine Einladungen ({invitations.length})
          </div>
          <div className="space-y-2">
            {invitations.map((inv) => {
              const status = STATUS_LABELS[inv.status] ?? STATUS_LABELS.pending;
              const isCopied = copiedToken === inv.token;
              const isSending = sendingId === inv.id;
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
                    <div className="font-medium text-sm truncate">{inv.invited_email}</div>
                    <div className="font-mono text-xs text-muted mt-0.5">
                      {inv.completed_at
                        ? `Eingegangen am ${new Date(inv.completed_at).toLocaleDateString('de-AT')}`
                        : inv.sent_at
                          ? `Verschickt am ${new Date(inv.sent_at).toLocaleDateString('de-AT')}`
                          : `Erstellt am ${new Date(inv.created_at).toLocaleDateString('de-AT')}`}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {inv.status !== 'completed' && (
                      <>
                        <button
                          onClick={() => copyLink(inv.token)}
                          className="font-mono text-xs uppercase tracking-[0.1em] px-3 py-2 border border-ink rounded-full hover:bg-ink hover:text-bone transition"
                        >
                          {isCopied ? '✓ Kopiert' : 'Link kopieren'}
                        </button>
                        {inv.status === 'pending' && (
                          <button
                            onClick={() => sendEmail(inv)}
                            disabled={isSending}
                            className="font-mono text-xs uppercase tracking-[0.1em] px-3 py-2 bg-ink text-bone rounded-full hover:bg-gold hover:text-ink disabled:opacity-50 transition"
                          >
                            {isSending ? 'Sendet…' : 'Per Mail senden'}
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
