'use client';

import { useState } from 'react';
import { copyToClipboard } from '@/lib/utils/clipboard';
import { useT, useLocale } from '@/components/i18n/locale-provider';

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

export function InvitationsManager({ assessmentId, initialInvitations, appUrl }: Props) {
  const t = useT();
  const locale = useLocale();
  const fmtDate = (d: string) => new Date(d).toLocaleDateString(locale === 'en' ? 'en-GB' : 'de-AT');

  const STATUS_LABELS: Record<string, { label: string; color: string }> = {
    pending: { label: t('invitations.statusPending'), color: 'bg-bone-line text-ink' },
    sent: { label: t('invitations.statusSent'), color: 'bg-petrol text-bone' },
    opened: { label: t('invitations.statusOpened'), color: 'bg-gold-light text-ink' },
    completed: { label: t('invitations.statusCompleted'), color: 'bg-gold text-ink' },
    expired: { label: t('invitations.statusExpired'), color: 'bg-muted text-bone' },
  };

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
      setError(t('invitations.errEmailRequired'));
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
      if (!res.ok) throw new Error(data.error ?? t('invitations.errGeneric'));

      setInvitations([data.invitation, ...invitations]);
      setEmail('');
    } catch (e) {
      setError(e instanceof Error ? e.message : t('invitations.errGeneric'));
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
      if (!res.ok) throw new Error(data.error ?? t('invitations.errSend'));
      setInvitations(invitations.map((i) =>
        i.id === inv.id ? { ...i, status: 'sent', sent_at: new Date().toISOString() } : i
      ));
    } catch (e) {
      setError(e instanceof Error ? e.message : t('invitations.errGeneric'));
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
            {t('invitations.received')}
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
            ? t('invitations.canGenerate')
            : t('invitations.remaining').replace('{n}', String(minRequired - completedCount))}
        </div>
      </div>

      {/* New invitation */}
      <div className="bg-ink text-bone p-6 rounded-md">
        <div className="font-mono text-xs uppercase tracking-[0.18em] text-gold mb-3">
          {t('invitations.newKicker')}
        </div>
        <h3 className="font-display text-xl tracking-[-0.02em] mb-4">
          {t('invitations.newH3')}
        </h3>
        <p className="text-bone-soft text-sm mb-4 leading-[1.5] max-w-[55ch]">
          {t('invitations.newDesc1')} <strong className="text-gold">{t('invitations.newDescEmph')}</strong> {t('invitations.newDesc2')}
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
            {creating ? t('invitations.creating') : t('invitations.create')} <span className="font-mono">→</span>
          </button>
        </div>
        {error && <div className="text-red-400 text-sm font-mono mt-3">{error}</div>}
      </div>

      {/* Invitations list */}
      {invitations.length > 0 && (
        <div>
          <div className="font-mono text-xs uppercase tracking-[0.18em] text-muted mb-3">
            {t('invitations.yourInvitations')} ({invitations.length})
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
                    {status.label}
                  </span>
                  <div className="flex-grow min-w-0">
                    <div className="font-medium text-sm truncate">{inv.invited_email}</div>
                    <div className="font-mono text-xs text-muted mt-0.5">
                      {inv.completed_at
                        ? t('invitations.receivedOn').replace('{date}', fmtDate(inv.completed_at))
                        : inv.sent_at
                          ? t('invitations.sentOn').replace('{date}', fmtDate(inv.sent_at))
                          : t('invitations.createdOn').replace('{date}', fmtDate(inv.created_at))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {inv.status !== 'completed' && (
                      <>
                        <button
                          onClick={() => copyLink(inv.token)}
                          className="font-mono text-xs uppercase tracking-[0.1em] px-3 py-2 border border-ink rounded-full hover:bg-ink hover:text-bone transition"
                        >
                          {isCopied ? t('invitations.copied') : t('invitations.copyLink')}
                        </button>
                        {inv.status === 'pending' && (
                          <button
                            onClick={() => sendEmail(inv)}
                            disabled={isSending}
                            className="font-mono text-xs uppercase tracking-[0.1em] px-3 py-2 bg-ink text-bone rounded-full hover:bg-gold hover:text-ink disabled:opacity-50 transition"
                          >
                            {isSending ? t('invitations.sending') : t('invitations.sendMail')}
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
